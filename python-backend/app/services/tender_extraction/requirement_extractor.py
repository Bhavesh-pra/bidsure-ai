import re
from typing import Dict, Iterable, List

from app.domain.requirement.schemas import ComparisonOperator, RequirementCategory, RequirementSchema
from app.domain.tender.contracts import ExtractedClause, ExtractedRequirement, ExtractionResult


class TenderRequirementExtractor:
    """Deterministic first-pass extractor for text PDFs.

    This deliberately produces requirements only. It does not make bidder
    compliance, risk, or recommendation decisions.
    """

    def extract_requirements(self, tender_id: str, document_id: str, pages: Iterable[Dict[str, object]], **kwargs) -> ExtractionResult:
        requirements: List[ExtractedRequirement] = []
        clauses: List[ExtractedClause] = []
        seen = set()
        for page in pages:
            page_number = int(page["page"])
            text = str(page.get("text") or "")
            for clause in self._clauses(text):
                clauses.append(ExtractedClause(text=clause, page_number=page_number))
                extracted = self._extract_clause(clause, page_number)
                if extracted and extracted.title.lower() not in seen:
                    seen.add(extracted.title.lower())
                    requirements.append(extracted)
        return ExtractionResult(
            tender_id=tender_id,
            document_id=document_id,
            requirements=requirements,
            raw_clauses=clauses,
            model_name="bidsure-deterministic-v1",
        )

    @staticmethod
    def _clauses(text: str) -> List[str]:
        return [part.strip(" .;:-") for part in re.split(r"(?<!\b(?:Rs|No|Dr|Ms|Mr)\.)(?<=[.;])\s+|\n+", text, flags=re.IGNORECASE) if len(part.strip()) >= 12]

    def _extract_clause(self, clause: str, page: int) -> ExtractedRequirement | None:
        lower = clause.lower()
        is_optional = any(word in lower for word in ("optional", "may provide", "if applicable"))
        mandatory = not is_optional and any(word in lower for word in ("must", "shall", "required", "should"))
        if not mandatory and not is_optional:
            return None

        category = self._category(lower)
        title = self._title(lower)
        expected_value, operator, unit, period = self._threshold(lower)
        confidence = 0.94 if expected_value is not None else 0.88
        data = {
            "id": None,
            "title": title,
            "description": clause,
            "category": category,
            "mandatory": not is_optional,
            "mandatory_level": "OPTIONAL" if is_optional else "MANDATORY",
            "review_status": "REVIEW" if confidence < 0.8 else "REQUIRED",
            "operator": operator,
            "expected_value": expected_value,
            "unit": unit,
            "evaluation_period": period,
            "source_clause": clause[:100],
            "source_page": page,
            "confidence": confidence,
        }
        validated = RequirementSchema(id=f"REQ-TMP-{page}-{abs(hash(clause)) % 100000}", **{k: v for k, v in data.items() if k != "id"})
        return ExtractedRequirement(**validated.model_dump())

    @staticmethod
    def _category(text: str) -> str:
        if any(k in text for k in ("turnover", "earnings", "financial", "emd", "earnest money")):
            return RequirementCategory.FINANCIAL.value
        if "gst" in text or "goods and services tax" in text:
            return RequirementCategory.STATUTORY.value
        if any(k in text for k in ("pan", "udyam", "registration")):
            return RequirementCategory.REGISTRATION.value
        if any(k in text for k in ("authorization", "certificate", "document", "submit", "provide")):
            return RequirementCategory.DOCUMENT.value
        if any(k in text for k in ("experience", "technical", "delivery", "equipment", "certification")):
            return RequirementCategory.TECHNICAL.value
        return RequirementCategory.ELIGIBILITY.value

    @staticmethod
    def _title(text: str) -> str:
        if "turnover" in text:
            return "Minimum Annual Turnover"
        if "gst" in text:
            return "GST Registration"
        if "pan" in text:
            return "PAN Requirement"
        if "udyam" in text:
            return "Udyam Registration"
        if "oem" in text:
            return "OEM Authorization"
        if "experience" in text:
            return "Similar Project Experience"
        if "emd" in text or "earnest money" in text:
            return "Earnest Money Deposit"
        return text[:1].upper() + text[1:][:70]

    @staticmethod
    def _threshold(text: str):
        crore = re.search(r"(?:rs\.?|inr|₹)?\s*([\d,.]+)\s*crore", text)
        lakh = re.search(r"(?:rs\.?|inr|₹)?\s*([\d,.]+)\s*lakh", text)
        years = re.search(r"(?:at least|minimum of)\s+(\d+)\s+years?", text)
        projects = re.search(r"(?:at least|minimum of)\s+(\d+)\s+(?:similar )?projects?", text)
        if crore:
            return float(crore.group(1).replace(",", "")) * 10000000, ComparisonOperator.GTE.value, "INR", "LAST_3_FINANCIAL_YEARS" if "three" in text or "3" in text else None
        if lakh:
            return float(lakh.group(1).replace(",", "")) * 100000, ComparisonOperator.GTE.value, "INR", None
        if years:
            return int(years.group(1)), ComparisonOperator.GTE.value, "YEARS", None
        if projects:
            return int(projects.group(1)), ComparisonOperator.GTE.value, "PROJECTS", None
        if "active" in text and "gst" in text:
            return "ACTIVE", ComparisonOperator.EQUALS.value, "STATUS", "CURRENT"
        return None, None, None, None
