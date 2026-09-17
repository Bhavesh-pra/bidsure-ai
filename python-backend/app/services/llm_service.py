"""
Real LLM-powered document field extraction service.

Connects to Google Gemini (or falls back gracefully) to extract structured
fields from OCR text. The LLM extracts fields ONLY — it does NOT evaluate
compliance or make decisions. That boundary is enforced architecturally.
"""
import json
import logging
import os
from typing import Any, Dict, List, Optional

from flask import current_app

logger = logging.getLogger(__name__)

# Document-type-specific extraction prompts
EXTRACTION_PROMPTS = {
    "GST_CERTIFICATE": {
        "instruction": (
            "Extract the following fields from this GST Certificate document. "
            "Return ONLY a JSON object with these keys: "
            "gstin, legal_name, trade_name, registration_status, registration_date, "
            "state_jurisdiction, address, taxpayer_type. "
            "If a field is not found, set its value to null."
        ),
        "expected_fields": [
            "gstin", "legal_name", "trade_name", "registration_status",
            "registration_date", "state_jurisdiction", "address", "taxpayer_type",
        ],
    },
    "PAN_DOCUMENT": {
        "instruction": (
            "Extract the following fields from this PAN Card/Document. "
            "Return ONLY a JSON object with these keys: "
            "pan_number, name, father_name, date_of_birth, pan_type. "
            "If a field is not found, set its value to null."
        ),
        "expected_fields": ["pan_number", "name", "father_name", "date_of_birth", "pan_type"],
    },
    "PAN_CARD": {
        "instruction": (
            "Extract the following fields from this PAN Card/Document. "
            "Return ONLY a JSON object with these keys: "
            "pan_number, name, father_name, date_of_birth, pan_type. "
            "If a field is not found, set its value to null."
        ),
        "expected_fields": ["pan_number", "name", "father_name", "date_of_birth", "pan_type"],
    },
    "UDYAM_CERTIFICATE": {
        "instruction": (
            "Extract the following fields from this Udyam Registration Certificate. "
            "Return ONLY a JSON object with these keys: "
            "udyam_registration_number, enterprise_name, organization_type, "
            "registration_date, major_activity, social_category, enterprise_type, address. "
            "If a field is not found, set its value to null."
        ),
        "expected_fields": [
            "udyam_registration_number", "enterprise_name", "organization_type",
            "registration_date", "major_activity", "social_category",
            "enterprise_type", "address",
        ],
    },
    "OEM_AUTHORIZATION": {
        "instruction": (
            "Extract the following fields from this OEM Authorization Letter. "
            "Return ONLY a JSON object with these keys: "
            "oem_name, authorized_dealer, product_category, "
            "authorization_date, validity_period, territory. "
            "If a field is not found, set its value to null."
        ),
        "expected_fields": [
            "oem_name", "authorized_dealer", "product_category",
            "authorization_date", "validity_period", "territory",
        ],
    },
    "LOCAL_CONTENT_DECLARATION": {
        "instruction": (
            "Extract the following fields from this Local Content Declaration/Certificate. "
            "Return ONLY a JSON object with these keys: "
            "local_content_percentage, product_description, manufacturer_name, "
            "declaration_date, certifying_authority. "
            "If a field is not found, set its value to null."
        ),
        "expected_fields": [
            "local_content_percentage", "product_description", "manufacturer_name",
            "declaration_date", "certifying_authority",
        ],
    },
}

# Default prompt for unrecognized document types
DEFAULT_PROMPT = {
    "instruction": (
        "Extract all identifiable structured fields from this document. "
        "Return ONLY a JSON object where keys are field names (snake_case) "
        "and values are the extracted text. If a field is unclear, set to null."
    ),
    "expected_fields": [],
}


def _get_gemini_client():
    """Lazily initialize the Gemini client. Returns None if unavailable."""
    api_key = os.getenv("LLM_API_KEY") or (
        current_app.config.get("LLM_API_KEY") if current_app else None
    )
    if not api_key:
        logger.info("LLM_API_KEY not configured — LLM extraction disabled")
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model_name = os.getenv("LLM_MODEL") or (
            current_app.config.get("LLM_MODEL", "gemini-1.5-flash") if current_app else "gemini-1.5-flash"
        )
        return genai.GenerativeModel(model_name)
    except ImportError:
        logger.warning("google-generativeai package not installed")
        return None
    except Exception as e:
        logger.error("Failed to initialize Gemini client: %s", e)
        return None


def extract_fields_with_llm(
    ocr_text: str,
    document_type: str,
    document_id: str = "",
) -> Optional[Dict[str, Any]]:
    """
    Call the LLM to extract structured fields from OCR text.

    Returns a dict with keys: fields (list of field dicts), extraction_method, model_name.
    Returns None if LLM is unavailable or extraction fails (caller should fall back to regex).
    """
    prompt_config = EXTRACTION_PROMPTS.get(document_type, DEFAULT_PROMPT)

    full_prompt = (
        f"You are a document analysis AI for Indian government procurement compliance.\n\n"
        f"DOCUMENT TYPE: {document_type}\n\n"
        f"TASK: {prompt_config['instruction']}\n\n"
        f"IMPORTANT RULES:\n"
        f"- Return ONLY valid JSON, no markdown, no explanation, no code fences.\n"
        f"- Extract values exactly as they appear in the document.\n"
        f"- For dates, use the format as found in the document.\n"
        f"- For registration numbers (GSTIN, PAN, Udyam), preserve exact formatting.\n\n"
        f"DOCUMENT TEXT:\n---\n{ocr_text[:8000]}\n---\n"
    )

    try:
        provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        if provider == "openai":
            from app.services.openai_service import generate_text
            result = generate_text(full_prompt)
            if result is None:
                return None
            raw_text, model_name = result
            raw_text = raw_text.strip()
        else:
            model = _get_gemini_client()
            if model is None:
                return None
            response = model.generate_content(full_prompt)
            raw_text = response.text.strip()
            model_name = os.getenv("LLM_MODEL") or (
                current_app.config.get("LLM_MODEL", "gemini-1.5-flash") if current_app else "gemini-1.5-flash"
            )

        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            lines = raw_text.split("\n")
            # Remove first and last lines if they are code fences
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            raw_text = "\n".join(lines).strip()

        parsed = json.loads(raw_text)
        if not isinstance(parsed, dict):
            logger.warning("LLM returned non-dict JSON: %s", type(parsed))
            return None

        # Convert to evidence field list
        fields = []
        for key, value in parsed.items():
            if value is not None and str(value).strip():
                fields.append({
                    "field": key,
                    "value": str(value).strip(),
                    "page": 1,
                    "confidence": 0.85,
                    "source": "BIDDER_DOCUMENT",
                })

        logger.info(
            "LLM extraction successful for doc=%s type=%s fields=%d model=%s",
            document_id, document_type, len(fields), model_name,
        )

        return {
            "fields": fields,
            "extraction_method": "OCR_LLM",
            "model_name": model_name,
        }

    except json.JSONDecodeError as e:
        logger.warning("LLM returned invalid JSON for doc=%s: %s", document_id, e)
        return None
    except Exception as e:
        logger.error("LLM extraction failed for doc=%s: %s", document_id, e)
        return None
