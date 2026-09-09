"""
Cycle 7 — Bid Document Upload Tests

Covers:
  - API endpoints (upload, list, detail, delete)
  - Authorization (JWT, org ownership, role)
  - File validation (PDF, JPG, PNG, invalid, oversized, empty, corrupt)
  - Duplicate detection (SHA-256)
  - Document type enum validation
  - Storage verification
"""

import io
import json
import os
from datetime import datetime, timezone
import pytest

from app import create_app
from app.models.models import db as _db, Organization, User, Tender, Bidder, Bid, Document
from app.security.jwt_manager import create_access_token

# ---------------------------------------------------------------------------
# Test file content generators
# ---------------------------------------------------------------------------

def _make_pdf(size: int = 256) -> bytes:
    """Create a minimal valid PDF."""
    header = b"%PDF-1.4\n"
    padding = b"0" * max(0, size - len(header))
    return header + padding


def _make_jpg(size: int = 256) -> bytes:
    """Create bytes with a valid JPEG magic signature."""
    header = b"\xff\xd8\xff\xe0"
    padding = b"\x00" * max(0, size - len(header))
    return header + padding


def _make_png(size: int = 256) -> bytes:
    """Create bytes with a valid PNG magic signature."""
    header = b"\x89PNG\r\n\x1a\n"
    padding = b"\x00" * max(0, size - len(header))
    return header + padding


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def app():
    """Create a test Flask application."""
    application = create_app("testing")
    application.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB
    application.config["UPLOAD_FOLDER"] = os.path.join(
        os.path.dirname(__file__), "_test_storage"
    )
    yield application
    # Cleanup test storage
    import shutil
    storage_dir = application.config["UPLOAD_FOLDER"]
    if os.path.exists(storage_dir):
        shutil.rmtree(storage_dir, ignore_errors=True)


@pytest.fixture(autouse=True)
def setup_db(app):
    """Create tables before each test and drop them after."""
    with app.app_context():
        _db.create_all()
        yield
        _db.session.rollback()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def seed_data(app):
    """Seed an org, user, tender, bidder, and bid. Return their IDs."""
    with app.app_context():
        org = Organization(id="ORG-TEST", name="Test Org", code="TORG", status="ACTIVE")
        _db.session.add(org)
        _db.session.flush()

        user = User(
            id="USER-TEST",
            organization_id=org.id,
            email="officer@test.com",
            password_hash="hashed",
            name="Test Officer",
            role="PROCUREMENT_OFFICER",
        )
        _db.session.add(user)
        _db.session.flush()

        tender = Tender(
            id="TENDER-TEST",
            organization_id=org.id,
            tender_number="T-2026-001",
            title="Test Tender",
            category="GOODS",
            submission_deadline=datetime(2026, 12, 31, tzinfo=timezone.utc),
        )
        _db.session.add(tender)
        _db.session.flush()

        bidder = Bidder(
            id="BIDDER-TEST",
            organization_id=org.id,
            legal_name="ABC Technologies Pvt Ltd",
        )
        _db.session.add(bidder)
        _db.session.flush()

        bid = Bid(
            id="BID-TEST",
            tender_id=tender.id,
            bidder_id=bidder.id,
            quoted_amount=100000,
            status="DRAFT",
        )
        _db.session.add(bid)
        _db.session.commit()

        token = create_access_token(
            user_id=user.id,
            organization_id=org.id,
            role="PROCUREMENT_OFFICER",
            name="Test Officer",
        )

        return {
            "org_id": org.id,
            "user_id": user.id,
            "tender_id": tender.id,
            "bidder_id": bidder.id,
            "bid_id": bid.id,
            "token": token,
        }


@pytest.fixture
def auth_headers(seed_data):
    return {"Authorization": f"Bearer {seed_data['token']}"}


@pytest.fixture
def other_org_token(app, seed_data):
    """Create a user in a different organization."""
    with app.app_context():
        org2 = Organization(id="ORG-OTHER", name="Other Org", code="OORG", status="ACTIVE")
        _db.session.add(org2)
        _db.session.flush()
        user2 = User(
            id="USER-OTHER",
            organization_id=org2.id,
            email="other@test.com",
            password_hash="hashed",
            name="Other Officer",
            role="PROCUREMENT_OFFICER",
        )
        _db.session.add(user2)
        _db.session.commit()
        return create_access_token(
            user_id=user2.id,
            organization_id=org2.id,
            role="PROCUREMENT_OFFICER",
            name="Other Officer",
        )


@pytest.fixture
def viewer_token(seed_data):
    """Create a token for a user with role VIEWER (unauthorized for upload/delete)."""
    return create_access_token(
        user_id="USER-VIEWER",
        organization_id=seed_data["org_id"],
        role="VIEWER",
        name="Viewer Officer",
    )


# ===========================================================================
# API Tests — Upload
# ===========================================================================

class TestUploadDocument:
    """POST /api/v1/bids/{bid_id}/documents"""

    def test_upload_valid_pdf(self, client, seed_data, auth_headers):
        data = {
            "file": (io.BytesIO(_make_pdf()), "gst_certificate.pdf"),
            "document_type": "GST_CERTIFICATE",
        }
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data=data,
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 201
        body = resp.get_json()
        assert body["success"] is True
        assert body["data"]["document_type"] == "GST_CERTIFICATE"
        assert body["data"]["processing_status"] == "UPLOADED"
        assert body["data"]["original_filename"] == "gst_certificate.pdf"
        assert body["data"]["mime_type"] == "application/pdf"
        assert body["data"]["bid_id"] == seed_data["bid_id"]
        assert "storage_key" not in body["data"]  # Must not expose paths

    def test_upload_valid_jpg(self, client, seed_data, auth_headers):
        data = {
            "file": (io.BytesIO(_make_jpg()), "pan_card.jpg"),
            "document_type": "PAN_CARD",
        }
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data=data,
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 201
        body = resp.get_json()
        assert body["data"]["mime_type"] == "image/jpeg"

    def test_upload_valid_png(self, client, seed_data, auth_headers):
        data = {
            "file": (io.BytesIO(_make_png()), "udyam.png"),
            "document_type": "UDYAM_CERTIFICATE",
        }
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data=data,
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 201
        body = resp.get_json()
        assert body["data"]["mime_type"] == "image/png"

    def test_upload_with_description(self, client, seed_data, auth_headers):
        data = {
            "file": (io.BytesIO(_make_pdf()), "fin.pdf"),
            "document_type": "FINANCIAL_STATEMENT",
            "description": "FY 2025-26 audited financials",
        }
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data=data,
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 201
        assert resp.get_json()["data"]["description"] == "FY 2025-26 audited financials"


# ===========================================================================
# API Tests — List
# ===========================================================================

class TestListDocuments:
    """GET /api/v1/bids/{bid_id}/documents"""

    def test_list_empty(self, client, seed_data, auth_headers):
        resp = client.get(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.get_json()["data"] == []

    def test_list_after_upload(self, client, seed_data, auth_headers):
        # Upload two documents with distinct content
        for doc_type, name in [("GST_CERTIFICATE", "gst.pdf"), ("PAN_CARD", "pan.pdf")]:
            unique_content = _make_pdf(256) + doc_type.encode()
            client.post(
                f"/api/v1/bids/{seed_data['bid_id']}/documents",
                data={
                    "file": (io.BytesIO(unique_content), name),
                    "document_type": doc_type,
                },
                content_type="multipart/form-data",
                headers=auth_headers,
            )
        resp = client.get(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.get_json()["data"]
        assert len(data) == 2
        types = {d["document_type"] for d in data}
        assert types == {"GST_CERTIFICATE", "PAN_CARD"}


# ===========================================================================
# API Tests — Detail
# ===========================================================================

class TestDocumentDetail:
    """GET /api/v1/documents/{document_id}"""

    def test_get_detail(self, client, seed_data, auth_headers):
        # Upload first
        upload_resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        doc_id = upload_resp.get_json()["data"]["id"]

        resp = client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.get_json()["data"]
        assert body["id"] == doc_id
        assert body["document_type"] == "GST_CERTIFICATE"
        assert "storage_key" not in body

    def test_get_nonexistent(self, client, seed_data, auth_headers):
        resp = client.get("/api/v1/documents/DOES-NOT-EXIST", headers=auth_headers)
        assert resp.status_code == 404


# ===========================================================================
# API Tests — Delete
# ===========================================================================

class TestDeleteDocument:
    """DELETE /api/v1/documents/{document_id}"""

    def test_delete_document(self, client, seed_data, auth_headers):
        # Upload
        upload_resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "to_delete.pdf"),
                "document_type": "OTHER",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        doc_id = upload_resp.get_json()["data"]["id"]

        # Delete
        resp = client.delete(f"/api/v1/documents/{doc_id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.get_json()["data"]["deleted"] is True

        # Confirm gone
        resp = client.get(f"/api/v1/documents/{doc_id}", headers=auth_headers)
        assert resp.status_code == 404


# ===========================================================================
# Authorization Tests
# ===========================================================================

class TestAuthorization:

    def test_no_jwt_returns_401(self, client, seed_data):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
        )
        assert resp.status_code == 401

    def test_invalid_jwt_returns_401(self, client, seed_data):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert resp.status_code == 401

    def test_wrong_org_returns_403(self, client, seed_data, other_org_token):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {other_org_token}"},
        )
        assert resp.status_code == 403

    def test_wrong_org_list_returns_403(self, client, seed_data, other_org_token):
        resp = client.get(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            headers={"Authorization": f"Bearer {other_org_token}"},
        )
        assert resp.status_code == 403

    def test_wrong_org_detail_returns_403(self, client, app, seed_data, auth_headers, other_org_token):
        # Upload with correct org first
        upload_resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        doc_id = upload_resp.get_json()["data"]["id"]

        # Try to access with other org
        resp = client.get(
            f"/api/v1/documents/{doc_id}",
            headers={"Authorization": f"Bearer {other_org_token}"},
        )
        assert resp.status_code == 403

    def test_nonexistent_bid_returns_404(self, client, seed_data, auth_headers):
        resp = client.post(
            "/api/v1/bids/BID-NONEXISTENT/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 404

    def test_unauthorized_role_upload_returns_403(self, client, seed_data, viewer_token):
        """User with VIEWER role cannot upload documents."""
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {viewer_token}"},
        )
        assert resp.status_code == 403

    def test_unauthorized_role_delete_returns_403(self, client, seed_data, auth_headers, viewer_token):
        """User with VIEWER role cannot delete documents."""
        # Upload first as officer
        upload_resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        doc_id = upload_resp.get_json()["data"]["id"]

        # Attempt delete as viewer
        resp = client.delete(
            f"/api/v1/documents/{doc_id}",
            headers={"Authorization": f"Bearer {viewer_token}"},
        )
        assert resp.status_code == 403


# ===========================================================================
# File Validation Tests
# ===========================================================================

class TestFileValidation:

    def test_no_file_returns_400(self, client, seed_data, auth_headers):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={"document_type": "GST_CERTIFICATE"},
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert resp.get_json()["error"]["code"] == "EMPTY_FILE"

    def test_empty_file_returns_400(self, client, seed_data, auth_headers):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(b""), "empty.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert resp.get_json()["error"]["code"] == "EMPTY_FILE"

    def test_exe_file_rejected(self, client, seed_data, auth_headers):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(b"MZ" + b"\x00" * 100), "malware.exe"),
                "document_type": "OTHER",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert resp.get_json()["error"]["code"] == "INVALID_FILE_TYPE"

    def test_zip_file_rejected(self, client, seed_data, auth_headers):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(b"PK\x03\x04" + b"\x00" * 100), "archive.zip"),
                "document_type": "OTHER",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert resp.get_json()["error"]["code"] == "INVALID_FILE_TYPE"

    def test_wrong_magic_bytes_rejected(self, client, seed_data, auth_headers):
        """PDF extension but JPEG content — magic byte mismatch."""
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_jpg()), "fake.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert resp.get_json()["error"]["code"] == "INVALID_FILE_SIGNATURE"

    def test_corrupt_file_rejected(self, client, seed_data, auth_headers):
        """File with correct extension but garbage content."""
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(b"this is not a pdf at all"), "corrupt.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert resp.get_json()["error"]["code"] == "INVALID_FILE_SIGNATURE"

    def test_invalid_mime_type_rejected(self, client, seed_data, auth_headers):
        """File with spoofed or invalid MIME type is rejected."""
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "spoofed.pdf", "image/gif"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert resp.get_json()["error"]["code"] == "INVALID_FILE_TYPE"

    def test_oversized_file_rejected(self, client, seed_data, auth_headers):
        """File exceeding 10 MB limit is rejected."""
        # 10 MB + 512 bytes
        oversized_content = _make_pdf(10 * 1024 * 1024 + 512)
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(oversized_content), "too_large.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code in (400, 413)
        body = resp.get_json()
        assert body["error"]["code"] in ("FILE_TOO_LARGE", "VALIDATION_ERROR")


# ===========================================================================
# Document Type Validation Tests
# ===========================================================================

class TestDocumentTypeValidation:

    def test_missing_document_type(self, client, seed_data, auth_headers):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={"file": (io.BytesIO(_make_pdf()), "gst.pdf")},
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 400

    def test_invalid_document_type_string(self, client, seed_data, auth_headers):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "gst.pdf"),
                "document_type": "gst",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert resp.get_json()["error"]["code"] == "INVALID_DOCUMENT_TYPE"

    def test_unknown_document_type(self, client, seed_data, auth_headers):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "gst.pdf"),
                "document_type": "UNKNOWN_TYPE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 400
        assert resp.get_json()["error"]["code"] == "INVALID_DOCUMENT_TYPE"


# ===========================================================================
# Duplicate Detection Tests
# ===========================================================================

class TestDuplicateDetection:

    def test_duplicate_same_bid_rejected(self, client, seed_data, auth_headers):
        pdf_content = _make_pdf(512)
        # First upload
        resp1 = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(pdf_content), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp1.status_code == 201

        # Second upload — same file, same bid
        resp2 = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(pdf_content), "gst_copy.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp2.status_code == 409
        assert resp2.get_json()["error"]["code"] == "DOCUMENT_DUPLICATE"

    def test_same_file_different_bid_allowed(self, client, app, seed_data, auth_headers):
        """Same file content to a different bid should succeed."""
        pdf_content = _make_pdf(512)

        # Upload to first bid
        resp1 = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(pdf_content), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp1.status_code == 201

        # Create a second bid
        with app.app_context():
            bidder2 = Bidder(
                id="BIDDER-TEST2",
                organization_id=seed_data["org_id"],
                legal_name="XYZ Corp",
            )
            _db.session.add(bidder2)
            _db.session.flush()
            bid2 = Bid(
                id="BID-TEST2",
                tender_id=seed_data["tender_id"],
                bidder_id=bidder2.id,
                quoted_amount=200000,
                status="DRAFT",
            )
            _db.session.add(bid2)
            _db.session.commit()

        # Upload same content to second bid
        resp2 = client.post(
            "/api/v1/bids/BID-TEST2/documents",
            data={
                "file": (io.BytesIO(pdf_content), "gst.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp2.status_code == 201


# ===========================================================================
# Storage Verification Test
# ===========================================================================

class TestStorageVerification:

    def test_file_exists_on_disk_after_upload(self, client, app, seed_data, auth_headers):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf()), "stored.pdf"),
                "document_type": "GST_CERTIFICATE",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert resp.status_code == 201
        doc_id = resp.get_json()["data"]["id"]

        storage_root = app.config["UPLOAD_FOLDER"]
        expected_path = os.path.join(
            storage_root, "org", seed_data["org_id"], "bids",
            seed_data["bid_id"], "documents", doc_id,
        )
        assert os.path.exists(expected_path), f"File not found at {expected_path}"

    def test_file_removed_after_delete(self, client, app, seed_data, auth_headers):
        resp = client.post(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf(1024)), "will_delete.pdf"),
                "document_type": "OTHER",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        doc_id = resp.get_json()["data"]["id"]

        storage_root = app.config["UPLOAD_FOLDER"]
        expected_path = os.path.join(
            storage_root, "org", seed_data["org_id"], "bids",
            seed_data["bid_id"], "documents", doc_id,
        )
        assert os.path.exists(expected_path)

        # Delete
        client.delete(f"/api/v1/documents/{doc_id}", headers=auth_headers)
        assert not os.path.exists(expected_path)


# ===========================================================================
# Expected Bid Documents Ingestion Test (6 Standard Types)
# ===========================================================================

class TestExpectedBidDocumentsIngestion:

    def test_ingest_all_six_standard_documents(self, client, seed_data, auth_headers):
        """Procurement officer uploads all 6 standard bid documents sequentially."""
        standard_docs = [
            ("GST_CERTIFICATE", "gst.pdf", _make_pdf(200)),
            ("PAN_CARD", "pan.jpg", _make_jpg(250)),
            ("UDYAM_CERTIFICATE", "udyam.png", _make_png(300)),
            ("OEM_AUTHORIZATION", "oem_auth.pdf", _make_pdf(350)),
            ("FINANCIAL_STATEMENT", "financials.pdf", _make_pdf(400)),
            ("TECHNICAL_SPECIFICATION", "tech_spec.pdf", _make_pdf(450)),
        ]

        uploaded_ids = []
        for doc_type, filename, content in standard_docs:
            resp = client.post(
                f"/api/v1/bids/{seed_data['bid_id']}/documents",
                data={"file": (io.BytesIO(content), filename), "document_type": doc_type},
                content_type="multipart/form-data",
                headers=auth_headers,
            )
            assert resp.status_code == 201
            doc_data = resp.get_json()["data"]
            assert doc_data["document_type"] == doc_type
            assert doc_data["processing_status"] == "UPLOADED"
            uploaded_ids.append(doc_data["id"])

        # List all documents for the bid
        list_resp = client.get(
            f"/api/v1/bids/{seed_data['bid_id']}/documents",
            headers=auth_headers,
        )
        assert list_resp.status_code == 200
        items = list_resp.get_json()["data"]
        assert len(items) == 6
        types_in_response = {item["document_type"] for item in items}
        assert types_in_response == {
            "GST_CERTIFICATE",
            "PAN_CARD",
            "UDYAM_CERTIFICATE",
            "OEM_AUTHORIZATION",
            "FINANCIAL_STATEMENT",
            "TECHNICAL_SPECIFICATION",
        }


# ===========================================================================
# Route Aliases & Org-level Bids Routes Tests
# ===========================================================================

class TestHierarchicalAndOrgRoutes:

    def test_get_all_bids_for_org(self, client, seed_data, auth_headers):
        """GET /api/v1/bids returns all bids for the organization."""
        resp = client.get("/api/v1/bids", headers=auth_headers)
        assert resp.status_code == 200
        bids = resp.get_json()["data"]["bids"]
        assert len(bids) >= 1
        assert bids[0]["id"] == seed_data["bid_id"]

    def test_get_bid_via_tender_scoped_route(self, client, seed_data, auth_headers):
        """GET /api/v1/tenders/{tender_id}/bids/{bid_id} resolves cleanly."""
        resp = client.get(
            f"/api/v1/tenders/{seed_data['tender_id']}/bids/{seed_data['bid_id']}",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.get_json()["data"]["id"] == seed_data["bid_id"]

    def test_upload_and_list_via_tender_scoped_route(self, client, seed_data, auth_headers):
        """POST and GET documents via /tenders/{tender_id}/bids/{bid_id}/documents."""
        upload_resp = client.post(
            f"/api/v1/tenders/{seed_data['tender_id']}/bids/{seed_data['bid_id']}/documents",
            data={
                "file": (io.BytesIO(_make_pdf(500)), "tender_scoped.pdf"),
                "document_type": "OTHER",
            },
            content_type="multipart/form-data",
            headers=auth_headers,
        )
        assert upload_resp.status_code == 201
        doc_id = upload_resp.get_json()["data"]["id"]

        list_resp = client.get(
            f"/api/v1/tenders/{seed_data['tender_id']}/bids/{seed_data['bid_id']}/documents",
            headers=auth_headers,
        )
        assert list_resp.status_code == 200
        docs = list_resp.get_json()["data"]
        assert any(d["id"] == doc_id for d in docs)
