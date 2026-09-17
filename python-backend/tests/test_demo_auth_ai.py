import json
import pytest
from app import create_app
from app.models.models import db, User, Organization
from app.services.seed_service import seed_demo_data
from app.services.evidence_extraction.service import extract_structured_evidence
from app.services.evaluation_service import generate_ai_recommendation


@pytest.fixture
def test_client():
    app = create_app("testing")
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    with app.app_context():
        db.create_all()
        seed_demo_data()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_demo_officer_login(test_client):
    """Test demo officer account login and JWT claims."""
    resp = test_client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "officer@bidsure.demo", "password": "officer123"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert "access_token" in data
    assert data["user"]["actor_type"] == "GOVERNMENT"
    assert data["user"]["role"] == "PROCUREMENT_OFFICER"
    assert data["user"]["organization_type"] == "GOVERNMENT"


def test_demo_bidder_login(test_client):
    """Test demo bidder account login and JWT claims."""
    resp = test_client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "bidder@abctech.demo", "password": "bidder123"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert "access_token" in data
    assert data["user"]["actor_type"] == "BIDDER"
    assert data["user"]["role"] == "BIDDER"
    assert data["user"]["organization_type"] == "BIDDER"
    assert data["user"]["organization_name"] == "ABC Technologies Pvt Ltd"


def test_demo_admin_login(test_client):
    """Test demo admin account login."""
    resp = test_client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "admin@bidsure.demo", "password": "admin123"}),
        content_type="application/json",
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["user"]["actor_type"] == "ADMIN"
    assert data["user"]["role"] == "ADMIN"


def test_auth_me_endpoint(test_client):
    """Test GET /api/v1/auth/me for both officer and bidder."""
    # 1. Login as officer
    officer_resp = test_client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "officer@bidsure.demo", "password": "officer123"}),
        content_type="application/json",
    )
    token = officer_resp.get_json()["data"]["access_token"]

    # 2. Call /auth/me
    me_resp = test_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    me_data = me_resp.get_json()["data"]
    assert me_data["email"] == "officer@bidsure.demo"
    assert me_data["actor_type"] == "GOVERNMENT"
    assert me_data["role"] == "PROCUREMENT_OFFICER"
    assert me_data["organization_type"] == "GOVERNMENT"

    # 3. Unauthorized request
    unauth_resp = test_client.get("/api/v1/auth/me")
    assert unauth_resp.status_code == 401


def test_evidence_extraction_with_fallback():
    """Verify structured extraction returns expected fields with graceful fallback."""
    pages = [
        {
            "page_number": 1,
            "raw_text": (
                "GOVERNMENT OF INDIA - CERTIFICATE OF REGISTRATION\n"
                "GSTIN: 27ABCDE1234F1Z5\n"
                "Legal Name: ABC TECHNOLOGIES PRIVATE LIMITED\n"
                "Trade Name: ABC TECH\n"
                "Registration Date: 15/08/2020\n"
                "Status: Active\n"
            ),
        }
    ]
    evidence = extract_structured_evidence("DOC-TEST-001", "GST_CERTIFICATE", pages)
    assert evidence.document_id == "DOC-TEST-001"
    assert evidence.document_type == "GST_CERTIFICATE"
    assert len(evidence.fields) >= 3

    field_map = {f.field: f.value for f in evidence.fields}
    assert "gstin" in field_map
    assert field_map["gstin"] == "27ABCDE1234F1Z5"


def test_ai_recommendation_generation():
    """Verify explainable recommendation payload includes audit disclaimer and generation method."""
    req_results = [
        {"name": "GST Registration", "status": "PASS", "mandatory": True},
        {"name": "PAN Verification", "status": "PASS", "mandatory": True},
    ]
    cross_checks = [{"field": "GSTIN_PAN_ALIGNMENT", "status": "MATCH"}]
    risk_assessment = {"risk_level": "LOW", "factors": []}

    rec = generate_ai_recommendation(
        compliance_score=100,
        risk_assessment=risk_assessment,
        requirements_results=req_results,
        cross_checks=cross_checks,
    )
    assert rec["status"] == "PASS"
    assert "authority_disclaimer" in rec
    assert "reasons" in rec
    assert len(rec["reasons"]) > 0
    assert rec.get("generated_by") in ("LLM", "DETERMINISTIC")
