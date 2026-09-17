import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.models.models import db as _db, Bid, AuditEvent, OfficerDecision
from app.services.seed_service import seed_demo_data
from app.security.jwt_manager import create_access_token
from app.services.evaluation_service import (
    calculate_deterministic_score,
    calculate_risk_assessment,
    generate_ai_recommendation,
)
from app.services.decision_service import record_officer_decision, get_bid_audit_trail


@pytest.fixture(scope="module")
def app():
    application = create_app("testing")
    application.config["UPLOAD_FOLDER"] = os.path.join(
        os.path.dirname(__file__), "_test_b3_storage"
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
def viewer_token(app):
    with app.app_context():
        return create_access_token(
            user_id="USR-VIEWER-001",
            organization_id="ORG-001",
            role="VIEWER",
            name="Viewer User",
        )


@pytest.fixture(scope="module")
def auth_headers(officer_token):
    return {"Authorization": f"Bearer {officer_token}"}


# ===========================================================================
# 1. Deterministic Scoring Tests
# ===========================================================================

def test_deterministic_score_all_verified():
    """All 7 standard criteria verified must yield exactly 100 points."""
    reqs = [
        {"name": "GST Registration", "status": "VERIFIED"},
        {"name": "PAN Card", "status": "VERIFIED"},
        {"name": "Udyam MSME Registration", "status": "VERIFIED"},
        {"name": "Minimum Annual Turnover", "status": "VERIFIED"},
        {"name": "Past Experience", "status": "VERIFIED"},
        {"name": "OEM Authorization", "status": "VERIFIED"},
        {"name": "Local Content", "status": "VERIFIED"},
    ]
    score = calculate_deterministic_score(reqs)
    assert score == 100


def test_deterministic_score_partial():
    """Omitting Local Content (20 pts) drops score by exactly 20%."""
    reqs = [
        {"name": "GST Registration", "status": "VERIFIED"},
        {"name": "PAN Card", "status": "VERIFIED"},
        {"name": "Udyam MSME Registration", "status": "VERIFIED"},
        {"name": "Minimum Annual Turnover", "status": "VERIFIED"},
        {"name": "Past Experience", "status": "VERIFIED"},
        {"name": "OEM Authorization", "status": "VERIFIED"},
        {"name": "Local Content", "status": "FAIL"},
    ]
    score = calculate_deterministic_score(reqs)
    assert score == 80


# ===========================================================================
# 2. Risk Assessment & AI Recommendation Grounding Tests
# ===========================================================================

def test_risk_assessment_identity_contradiction():
    """Identity contradiction must elevate risk to HIGH with CRITICAL factor."""
    cross_checks = [
        {"field": "LEGAL_NAME", "status": "MISMATCH", "details": "Conflicting names found"},
        {"field": "GSTIN_PAN_ALIGNMENT", "status": "MATCH"},
    ]
    reqs = [{"name": "GST Registration", "status": "VERIFIED"}]
    risk = calculate_risk_assessment(80, reqs, cross_checks)
    assert risk["risk_level"] == "HIGH"
    factors = [f["type"] for f in risk["factors"]]
    assert "IDENTIFIER_MISMATCH" in factors


def test_ai_recommendation_disclaimer_and_grounding():
    """Recommendation must include officer authority disclaimer and grounded reasons."""
    risk = {"risk_level": "LOW", "factors": []}
    reqs = [{"name": "GST Registration", "status": "VERIFIED"}]
    rec = generate_ai_recommendation(100, risk, reqs, [])
    assert rec["status"] == "PASS"
    assert "AI recommendations are strictly decision support" in rec["authority_disclaimer"]
    assert len(rec["reasons"]) >= 1


# ===========================================================================
# 3. Decision Validation & RBAC Tests
# ===========================================================================

def test_decision_invalid_string_rejected(client, auth_headers):
    payload = {"decision": "MAYBE_QUALIFIED", "remarks": "Unsure"}
    resp = client.post("/api/v1/bids/BIDDER-001-BID-001/decision", json=payload, headers=auth_headers)
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_DECISION"


def test_decision_viewer_role_forbidden(client, viewer_token):
    payload = {"decision": "APPROVE"}
    resp = client.post(
        "/api/v1/bids/BIDDER-001-BID-001/decision",
        json=payload,
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert resp.status_code == 403
    body = resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "FORBIDDEN"


# ===========================================================================
# 4. End-to-End Decision & Audit Trail Verification
# ===========================================================================

def test_officer_approval_bidder_a(client, auth_headers, app):
    """Officer approves Bidder A -> updates status to QUALIFIED and logs audit event."""
    payload = {
        "decision": "APPROVE",
        "remarks": "Substantially compliant with all tender criteria. Qualified for commercial evaluation.",
        "conditions": ["Submit original OEM declaration prior to contract signing"],
    }
    resp = client.post("/api/v1/bids/BIDDER-001-BID-001/decision", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["success"] is True
    data = body["data"]

    # Decision verification
    assert data["decision"]["decision"] == "QUALIFIED"
    assert data["decision"]["action"] == "APPROVE"
    assert data["decision"]["officer_name"] == "Procurement Officer"
    assert data["bid"]["status"] == "QUALIFIED"

    # Audit verification
    assert "audit_event" in data
    assert data["audit_event"]["action"] == "OFFICER_DECISION_QUALIFIED"
    assert data["audit_event"]["entity_id"] == "BIDDER-001-BID-001"


def test_get_recorded_decision(client, auth_headers):
    resp = client.get("/api/v1/bids/BIDDER-001-BID-001/decision", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"]["decision"]["decision"] == "QUALIFIED"


def test_get_bid_audit_trail(client, auth_headers):
    resp = client.get("/api/v1/bids/BIDDER-001-BID-001/audit", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    events = body["data"]["audit_events"]
    assert len(events) >= 1
    assert events[0]["action"] == "OFFICER_DECISION_QUALIFIED"
    assert "remarks" in events[0]["metadata"]


def test_officer_clarification_bidder_b(client, auth_headers):
    """Officer requests clarification on Bidder B -> updates status and logs audit event."""
    payload = {
        "decision": "REQUEST_CLARIFICATION",
        "remarks": "Entity name mismatch detected between GSTN and PAN. Submit clarification within 72 hours.",
    }
    resp = client.post("/api/v1/bids/BIDDER-002-BID-001/decision", json=payload, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["success"] is True
    data = body["data"]

    assert data["decision"]["decision"] == "CLARIFICATION_REQUIRED"
    assert data["decision"]["action"] == "REQUEST_CLARIFICATION"
    assert data["bid"]["status"] == "CLARIFICATION_REQUESTED"
    assert data["audit_event"]["action"] == "OFFICER_DECISION_CLARIFICATION_REQUIRED"
