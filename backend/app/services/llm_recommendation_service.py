"""
Real LLM-powered advisory recommendation service.

Grounds recommendations strictly on structured verification findings.
Enforces the architectural invariant: AI recommendation is purely advisory
and NEVER modifies the officer's final decision.
"""
import json
import logging
import os
from typing import Any, Dict, List, Optional
from flask import current_app

logger = logging.getLogger(__name__)


def _get_gemini_client():
    """Lazily initialize Gemini client. Returns None if unconfigured."""
    api_key = os.getenv("LLM_API_KEY") or (
        current_app.config.get("LLM_API_KEY") if current_app else None
    )
    if not api_key:
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model_name = os.getenv("LLM_MODEL") or (
            current_app.config.get("LLM_MODEL", "gemini-1.5-flash") if current_app else "gemini-1.5-flash"
        )
        return genai.GenerativeModel(model_name)
    except Exception as e:
        logger.warning("Could not initialize Gemini client for recommendation: %s", e)
        return None


def generate_llm_recommendation(
    compliance_score: int,
    risk_assessment: Dict[str, Any],
    requirements_results: List[Dict[str, Any]],
    cross_checks: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    """
    Calls the LLM to generate an explainable recommendation based strictly on verified findings.
    Returns None if LLM is unavailable or encounters error, triggering fallback.
    """
    total = len(requirements_results)
    passed = sum(1 for r in requirements_results if r.get("status") in ("VERIFIED", "PASS", "VERIFIED_PASS"))
    failed_items = [
        f"{r.get('name', 'Unknown')}: {r.get('reason', 'Not verified')}"
        for r in requirements_results
        if r.get("status") not in ("VERIFIED", "PASS", "VERIFIED_PASS")
    ]
    discrepancies = [
        f"{c.get('field', 'Field')}: {c.get('details', '')}"
        for c in cross_checks
        if c.get("status") == "MISMATCH"
    ]
    risk_level = risk_assessment.get("risk_level", "LOW")

    prompt = (
        "You are an AI Compliance Auditor assisting an Indian Government Procurement Officer.\n"
        "Evaluate the following verified facts for a submitted bid and provide a concise, explainable recommendation.\n\n"
        "STRICT CONSTRAINTS:\n"
        "1. Do not invent or assume any facts outside what is given below.\n"
        "2. Output valid JSON ONLY with the following keys:\n"
        "   - status: 'PASS' if risk is LOW and score >= 75 and no critical failures; else 'REVIEW_REQUIRED'\n"
        "   - summary: 1-2 sentence executive summary\n"
        "   - reasons: list of 3-5 factual bullet points supporting the recommendation\n\n"
        f"DATA:\n"
        f"- Compliance Score: {compliance_score} / 100\n"
        f"- Risk Level: {risk_level}\n"
        f"- Requirements Passed: {passed} of {total}\n"
        f"- Deficient Requirements: {json.dumps(failed_items)}\n"
        f"- Cross-Verification Contradictions: {json.dumps(discrepancies)}\n"
    )

    try:
        provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        if provider == "openai":
            from app.services.openai_service import generate_text
            result = generate_text(prompt)
            if result is None:
                return None
            raw_text, model_name = result
            raw_text = raw_text.strip()
        else:
            model = _get_gemini_client()
            if model is None:
                return None
            response = model.generate_content(prompt)
            raw_text = response.text.strip()
            model_name = os.getenv("LLM_MODEL") or (
                current_app.config.get("LLM_MODEL", "gemini-1.5-flash") if current_app else "gemini-1.5-flash"
            )
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            raw_text = "\n".join(lines).strip()

        parsed = json.loads(raw_text)
        if not isinstance(parsed, dict) or "status" not in parsed or "summary" not in parsed:
            return None

        return {
            "status": parsed.get("status", "REVIEW_REQUIRED"),
            "summary": parsed.get("summary", ""),
            "reasons": parsed.get("reasons", []),
            "authority_disclaimer": "AI recommendations are strictly decision support. The human Procurement Officer retains exclusive final decision authority.",
            "generated_by": "LLM",
            "model_name": model_name,
        }
    except Exception as e:
        logger.warning("LLM recommendation generation failed: %s", e)
        return None
