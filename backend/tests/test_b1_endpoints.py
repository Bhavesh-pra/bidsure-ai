import io
import json
import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.models.models import db as _db
from app.services.seed_service import seed_demo_data
from app.security.jwt_manager import create_access_token


def _make_pdf(size: int = 256) -> bytes:
    """Create minimal valid PDF bytes."""
    header = b"%PDF-1.4\n"
    padding = b"0" * max(0, size - len(header))
    return header + padding


@pytest.fixture(scope="module")
def app():
    application = create_app("testing")
    application.config["UPLOAD_FOLDER"] = os.path.join(
        os.path.dirname(__file__), "_test_b1_storage"
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
def other_org_token(app):
    with app.app_context():
        return create_access_token(
            user_id="USR-OTHER-001",
            organization_id="ORG-OTHER-999",
            role="PROCUREMENT_OFFICER",
            name="Other Officer",
        )


@pytest.fixture(scope="module")
def auth_headers(officer_token):
    return {"Authorization": f"Bearer {officer_token}"}


# ===========================================================================
# 1. Authentication Endpoints: POST /auth/login and /api/v1/auth/login
# ===========================================================================

def test_login_success_root_path(client):
    """Verify POST /auth/login returns JWT token and standardized envelope."""
    payload = {"email": "officer@bidsure.gov.in", "password": "officer123"}
    resp = client.post("/auth/login", json=payload)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert "access_token" in body["data"]
    assert body["data"]["token_type"] == "Bearer"
    assert body["data"]["user"]["email"] == "officer@bidsure.gov.in"
    assert body["data"]["user"]["role"] == "PROCUREMENT_OFFICER"
    assert "request_id" in body


def test_login_success_api_v1_path(client):
    """Verify POST /api/v1/auth/login also works identically."""
    payload = {"email": "officer@bidsure.gov.in", "password": "officer123"}
    resp = client.post("/api/v1/auth/login", json=payload)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert "access_token" in body["data"]


def test_login_invalid_credentials(client):
    payload = {"email": "officer@bidsure.gov.in", "password": "wrongpassword"}
    resp = client.post("/auth/login", json=payload)
    assert resp.status_code == 401
    body = resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_CREDENTIALS"


def test_login_missing_fields(client):
    resp = client.post("/auth/login", json={"email": "officer@bidsure.gov.in"})
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


# ===========================================================================
# 2. Tender Endpoints: GET /api/v1/tenders & GET /api/v1/tenders/{id}
# ===========================================================================

def test_get_tenders_unauthorized(client):
    resp = client.get("/api/v1/tenders")
    assert resp.status_code == 401
    body = resp.get_json()
    assert body["success"] is False


def test_get_tenders_list(client, auth_headers):
    resp = client.get("/api/v1/tenders", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
    assert len(body["data"]) >= 1

    t0 = body["data"][0]
    assert "id" in t0
    assert "tender_number" in t0
    assert "title" in t0
    assert "status" in t0
    assert "category" in t0
    assert "submission_deadline" in t0


def test_get_tender_by_id(client, auth_headers):
    resp = client.get("/api/v1/tenders/TND-001", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"]["id"] == "TND-001"
    assert body["data"]["organization_id"] == "ORG-001"


def test_get_tender_not_found(client, auth_headers):
    resp = client.get("/api/v1/tenders/NON-EXISTENT", headers=auth_headers)
    assert resp.status_code == 404
    body = resp.get_json()
    assert body["success"] is False


def test_get_tender_other_org_denied(client, other_org_token):
    resp = client.get(
        "/api/v1/tenders/TND-001",
        headers={"Authorization": f"Bearer {other_org_token}"},
    )
    assert resp.status_code == 403
    body = resp.get_json()
    assert body["success"] is False


# ===========================================================================
# 3. Bid APIs: GET /api/v1/tenders/{id}/bids & GET /api/v1/bids/{id}
# ===========================================================================

def test_get_tender_bids(client, auth_headers):
    resp = client.get("/api/v1/tenders/TND-001/bids", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"]["tender_id"] == "TND-001"
    assert isinstance(body["data"]["bids"], list)
    assert len(body["data"]["bids"]) >= 2

    # Check bidder payload is embedded
    b0 = body["data"]["bids"][0]
    assert "bidder" in b0
    assert "quoted_amount" in b0


def test_get_bid_detail(client, auth_headers):
    resp = client.get("/api/v1/bids/BIDDER-001-BID-001", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"]["id"] == "BIDDER-001-BID-001"
    assert body["data"]["tender_id"] == "TND-001"
    assert body["data"]["bidder"]["legal_name"] is not None


def test_get_bid_not_found(client, auth_headers):
    resp = client.get("/api/v1/bids/NON-EXISTENT-BID", headers=auth_headers)
    assert resp.status_code == 404
    body = resp.get_json()
    assert body["success"] is False


# ===========================================================================
# 4. Document APIs: GET & POST /api/v1/bids/{id}/documents
# ===========================================================================

def test_list_bid_documents(client, auth_headers):
    resp = client.get(
        "/api/v1/bids/BIDDER-001-BID-001/documents", headers=auth_headers
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_upload_bid_document_success(client, auth_headers):
    data = {
        "file": (io.BytesIO(_make_pdf(512)), "gst_certificate.pdf"),
        "document_type": "GST_CERTIFICATE",
        "description": "GST Certificate for Bidder A",
    }
    resp = client.post(
        "/api/v1/bids/BIDDER-001-BID-001/documents",
        data=data,
        content_type="multipart/form-data",
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"]["document_type"] == "GST_CERTIFICATE"
    assert body["data"]["original_filename"] == "gst_certificate.pdf"
    assert body["data"]["processing_status"] == "UPLOADED"
    assert body["data"]["bid_id"] == "BIDDER-001-BID-001"
    assert "sha256" in body["data"]


def test_upload_bid_document_missing_type(client, auth_headers):
    data = {
        "file": (io.BytesIO(_make_pdf(512)), "document.pdf"),
    }
    resp = client.post(
        "/api/v1/bids/BIDDER-001-BID-001/documents",
        data=data,
        content_type="multipart/form-data",
        headers=auth_headers,
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"


def test_upload_bid_document_rbac_viewer_denied(client, viewer_token):
    data = {
        "file": (io.BytesIO(_make_pdf(512)), "gst_cert.pdf"),
        "document_type": "GST_CERTIFICATE",
    }
    resp = client.post(
        "/api/v1/bids/BIDDER-001-BID-001/documents",
        data=data,
        content_type="multipart/form-data",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert resp.status_code == 403
    body = resp.get_json()
    assert body["success"] is False
    assert body["error"]["code"] == "FORBIDDEN"
