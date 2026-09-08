import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.tender_extraction.requirement_extractor import TenderRequirementExtractor


def test_extractor_preserves_pages_and_structures_requirements():
    result = TenderRequirementExtractor().extract_requirements(
        "TND-001",
        "DOC-001",
        pages=[
            {"page": 3, "text": "The bidder must possess a valid and active GST registration."},
            {"page": 7, "text": "The bidder must have an average annual turnover of Rs. 5 crore during the last three financial years."},
            {"page": 12, "text": "The bidder must provide OEM authorization."},
        ],
    )
    assert result.tender_id == "TND-001"
    assert result.document_id == "DOC-001"
    assert result.total_requirements == 3
    assert {item.source_page for item in result.requirements} == {3, 7, 12}
    turnover = next(item for item in result.requirements if item.title == "Minimum Annual Turnover")
    assert turnover.category == "FINANCIAL"
    assert turnover.expected_value == 50000000
    assert turnover.operator == ">="
    assert turnover.confidence >= 0.8


def test_extractor_marks_optional_clauses_without_compliance_decisions():
    result = TenderRequirementExtractor().extract_requirements(
        "TND-EDGE",
        "DOC-EDGE",
        pages=[{"page": 2, "text": "The bidder may provide an optional Udyam registration certificate."}],
    )
    assert len(result.requirements) == 1
    requirement = result.requirements[0]
    assert requirement.mandatory is False
    assert requirement.mandatory_level == "OPTIONAL"
    assert not hasattr(requirement, "compliance_status")


@pytest.mark.parametrize("bad_pages", [[], [{"page": 1, "text": ""}]])
def test_extraction_result_can_represent_no_detected_requirements(bad_pages):
    result = TenderRequirementExtractor().extract_requirements("TND-EMPTY", "DOC-EMPTY", pages=bad_pages)
    assert result.requirements == []
    assert result.total_requirements == 0
