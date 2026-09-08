import os
import sys
from datetime import datetime, timezone, timedelta
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.models.models import db, Organization, User, Tender
from app.security.jwt_manager import create_access_token


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()

        # Seed two distinct organizations for tenant isolation tests
        org_a = Organization(
            id="ORG-TEST-A",
            name="Test Organization A",
            code="TOA-01",
            status="ACTIVE",
        )
        org_b = Organization(
            id="ORG-TEST-B",
            name="Test Organization B",
            code="TOB-02",
            status="ACTIVE",
        )
        db.session.add_all([org_a, org_b])

        # Seed users
        officer_a = User(
            id="USR-OFFICER-A",
            organization_id=org_a.id,
            email="officer_a@test.com",
            password_hash="hashed_pw",
            name="Officer A",
            role="PROCUREMENT_OFFICER",
            status="ACTIVE",
        )
        officer_b = User(
            id="USR-OFFICER-B",
            organization_id=org_b.id,
            email="officer_b@test.com",
            password_hash="hashed_pw",
            name="Officer B",
            role="PROCUREMENT_OFFICER",
            status="ACTIVE",
        )
        viewer_a = User(
            id="USR-VIEWER-A",
            organization_id=org_a.id,
            email="viewer_a@test.com",
            password_hash="hashed_pw",
            name="Viewer A",
            role="VIEWER",
            status="ACTIVE",
        )
        db.session.add_all([officer_a, officer_b, viewer_a])
        db.session.commit()

        yield app

        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def token_org_a(app):
    with app.app_context():
        return create_access_token("USR-OFFICER-A", "ORG-TEST-A", "PROCUREMENT_OFFICER", "Officer A")


@pytest.fixture
def token_org_b(app):
    with app.app_context():
        return create_access_token("USR-OFFICER-B", "ORG-TEST-B", "PROCUREMENT_OFFICER", "Officer B")


@pytest.fixture
def token_viewer(app):
    with app.app_context():
        return create_access_token("USR-VIEWER-A", "ORG-TEST-A", "VIEWER", "Viewer A")


def auth_header(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ==============================================================================
# 1. Authentication Tests
# ==============================================================================

def test_auth_login_seeded(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "officer@bidsure.gov.in", "password": "officer123"},
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["role"] == "PROCUREMENT_OFFICER"


def test_auth_login_invalid(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@bidsure.gov.in", "password": "wrongpassword"},
    )
    assert res.status_code == 401
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_CREDENTIALS"


# ==============================================================================
# 2. Tender Creation Tests (POST /api/v1/tenders)
# ==============================================================================

def test_create_tender_success(client, token_org_a):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    payload = {
        "tender_number": "GEM/2026/B/1234567",
        "title": "Supply of Industrial Equipment",
        "description": "Supply and installation of equipment",
        "category": "TECHNICAL",
        "tender_type": "OPEN",
        "submission_deadline": deadline,
    }

    res = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_org_a))
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True
    assert data["data"]["tender_number"] == "GEM/2026/B/1234567"
    assert data["data"]["title"] == "Supply of Industrial Equipment"
    assert data["data"]["status"] == "DRAFT"
    assert "id" in data["data"]
    assert "request_id" in data

    # Verify persistence in database
    with client.application.app_context():
        tender = Tender.query.filter_by(tender_number="GEM/2026/B/1234567").first()
        assert tender is not None
        assert tender.organization_id == "ORG-TEST-A"
        assert tender.category == "TECHNICAL"
        assert tender.description == "Supply and installation of equipment"


def test_create_tender_validation_missing_tender_number(client, token_org_a):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    payload = {
        "title": "Supply of Industrial Equipment",
        "category": "TECHNICAL",
        "submission_deadline": deadline,
    }
    res = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_org_a))
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "Tender number is required" in data["error"]["message"]


def test_create_tender_validation_missing_title(client, token_org_a):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    payload = {
        "tender_number": "GEM/2026/B/1234567",
        "category": "TECHNICAL",
        "submission_deadline": deadline,
    }
    res = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_org_a))
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "Title is required" in data["error"]["message"]


def test_create_tender_validation_invalid_category(client, token_org_a):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    payload = {
        "tender_number": "GEM/2026/B/1234567",
        "title": "Supply of Industrial Equipment",
        "category": "INVALID_CAT",
        "submission_deadline": deadline,
    }
    res = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_org_a))
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "Invalid category" in data["error"]["message"]


def test_create_tender_validation_invalid_tender_type(client, token_org_a):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    payload = {
        "tender_number": "GEM/2026/B/1234567",
        "title": "Supply of Industrial Equipment",
        "category": "TECHNICAL",
        "tender_type": "UNKNOWN_TYPE",
        "submission_deadline": deadline,
    }
    res = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_org_a))
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "Invalid tender type" in data["error"]["message"]


def test_create_tender_validation_past_deadline(client, token_org_a):
    past_deadline = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
    payload = {
        "tender_number": "GEM/2026/B/1234567",
        "title": "Supply of Industrial Equipment",
        "category": "TECHNICAL",
        "submission_deadline": past_deadline,
    }
    res = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_org_a))
    assert res.status_code == 400
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "future" in data["error"]["message"]


def test_create_tender_duplicate_within_same_org(client, token_org_a):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    payload = {
        "tender_number": "GEM/2026/B/DUP001",
        "title": "Original Tender",
        "category": "TECHNICAL",
        "submission_deadline": deadline,
    }
    # First creation should succeed
    res1 = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_org_a))
    assert res1.status_code == 201

    # Second creation with same tender_number in same org must be rejected
    res2 = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_org_a))
    assert res2.status_code == 409
    data = res2.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "DUPLICATE_TENDER_NUMBER"


def test_create_tender_same_number_different_org_allowed(client, token_org_a, token_org_b):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    payload = {
        "tender_number": "GEM/2026/B/SHARED-NUM",
        "title": "Shared Ref Tender",
        "category": "TECHNICAL",
        "submission_deadline": deadline,
    }
    # Org A creates
    res_a = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_org_a))
    assert res_a.status_code == 201

    # Org B creates with same tender_number -> must succeed due to tenant isolation
    res_b = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_org_b))
    assert res_b.status_code == 201


# ==============================================================================
# 3. Tender Listing Tests (GET /api/v1/tenders)
# ==============================================================================

def test_get_tenders_empty(client, token_org_a):
    res = client.get("/api/v1/tenders", headers=auth_header(token_org_a))
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["data"] == []


def test_get_tenders_tenant_isolation(client, token_org_a, token_org_b):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    # Org A creates 2 tenders
    client.post(
        "/api/v1/tenders",
        json={"tender_number": "TND-A1", "title": "A1", "category": "TECHNICAL", "submission_deadline": deadline},
        headers=auth_header(token_org_a),
    )
    client.post(
        "/api/v1/tenders",
        json={"tender_number": "TND-A2", "title": "A2", "category": "FINANCIAL", "submission_deadline": deadline},
        headers=auth_header(token_org_a),
    )

    # Org B creates 1 tender
    client.post(
        "/api/v1/tenders",
        json={"tender_number": "TND-B1", "title": "B1", "category": "STATUTORY", "submission_deadline": deadline},
        headers=auth_header(token_org_b),
    )

    # Org A should only see A1 and A2
    res_a = client.get("/api/v1/tenders", headers=auth_header(token_org_a))
    assert res_a.status_code == 200
    data_a = res_a.get_json()["data"]
    assert len(data_a) == 2
    tender_numbers_a = {t["tender_number"] for t in data_a}
    assert tender_numbers_a == {"TND-A1", "TND-A2"}

    # Org B should only see B1
    res_b = client.get("/api/v1/tenders", headers=auth_header(token_org_b))
    assert res_b.status_code == 200
    data_b = res_b.get_json()["data"]
    assert len(data_b) == 1
    assert data_b[0]["tender_number"] == "TND-B1"


# ==============================================================================
# 4. Tender Detail Tests (GET /api/v1/tenders/<id>)
# ==============================================================================

def test_get_tender_details_success(client, token_org_a):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    create_res = client.post(
        "/api/v1/tenders",
        json={
            "tender_number": "GEM/2026/B/DET001",
            "title": "Detail Tender",
            "description": "Full details description",
            "category": "TECHNICAL",
            "tender_type": "OPEN",
            "submission_deadline": deadline,
        },
        headers=auth_header(token_org_a),
    )
    tender_id = create_res.get_json()["data"]["id"]

    res = client.get(f"/api/v1/tenders/{tender_id}", headers=auth_header(token_org_a))
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    detail = data["data"]
    assert detail["id"] == tender_id
    assert detail["organization_id"] == "ORG-TEST-A"
    assert detail["tender_number"] == "GEM/2026/B/DET001"
    assert detail["title"] == "Detail Tender"
    assert detail["description"] == "Full details description"
    assert detail["category"] == "TECHNICAL"
    assert detail["tender_type"] == "OPEN"
    assert detail["status"] == "DRAFT"
    assert "created_at" in detail
    assert "updated_at" in detail


def test_get_tender_details_not_found(client, token_org_a):
    res = client.get("/api/v1/tenders/NON-EXISTENT-ID", headers=auth_header(token_org_a))
    assert res.status_code == 404
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"


def test_get_tender_details_cross_tenant_forbidden(client, token_org_a, token_org_b):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    # Org A creates tender
    create_res = client.post(
        "/api/v1/tenders",
        json={
            "tender_number": "GEM/2026/B/ORG-A-SECRET",
            "title": "Org A Secret Tender",
            "category": "TECHNICAL",
            "submission_deadline": deadline,
        },
        headers=auth_header(token_org_a),
    )
    tender_id = create_res.get_json()["data"]["id"]

    # Org B attempts to view Org A's tender
    res = client.get(f"/api/v1/tenders/{tender_id}", headers=auth_header(token_org_b))
    assert res.status_code == 403
    data = res.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "FORBIDDEN"


# ==============================================================================
# 5. Security & Authorization Matrix Tests
# ==============================================================================

def test_tender_endpoints_unauthenticated(client):
    # No header
    res_get = client.get("/api/v1/tenders")
    assert res_get.status_code == 401
    assert res_get.get_json()["error"]["code"] == "UNAUTHORIZED"

    res_post = client.post("/api/v1/tenders", json={})
    assert res_post.status_code == 401
    assert res_post.get_json()["error"]["code"] == "UNAUTHORIZED"

    res_detail = client.get("/api/v1/tenders/TND-001")
    assert res_detail.status_code == 401
    assert res_detail.get_json()["error"]["code"] == "UNAUTHORIZED"


def test_tender_endpoints_invalid_token(client):
    headers = {"Authorization": "Bearer invalid.jwt.token"}
    res = client.get("/api/v1/tenders", headers=headers)
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "UNAUTHORIZED"


def test_tender_endpoints_expired_token(client, app):
    with app.app_context():
        # Generate token with negative duration
        expired_token = create_access_token(
            user_id="USR-OFFICER-A",
            organization_id="ORG-TEST-A",
            role="PROCUREMENT_OFFICER",
            expires_in_minutes=-10,
        )
    headers = {"Authorization": f"Bearer {expired_token}"}
    res = client.get("/api/v1/tenders", headers=headers)
    assert res.status_code == 401
    assert res.get_json()["error"]["code"] == "UNAUTHORIZED"
    assert "expired" in res.get_json()["error"]["message"]


def test_create_tender_unauthorized_role(client, token_viewer):
    deadline = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    payload = {
        "tender_number": "GEM/2026/B/VIEWER-TRY",
        "title": "Viewer Try Tender",
        "category": "TECHNICAL",
        "submission_deadline": deadline,
    }
    # Role VIEWER is not in ["PROCUREMENT_OFFICER", "ADMIN"]
    res = client.post("/api/v1/tenders", json=payload, headers=auth_header(token_viewer))
    assert res.status_code == 403
    assert res.get_json()["error"]["code"] == "FORBIDDEN"
