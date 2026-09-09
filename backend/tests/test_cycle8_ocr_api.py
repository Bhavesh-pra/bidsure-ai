"""
Main Developer 2 — Cycle 8 API & Database Integration Tests.

Tests:
  - Triggering processing via POST /api/v1/documents/<id>/process
  - Document status polling via GET /api/v1/documents/<id>
  - Page-aware raw text retrieval via GET /api/v1/documents/<id>/pages
  - Multi-page document persistence in document_pages table
  - Empty and corrupt document failure handling
  - Idempotent re-processing
  - Cascade deletion of document pages
  - Tenancy and authorization enforcement
"""

import io
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.models.models import db, Organization, User, Tender, Bidder, Bid, Document, DocumentPage
from app.security.jwt_manager import create_access_token


@pytest.fixture
def ocr_docs_dir():
    return Path(__file__).parent.parent.parent / "tests" / "ocr" / "documents"


@pytest.fixture
def app_and_client(tmp_path):
    app = create_app("testing")
    app.config["UPLOAD_FOLDER"] = str(tmp_path / "storage")
    app.config["MAX_CONTENT_LENGTH"] = 15 * 1024 * 1024

    with app.app_context():
        db.create_all()

        # Primary Tenant
        org = Organization(id="ORG-TEST-1", name="Defense Procurement", code="DOD1", status="ACTIVE")
        db.session.add(org)

        officer = User(
            id="USR-OFFICER-1",
            organization_id=org.id,
            email="officer@defense.gov",
            password_hash="hashed_pw",
            name="Major Procurement",
            role="PROCUREMENT_OFFICER",
        )
        db.session.add(officer)

        viewer = User(
            id="USR-VIEWER-1",
            organization_id=org.id,
            email="viewer@defense.gov",
            password_hash="hashed_pw",
            name="Auditor General",
            role="AUDITOR",
        )
        db.session.add(viewer)

        tender = Tender(
            id="TND-TEST-1",
            organization_id=org.id,
            tender_number="TND/2026/001",
            title="Defense Network Overhaul",
            category="GOODS",
            submission_deadline=datetime(2027, 1, 1, tzinfo=timezone.utc),
        )
        db.session.add(tender)

        bidder = Bidder(id="BDR-TEST-1", organization_id=org.id, legal_name="Apex Aero Ltd")
        db.session.add(bidder)

        bid = Bid(
            id="BID-TEST-1",
            tender_id=tender.id,
            bidder_id=bidder.id,
            quoted_amount=5000000.0,
            status="SUBMITTED",
        )
        db.session.add(bid)

        # Rival Tenant (for cross-org access tests)
        rival_org = Organization(id="ORG-RIVAL-2", name="Rival Dept", code="RIVAL2", status="ACTIVE")
        db.session.add(rival_org)

        rival_officer = User(
            id="USR-RIVAL-1",
            organization_id=rival_org.id,
            email="officer@rival.gov",
            password_hash="hashed_pw",
            name="Rival Officer",
            role="PROCUREMENT_OFFICER",
        )
        db.session.add(rival_officer)

        db.session.commit()

        officer_token = create_access_token(officer.id, org.id, officer.role, officer.name)
        viewer_token = create_access_token(viewer.id, org.id, viewer.role, viewer.name)
        rival_token = create_access_token(rival_officer.id, rival_org.id, rival_officer.role, rival_officer.name)

    client = app.test_client()
    return app, client, {
        "officer_token": officer_token,
        "viewer_token": viewer_token,
        "rival_token": rival_token,
        "bid_id": "BID-TEST-1",
        "org_id": "ORG-TEST-1",
    }


def _upload_file(client, token, bid_id, file_path, doc_type="GST_CERTIFICATE"):
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    res = client.post(
        f"/api/v1/bids/{bid_id}/documents",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "file": (io.BytesIO(file_bytes), Path(file_path).name),
            "document_type": doc_type,
            "description": "Uploaded for Cycle 8 OCR testing",
        },
        content_type="multipart/form-data",
    )
    assert res.status_code == 201, f"Upload failed: {res.get_json()}"
    return res.get_json()["data"]


# ===========================================================================
# Main Developer 2 API Tests
# ===========================================================================

def test_process_document_success_with_clear_pdf(app_and_client, ocr_docs_dir):
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    gst_file = ocr_docs_dir / "01_gst_clear_text.pdf"
    doc = _upload_file(client, token, bid_id, gst_file, "GST_CERTIFICATE")
    doc_id = doc["id"]

    # Trigger processing
    res = client.post(
        f"/api/v1/documents/{doc_id}/process",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]

    assert data["document_id"] == doc_id
    assert data["processing_status"] == "PROCESSED"
    assert data["page_count"] == 2
    assert data["ocr_engine"] == "direct_extraction"

    # Verify DB persistence
    with app.app_context():
        db_doc = Document.query.get(doc_id)
        assert db_doc.processing_status == "PROCESSED"
        assert db_doc.page_count == 2

        pages = DocumentPage.query.filter_by(document_id=doc_id).order_by(DocumentPage.page_number.asc()).all()
        assert len(pages) == 2

        # Page 1
        assert pages[0].page_number == 1
        assert "27AABCA1234F1Z8" in pages[0].raw_text
        assert pages[0].ocr_confidence == 1.0
        assert pages[0].extraction_method == "EMBEDDED_TEXT"

        # Page 2
        assert pages[1].page_number == 2
        assert "AABCA1234F" in pages[1].raw_text


def test_get_document_status_polling(app_and_client, ocr_docs_dir):
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    gst_file = ocr_docs_dir / "01_gst_clear_text.pdf"
    doc = _upload_file(client, token, bid_id, gst_file, "GST_CERTIFICATE")
    doc_id = doc["id"]

    # Initial status
    res = client.get(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["data"]["processing_status"] == "UPLOADED"

    # Process
    client.post(f"/api/v1/documents/{doc_id}/process", headers={"Authorization": f"Bearer {token}"})

    # Poll status
    res = client.get(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    polled = res.get_json()["data"]
    assert polled["processing_status"] == "PROCESSED"
    assert polled["page_count"] == 2


def test_get_document_pages_returns_ordered_text(app_and_client, ocr_docs_dir):
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    gst_file = ocr_docs_dir / "01_gst_clear_text.pdf"
    doc = _upload_file(client, token, bid_id, gst_file, "GST_CERTIFICATE")
    doc_id = doc["id"]

    client.post(f"/api/v1/documents/{doc_id}/process", headers={"Authorization": f"Bearer {token}"})

    # Fetch pages
    res = client.get(f"/api/v1/documents/{doc_id}/pages", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()["data"]

    assert data["document_id"] == doc_id
    assert data["processing_status"] == "PROCESSED"
    assert data["page_count"] == 2
    assert len(data["pages"]) == 2

    p1, p2 = data["pages"][0], data["pages"][1]
    assert p1["page_number"] == 1
    assert "27AABCA1234F1Z8" in p1["raw_text"]
    assert p1["ocr_confidence"] == 1.0

    assert p2["page_number"] == 2
    assert "AABCA1234F" in p2["raw_text"]


def test_process_multipage_document_persists_all_pages(app_and_client, ocr_docs_dir):
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    oem_file = ocr_docs_dir / "03_oem_multipage.pdf"
    doc = _upload_file(client, token, bid_id, oem_file, "OEM_AUTHORIZATION")
    doc_id = doc["id"]

    res = client.post(f"/api/v1/documents/{doc_id}/process", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["data"]["page_count"] == 3

    # Check pages endpoint
    pages_res = client.get(f"/api/v1/documents/{doc_id}/pages", headers={"Authorization": f"Bearer {token}"})
    assert pages_res.status_code == 200
    pages = pages_res.get_json()["data"]["pages"]
    assert len(pages) == 3

    assert pages[0]["page_number"] == 1
    assert "OEM-AUTH-2026-089" in pages[0]["raw_text"]

    assert pages[1]["page_number"] == 2
    assert "Catalyst 9300" in pages[1]["raw_text"]

    assert pages[2]["page_number"] == 3
    assert "Genuine Spares Certificate" in pages[2]["raw_text"]


def test_process_empty_document_marks_unreadable(app_and_client, ocr_docs_dir):
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    empty_file = ocr_docs_dir / "06_empty.pdf"
    doc = _upload_file(client, token, bid_id, empty_file, "OTHER")
    doc_id = doc["id"]

    res = client.post(f"/api/v1/documents/{doc_id}/process", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["processing_status"] == "UNREADABLE"

    with app.app_context():
        db_doc = Document.query.get(doc_id)
        assert db_doc.processing_status == "UNREADABLE"


def test_process_idempotency_does_not_duplicate_pages(app_and_client, ocr_docs_dir):
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    gst_file = ocr_docs_dir / "01_gst_clear_text.pdf"
    doc = _upload_file(client, token, bid_id, gst_file, "GST_CERTIFICATE")
    doc_id = doc["id"]

    # Process first time
    res1 = client.post(f"/api/v1/documents/{doc_id}/process", headers={"Authorization": f"Bearer {token}"})
    assert res1.status_code == 200

    # Process second time (idempotent re-run)
    res2 = client.post(f"/api/v1/documents/{doc_id}/process", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 200

    with app.app_context():
        pages = DocumentPage.query.filter_by(document_id=doc_id).all()
        # Must still be exactly 2 pages, not 4
        assert len(pages) == 2


def test_delete_document_cascades_pages(app_and_client, ocr_docs_dir):
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    gst_file = ocr_docs_dir / "01_gst_clear_text.pdf"
    doc = _upload_file(client, token, bid_id, gst_file, "GST_CERTIFICATE")
    doc_id = doc["id"]

    # Process
    client.post(f"/api/v1/documents/{doc_id}/process", headers={"Authorization": f"Bearer {token}"})

    with app.app_context():
        assert DocumentPage.query.filter_by(document_id=doc_id).count() == 2

    # Delete document
    del_res = client.delete(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_res.status_code == 200

    with app.app_context():
        assert Document.query.get(doc_id) is None
        # All associated pages must be deleted
        assert DocumentPage.query.filter_by(document_id=doc_id).count() == 0


def test_authorization_and_tenancy(app_and_client, ocr_docs_dir):
    app, client, creds = app_and_client
    officer_token = creds["officer_token"]
    rival_token = creds["rival_token"]
    bid_id = creds["bid_id"]

    gst_file = ocr_docs_dir / "01_gst_clear_text.pdf"
    doc = _upload_file(client, officer_token, bid_id, gst_file, "GST_CERTIFICATE")
    doc_id = doc["id"]

    # 1. No JWT
    res_no_jwt = client.post(f"/api/v1/documents/{doc_id}/process")
    assert res_no_jwt.status_code == 401

    # 2. Cross-tenant access attempt to trigger process
    res_cross_org = client.post(
        f"/api/v1/documents/{doc_id}/process",
        headers={"Authorization": f"Bearer {rival_token}"},
    )
    assert res_cross_org.status_code == 403

    # 3. Cross-tenant access attempt to get pages
    res_cross_pages = client.get(
        f"/api/v1/documents/{doc_id}/pages",
        headers={"Authorization": f"Bearer {rival_token}"},
    )
    assert res_cross_pages.status_code == 403

    # 4. Non-existent document
    res_404 = client.post(
        "/api/v1/documents/NON-EXISTENT-ID/process",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res_404.status_code == 404
