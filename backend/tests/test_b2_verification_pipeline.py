import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.models.models import db as _db
from app.services.seed_service import seed_demo_data
from app.security.jwt_manager import create_access_token
from app.services.adapters.government_adapters import GSTAdapter, PANAdapter, UdyamAdapter
from app.services.adapters.cross_verification import CrossVerificationEngine
from app.services.verification_service import verify_bid


@pytest.fixture(scope="module")
def app():
    application = create_app("testing")
    application.config["UPLOAD_FOLDER"] = os.path.join(
        os.path.dirname(__file__), "_test_b2_storage"
    )
    with application.app_context():
        _db.create_all()
        seed_demo_data()
        yield application
        _db.session.rollback()
        _db.drop_all()

    import shutil
    storage_dir = application.config["UPLOAD_FOLDER"]
    if os.path.exists(storage_dir):
        shutil.rmtree(storage_dir, ignore_errors=True)


@pytest.fixture(scope="module")
def client(app):
    return app.test_client()


@pytest.fixture(scope="module")
def officer_token(app):
    with app.app_context():
        return create_access_token(
            user_id="USR-OFFICER-001",
            organization_id="ORG-001",
            role="PROCUREMENT_OFFICER",
            name="Procurement Officer",
        )


@pytest.fixture(scope="module")
def auth_headers(officer_token):
    return {"Authorization": f"Bearer {officer_token}"}


# ===========================================================================
# 1. Government Adapters Tests
# ===========================================================================

def test_gst_adapter_active():
    res = GSTAdapter.verify("27ABCDE1234F1Z5")
    assert res["status"] == "VERIFIED"
    assert res["match_result"] is True
    assert "Maharashtra" in res["reason"]


def test_gst_adapter_cancelled():
    res = GSTAdapter.verify("27XYZAB9876C1Z1")
    assert res["status"] == "VERIFIED_FAIL"
    assert res["match_result"] is False
    assert "CANCELLED" in res["reason"]


def test_gst_adapter_missing_degrades_gracefully():
    """Architectural guarantee: Unknown/offline external record degrades to UNABLE_TO_VERIFY, not FAIL."""
    res = GSTAdapter.verify("27NONEXIST9999Z9")
    assert res["status"] == "UNABLE_TO_VERIFY"
    assert res["match_result"] is False


def test_pan_adapter_valid():
    res = PANAdapter.verify("ABCDE1234F")
    assert res["status"] == "VERIFIED"
    assert res["match_result"] is True
    assert res["legal_name"] == "ABC Technologies Private Limited"


def test_pan_adapter_unknown():
    res = PANAdapter.verify("NOTFOUND99")
    assert res["status"] == "UNABLE_TO_VERIFY"
    assert res["match_result"] is False


def test_udyam_adapter_active():
    res = UdyamAdapter.verify("UDYAM-MH-01-0012345")
    assert res["status"] == "VERIFIED"
    assert res["match_result"] is True


def test_udyam_adapter_unknown():
    res = UdyamAdapter.verify("UDYAM-XX-99-9999999")
    assert res["status"] == "UNABLE_TO_VERIFY"


# ===========================================================================
# 2. Cross-Verification & Contradiction Detection Tests
# ===========================================================================

def test_cross_check_gstin_pan_match():
    res = CrossVerificationEngine.verify_gstin_pan("27ABCDE1234F1Z5", "ABCDE1234F")
    assert res["status"] == "MATCH"
    assert res["match"] is True


def test_cross_check_gstin_pan_mismatch():
    res = CrossVerificationEngine.verify_gstin_pan("27ABCDE1234F1Z5", "XYZAB9876C")
    assert res["status"] == "MISMATCH"
    assert res["match"] is False


def test_cross_check_legal_names_identical():
    res = CrossVerificationEngine.verify_legal_names(
        declared_name="ABC Technologies Private Limited",
        gst_name="ABC Technologies Private Limited",
        pan_name="ABC Technologies Pvt. Ltd.",
    )
    assert res["status"] == "MATCH"
    assert res["match"] is True


def test_cross_check_legal_names_discrepancy():
    """Detects live name contradiction between declared entity and certificate."""
    res = CrossVerificationEngine.verify_legal_names(
        declared_name="QuickNet Solutions LLP",
        gst_name="QuickNet Solutions LLP",
        pan_name="Delta Networks Private Limited",
    )
    assert res["status"] == "MISMATCH"
    assert res["match"] is False
    assert res.get("contradiction") is True


# ===========================================================================
# 3. End-to-End Pipeline Service Verification
# ===========================================================================

def test_verify_bid_pipeline_bidder_a(app):
    """Bidder A: Compliant demo bidder should achieve >= 85%, LOW risk, PASS."""
    with app.app_context():
        result = verify_bid("BIDDER-001-BID-001", "ORG-001")
        assert result["bid_id"] == "BIDDER-001-BID-001"
        assert result["bidder"]["name"] == "ABC Technologies Private Limited"
        assert result["compliance_score"] >= 85
        assert result["risk_level"] == "LOW"
        assert result["recommendation"]["status"] == "PASS"

        # Check requirement results format
        assert len(result["requirements"]) >= 9
        for req in result["requirements"]:
            assert "name" in req
            assert "status" in req
            assert "reason" in req
            assert "evidence" in req

        # Check cross verification
        cv_fields = {cv["field"]: cv["status"] for cv in result["cross_verification"]}
        assert cv_fields["GSTIN"] == "MATCH"
        assert cv_fields["PAN"] == "MATCH"
        assert cv_fields["LEGAL_NAME"] == "MATCH"


def test_verify_bid_pipeline_bidder_b(app):
    """Bidder B: Non-compliant demo bidder should produce HIGH risk, discrepancy alert, and REVIEW_REQUIRED."""
    with app.app_context():
        result = verify_bid("BIDDER-002-BID-001", "ORG-001")
        assert result["bid_id"] == "BIDDER-002-BID-001"
        assert result["compliance_score"] <= 60
        assert result["risk_level"] == "HIGH"
        assert result["recommendation"]["status"] == "REVIEW_REQUIRED"

        # Check contradiction is flagged
        cv_fields = {cv["field"]: cv["status"] for cv in result["cross_verification"]}
        assert cv_fields["LEGAL_NAME"] == "MISMATCH" or cv_fields["GSTIN"] == "MISMATCH"


# ===========================================================================
# 4. API Endpoints: POST & GET /api/v1/bids/{id}/verify
# ===========================================================================

def test_api_verify_bid_endpoint(client, auth_headers):
    resp = client.post("/api/v1/bids/BIDDER-001-BID-001/verify", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    data = body["data"]

    # Verify frozen contract adherence
    assert data["bid_id"] == "BIDDER-001-BID-001"
    assert "compliance_score" in data
    assert "risk_level" in data
    assert "requirements" in data
    assert "cross_verification" in data
    assert "recommendation" in data
    assert "authority_disclaimer" in data["recommendation"]


def test_api_get_cached_verification_endpoint(client, auth_headers):
    # Retrieve cached result
    resp = client.get("/api/v1/bids/BIDDER-001-BID-001/verification", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"]["bid_id"] == "BIDDER-001-BID-001"


def test_api_verify_unauthorized(client):
    resp = client.post("/api/v1/bids/BIDDER-001-BID-001/verify")
    assert resp.status_code == 401
    body = resp.get_json()
    assert body["success"] is False
