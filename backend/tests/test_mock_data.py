import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.domain.requirement.schemas import RequirementSchema

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
