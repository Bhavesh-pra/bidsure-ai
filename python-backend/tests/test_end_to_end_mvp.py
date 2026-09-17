import pytest
from app import create_app
from app.models.models import db, User, Organization
from app.services.seed_service import seed_demo_data
import json

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

def test_full_e2e_flow_bidder_a_and_bidder_b(test_client):
    """
    Validates complete end-to-end flow across F1-F3 and B1-B3:
      1. Login as Procurement Officer
      2. List Tenders & fetch TND-001
      3. List Bids for TND-001
      4. Verify Bidder A (Compliant, Score 100%, Risk LOW)
      5. Record Officer Decision on Bidder A (APPROVE -> QUALIFIED)
      6. Query Audit Trail for Bidder A (contains verification and decision events)
      7. Verify Bidder B (Deficient, Score 33%, Risk HIGH, Contradictions)
      8. Record Officer Decision on Bidder B (REJECT -> DISQUALIFIED)
      9. Query Audit Trail for Bidder B
    """
    # 1. Authentication
    login_resp = test_client.post(
        "/api/v1/auth/login",
        data=json.dumps({"email": "officer@bidsure.gov.in", "password": "officer123"}),
        content_type="application/json",
    )
    assert login_resp.status_code == 200
    token = login_resp.get_json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    # 2. Tenders API
    tenders_resp = test_client.get("/api/v1/tenders", headers=headers)
    assert tenders_resp.status_code == 200
    tenders_data = tenders_resp.get_json()["data"]
    tender_list = tenders_data if isinstance(tenders_data, list) else tenders_data["tenders"]
    assert any(t["id"] == "TND-001" for t in tender_list)

    tender_detail_resp = test_client.get("/api/v1/tenders/TND-001", headers=headers)
    assert tender_detail_resp.status_code == 200
    assert tender_detail_resp.get_json()["data"]["id"] == "TND-001"

    # 3. Bids API
    bids_resp = test_client.get("/api/v1/tenders/TND-001/bids", headers=headers)
    assert bids_resp.status_code == 200
    bids = bids_resp.get_json()["data"]["bids"]
    assert len(bids) >= 2
    bid_a = next(b for b in bids if b["bidder_id"] == "BIDDER-001")
    bid_b = next(b for b in bids if b["bidder_id"] == "BIDDER-002")

    # 4. Verification on Bid A (ABC Technologies Pvt Ltd)
    verify_a_resp = test_client.post(f"/api/v1/bids/{bid_a['id']}/verify", headers=headers)
    assert verify_a_resp.status_code == 200
    v_a = verify_a_resp.get_json()["data"]
    assert v_a["compliance_score"] == 100.0
    assert v_a["risk_level"] == "LOW"
    assert v_a["recommendation"]["status"] == "PASS"
    assert "risk_factors" in v_a
    for cv in v_a["cross_verification"]:
        assert cv["status"] == "MATCH"

    # 5. Submit Officer Decision on Bid A (APPROVE)
    decision_a_resp = test_client.post(
        f"/api/v1/bids/{bid_a['id']}/decision",
        data=json.dumps({"decision": "APPROVE", "remarks": "Meets all criteria with 100% score"}),
        headers=headers,
    )
    assert decision_a_resp.status_code == 201
    d_a = decision_a_resp.get_json()["data"]
    assert d_a["decision"]["action"] == "APPROVE"
    assert d_a["bid"]["status"] == "QUALIFIED"

    # 6. Audit Trail for Bid A
    audit_a_resp = test_client.get(f"/api/v1/bids/{bid_a['id']}/audit", headers=headers)
    assert audit_a_resp.status_code == 200
    events_a = audit_a_resp.get_json()["data"]["audit_events"]
    actions_a = [e["action"] for e in events_a]
    assert any("VERIFICATION" in a for a in actions_a)
    assert any("DECISION" in a for a in actions_a)

    # 7. Verification on Bid B (QuickNet Solutions / XYZ Enterprises)
    verify_b_resp = test_client.post(f"/api/v1/bids/{bid_b['id']}/verify", headers=headers)
    assert verify_b_resp.status_code == 200
    v_b = verify_b_resp.get_json()["data"]
    assert v_b["compliance_score"] < 50.0
    assert v_b["risk_level"] == "HIGH"
    assert v_b["recommendation"]["status"] == "REVIEW_REQUIRED"
    assert len(v_b["risk_factors"]) > 0

    # 8. Submit Officer Decision on Bid B (REJECT)
    decision_b_resp = test_client.post(
        f"/api/v1/bids/{bid_b['id']}/decision",
        data=json.dumps({"decision": "REJECT", "remarks": "Disqualified due to cancelled GST and legal name discrepancy"}),
        headers=headers,
    )
    assert decision_b_resp.status_code == 201
    d_b = decision_b_resp.get_json()["data"]
    assert d_b["decision"]["action"] == "REJECT"
    assert d_b["bid"]["status"] == "DISQUALIFIED"

    # 9. Audit Trail for Bid B
    audit_b_resp = test_client.get(f"/api/v1/bids/{bid_b['id']}/audit", headers=headers)
    assert audit_b_resp.status_code == 200
    events_b = audit_b_resp.get_json()["data"]["audit_events"]
    actions_b = [e["action"] for e in events_b]
    assert any("VERIFICATION" in a for a in actions_b)
    assert any("DECISION" in a for a in actions_b)
