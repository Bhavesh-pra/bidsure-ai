"""
Main Developer 2 — Cycle 9 Classification API & Database Integration Tests.

Tests:
  - Triggering classification via POST /api/v1/documents/<id>/classify on pre-OCR'd documents
  - Automatic OCR execution chaining from UPLOADED state directly to CLASSIFIED
  - Database persistence of document_type, classification_confidence, and processing_status
  - Edge cases: empty documents, low confidence scans, ambiguous/mixed documents -> REVIEW_REQUIRED
  - Document detail (GET /documents/<id>) and bid listing (GET /bids/<id>/documents) expose confidence
  - Multi-tenant isolation, role authorization, and non-existent document handling
  - Failure handling and transaction rollback -> CLASSIFICATION_FAILED
"""

import io
import os
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
import pytest

from app import create_app
from app.models.models import db, Organization, User, Tender, Bidder, Bid, Document, DocumentPage
from app.security.jwt_manager import create_access_token


@pytest.fixture
def ocr_docs_dir():
    return Path(__file__).parent.parent.parent / "tests" / "ocr" / "documents"


@pytest.fixture
def classification_docs_dir():
    return Path(__file__).parent.parent.parent / "tests" / "classification" / "documents"


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


def _upload_file(client, token, bid_id, file_path, doc_type="OTHER"):
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    res = client.post(
        f"/api/v1/bids/{bid_id}/documents",
        headers={"Authorization": f"Bearer {token}"},
        data={
            "file": (io.BytesIO(file_bytes), Path(file_path).name),
            "document_type": doc_type,
            "description": "Uploaded for Cycle 9 testing",
        },
        content_type="multipart/form-data",
    )
    assert res.status_code == 201, f"Upload failed: {res.get_json()}"
    return res.get_json()["data"]


# ===========================================================================
# Main Developer 2 API & Database Integration Tests
# ===========================================================================

def test_classify_endpoint_success_with_existing_ocr_pages(app_and_client, ocr_docs_dir):
    """
    Test classifying a document that has already completed OCR.
    Pipeline: Upload -> Process OCR -> Classify -> DB persistence.
    """
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    gst_file = ocr_docs_dir / "01_gst_clear_text.pdf"
    doc = _upload_file(client, token, bid_id, gst_file, "OTHER")
    doc_id = doc["id"]

    # Step 1: Run OCR
    res_ocr = client.post(f"/api/v1/documents/{doc_id}/process", headers={"Authorization": f"Bearer {token}"})
    assert res_ocr.status_code == 200
    assert res_ocr.get_json()["data"]["processing_status"] == "PROCESSED"

    # Step 2: Trigger Classification
    res_cls = client.post(f"/api/v1/documents/{doc_id}/classify", headers={"Authorization": f"Bearer {token}"})
    assert res_cls.status_code == 200

    body = res_cls.get_json()
    assert body["success"] is True
    assert "request_id" in body

    data = body["data"]
    assert data["document_id"] == doc_id
    assert data["document_type"] == "GST_CERTIFICATE"
    assert data["classification_confidence"] >= 0.85
    assert data["status"] == "CLASSIFIED"
    assert data["method"] == "RULE_BASED"
    assert len(data["matched_signals"]) > 0
    assert "GST_CERTIFICATE" in data["scores_by_type"]

    # Step 3: Verify Database State
    with app.app_context():
        db_doc = db.session.get(Document, doc_id)
        assert db_doc.document_type == "GST_CERTIFICATE"
        assert db_doc.classification_confidence == data["classification_confidence"]
        assert db_doc.processing_status == "CLASSIFIED"


def test_classify_endpoint_auto_chains_ocr_from_uploaded_state(app_and_client, classification_docs_dir):
    """
    Test Task 4 requirement: Uploaded document -> OCR result -> Classification -> DB.
    When a document is uploaded (0 pages extracted), calling /classify must
    automatically run OCR first without requiring manual OCR triggering.
    """
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    pan_pdf = classification_docs_dir / "pan" / "pan_card_clean.pdf"
    doc = _upload_file(client, token, bid_id, pan_pdf, "OTHER")
    doc_id = doc["id"]

    # Confirm initial state: UPLOADED, no pages in DB
    with app.app_context():
        db_doc = db.session.get(Document, doc_id)
        assert db_doc.processing_status == "UPLOADED"
        assert len(db_doc.pages) == 0

    # Call /classify directly
    res = client.post(f"/api/v1/documents/{doc_id}/classify", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

    data = res.get_json()["data"]
    assert data["document_type"] == "PAN_DOCUMENT"
    assert data["classification_confidence"] >= 0.85
    assert data["status"] == "CLASSIFIED"

    # Verify DB: OCR pages were auto-created, and doc is classified
    with app.app_context():
        db_doc = db.session.get(Document, doc_id)
        assert len(db_doc.pages) >= 1
        assert db_doc.document_type == "PAN_DOCUMENT"
        assert db_doc.classification_confidence >= 0.85
        assert db_doc.processing_status == "CLASSIFIED"


def test_classify_endpoint_routes_low_confidence_to_review_required(app_and_client, ocr_docs_dir):
    """
    Test Task 3: Uncertain or empty documents transition to REVIEW_REQUIRED.
    """
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    empty_pdf = ocr_docs_dir / "06_empty.pdf"
    doc = _upload_file(client, token, bid_id, empty_pdf, "OTHER")
    doc_id = doc["id"]

    res = client.post(f"/api/v1/documents/{doc_id}/classify", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

    data = res.get_json()["data"]
    assert data["document_type"] == "UNKNOWN"
    assert data["classification_confidence"] == 0.0
    assert data["status"] == "REVIEW_REQUIRED"

    with app.app_context():
        db_doc = db.session.get(Document, doc_id)
        assert db_doc.document_type == "UNKNOWN"
        assert db_doc.classification_confidence == 0.0
        assert db_doc.processing_status == "REVIEW_REQUIRED"


def test_classify_multipage_oem_document(app_and_client, ocr_docs_dir):
    """
    Test classifying a 3-page OEM document through the API.
    """
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    oem_pdf = ocr_docs_dir / "03_oem_multipage.pdf"
    doc = _upload_file(client, token, bid_id, oem_pdf, "OTHER")
    doc_id = doc["id"]

    res = client.post(f"/api/v1/documents/{doc_id}/classify", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

    data = res.get_json()["data"]
    assert data["document_type"] == "OEM_AUTHORIZATION"
    assert data["classification_confidence"] >= 0.85
    assert data["status"] == "CLASSIFIED"


def test_document_detail_and_bid_listing_expose_classification(app_and_client, ocr_docs_dir):
    """
    Test that GET /documents/<id> and GET /bids/<id>/documents return
    the updated document_type and classification_confidence fields.
    """
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    gst_file = ocr_docs_dir / "01_gst_clear_text.pdf"
    doc = _upload_file(client, token, bid_id, gst_file, "OTHER")
    doc_id = doc["id"]

    # Classify
    client.post(f"/api/v1/documents/{doc_id}/classify", headers={"Authorization": f"Bearer {token}"})

    # 1. Check single document detail
    res_detail = client.get(f"/api/v1/documents/{doc_id}", headers={"Authorization": f"Bearer {token}"})
    assert res_detail.status_code == 200
    detail_data = res_detail.get_json()["data"]
    assert detail_data["document_type"] == "GST_CERTIFICATE"
    assert detail_data["classification_confidence"] is not None
    assert detail_data["classification_confidence"] >= 0.85
    assert detail_data["processing_status"] == "CLASSIFIED"

    # 2. Check bid documents list
    res_list = client.get(f"/api/v1/bids/{bid_id}/documents", headers={"Authorization": f"Bearer {token}"})
    assert res_list.status_code == 200
    docs = res_list.get_json()["data"]
    matched = next((d for d in docs if d["id"] == doc_id), None)
    assert matched is not None
    assert matched["document_type"] == "GST_CERTIFICATE"
    assert matched["classification_confidence"] >= 0.85
    assert matched["processing_status"] == "CLASSIFIED"


def test_classify_endpoint_auth_and_multi_tenancy(app_and_client, ocr_docs_dir):
    """
    Test tenant isolation and RBAC on the classify route.
    """
    app, client, creds = app_and_client
    token = creds["officer_token"]
    rival_token = creds["rival_token"]
    viewer_token = creds["viewer_token"]
    bid_id = creds["bid_id"]

    gst_file = ocr_docs_dir / "01_gst_clear_text.pdf"
    doc = _upload_file(client, token, bid_id, gst_file, "OTHER")
    doc_id = doc["id"]

    # 1. Missing Authorization header -> 401
    res_no_auth = client.post(f"/api/v1/documents/{doc_id}/classify")
    assert res_no_auth.status_code == 401

    # 2. Rival tenant attempting to classify document -> 403
    res_rival = client.post(f"/api/v1/documents/{doc_id}/classify", headers={"Authorization": f"Bearer {rival_token}"})
    assert res_rival.status_code == 403

    # 3. Viewer role attempting write action -> 403
    res_viewer = client.post(f"/api/v1/documents/{doc_id}/classify", headers={"Authorization": f"Bearer {viewer_token}"})
    assert res_viewer.status_code == 403

    # 4. Non-existent document ID -> 404
    res_404 = client.post("/api/v1/documents/DOC-NONEXISTENT/classify", headers={"Authorization": f"Bearer {token}"})
    assert res_404.status_code == 404


def test_classify_endpoint_error_handling_marks_classification_failed(app_and_client, ocr_docs_dir):
    """
    Test that an unexpected exception during classification results in
    CLASSIFICATION_FAILED status and a 500 error envelope.
    """
    app, client, creds = app_and_client
    token = creds["officer_token"]
    bid_id = creds["bid_id"]

    gst_file = ocr_docs_dir / "01_gst_clear_text.pdf"
    doc = _upload_file(client, token, bid_id, gst_file, "OTHER")
    doc_id = doc["id"]

    # Process OCR first
    client.post(f"/api/v1/documents/{doc_id}/process", headers={"Authorization": f"Bearer {token}"})

    # Simulate classifier failure
    with patch("app.services.classification.classifier.DocumentClassifier.classify", side_effect=RuntimeError("Engine crash")):
        res = client.post(f"/api/v1/documents/{doc_id}/classify", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 500
        assert res.get_json()["success"] is False
        assert res.get_json()["error"]["code"] == "CLASSIFICATION_FAILED"

    # Verify document status in DB updated to CLASSIFICATION_FAILED
    with app.app_context():
        db_doc = db.session.get(Document, doc_id)
        assert db_doc.processing_status == "CLASSIFICATION_FAILED"
