import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.domain.requirement.schemas import RequirementSchema
from app.domain.tender.schemas import TenderSchema
from pydantic import ValidationError

MOCK_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../mock-data"))

def test_mock_files_exist():
    expected_files = [
        "organizations.json",
        "tenders.json",
        "requirements.json",
        "bidders.json",
        "gst.json",
        "udyam.json",
        "pan.json",
    ]
    for filename in expected_files:
        filepath = os.path.join(MOCK_DATA_DIR, filename)
        assert os.path.exists(filepath), f"Missing mock data file: {filename}"
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            assert data is not None, f"Empty mock data file: {filename}"

def test_mock_requirements_validate_against_schema():
    filepath = os.path.join(MOCK_DATA_DIR, "requirements.json")
    with open(filepath, "r", encoding="utf-8") as f:
        requirements = json.load(f)
    
    assert len(requirements) >= 9
    for req_data in requirements:
        validated = RequirementSchema(**req_data)
        assert validated.id.startswith("REQ-")
        assert validated.title
        assert validated.category

def test_mock_bidders_golden_dataset():
    filepath = os.path.join(MOCK_DATA_DIR, "bidders.json")
    with open(filepath, "r", encoding="utf-8") as f:
        bidders = json.load(f)
    
    assert len(bidders) == 2
    bidder_a = bidders[0]
    bidder_b = bidders[1]

    # Bidder A is compliant
    assert bidder_a["id"] == "BIDDER-001"
    assert bidder_a["compliance_profile"]["overall_status"] == "PASS"
    assert bidder_a["compliance_profile"]["risk_level"] == "LOW"

    # Bidder B is the golden non-compliant demo
    assert bidder_b["id"] == "BIDDER-002"
    assert bidder_b["compliance_profile"]["overall_status"] == "FAIL"
    assert bidder_b["compliance_profile"]["risk_level"] == "CRITICAL"
    assert len(bidder_b["defects_summary"]) == 4

def test_mock_government_adapters():
    gst_path = os.path.join(MOCK_DATA_DIR, "gst.json")
    with open(gst_path, "r", encoding="utf-8") as f:
        gst_data = json.load(f)
        assert len(gst_data["records"]) >= 2
        statuses = {r["identifier"]: r["status"] for r in gst_data["records"]}
        assert statuses["27ABCDE1234F1Z5"] == "ACTIVE"
        assert statuses["27XYZAB9876C1Z1"] == "CANCELLED"


# ==============================================================================
# Cycle 3 Partial Dev 2 Synthetic Datasets Tests
# ==============================================================================

def test_mock_synthetic_tenders_validate_against_schema():
    tenders_dir = os.path.join(MOCK_DATA_DIR, "tenders")
    assert os.path.exists(tenders_dir), "mock-data/tenders directory must exist"

    expected_tenders = ["tender-001.json", "tender-002.json", "tender-003.json"]
    for filename in expected_tenders:
        filepath = os.path.join(tenders_dir, filename)
        assert os.path.exists(filepath), f"Missing synthetic tender: {filename}"
        with open(filepath, "r", encoding="utf-8") as f:
            tender_raw = json.load(f)

        validated = TenderSchema(**tender_raw)
        assert validated.tender_number
        assert validated.title
        assert validated.category
        assert validated.tender_type in ["OPEN", "LIMITED", "CLOSED", "EOI", "RFP"]
        assert validated.status in ["DRAFT", "ACTIVE"]
        assert validated.submission_deadline is not None
        assert len(validated.requirements) >= 3


def test_mock_synthetic_clauses_and_expected_requirements():
    clauses_file = os.path.join(MOCK_DATA_DIR, "clauses", "synthetic_clauses.json")
    requirements_file = os.path.join(MOCK_DATA_DIR, "clauses", "expected_requirements.json")

    assert os.path.exists(clauses_file), "mock-data/clauses/synthetic_clauses.json must exist"
    assert os.path.exists(requirements_file), "mock-data/clauses/expected_requirements.json must exist"

    with open(clauses_file, "r", encoding="utf-8") as f:
        clauses = json.load(f)
    with open(requirements_file, "r", encoding="utf-8") as f:
        requirements = json.load(f)

    assert len(clauses) >= 10, "Must contain at least 10 synthetic clauses"
    assert len(requirements) >= 10, "Must contain at least 10 expected structured requirements"

    clause_ids = {c["clause_id"] for c in clauses}
    for req in requirements:
        validated_req = RequirementSchema(**req)
        assert validated_req.id.startswith("EXP-REQ-")
        assert validated_req.category
        assert validated_req.confidence is not None
        assert 0.0 <= validated_req.confidence <= 1.0
        assert req["clause_id"] in clause_ids, f"Requirement clause_id {req['clause_id']} not in clauses"


def test_mock_tender_negative_cases():
    neg_file = os.path.join(MOCK_DATA_DIR, "edge-cases", "tender_negative_cases.json")
    assert os.path.exists(neg_file), "tender_negative_cases.json must exist"

    with open(neg_file, "r", encoding="utf-8") as f:
        cases = json.load(f)

    assert len(cases) >= 10, "Must contain at least 10 negative test cases"

    # Verify that schema or validation fails on negative payloads
    rejection_count = 0
    for case in cases:
        payload = case["payload"]
        try:
            TenderSchema(**payload)
        except (ValidationError, Exception):
            rejection_count += 1

    # At least 9 of 12 schema-level defects (missing fields, blank strings, invalid types) must be caught by TenderSchema
    assert rejection_count >= 9

