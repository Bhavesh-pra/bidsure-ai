import io
import pytest
import shutil
import tempfile
from app import create_app
from app.models import db, Organization, Tender, Bidder, Bid, Document
from app.domain.document import DocumentType, DocumentStatus
from app.services.storage_service import LocalStorageService

@pytest.fixture
def test_app():
    temp_dir = tempfile.mkdtemp()
    app = create_app("test")
    app.config["UPLOAD_FOLDER"] = temp_dir
    with app.app_context():
        db.create_all()
        # Seed test organization, tender, bidder, and bid
        org = Organization(id="ORG001", name="Test Org 1")
        org2 = Organization(id="ORG002", name="Test Org 2")
        tender = Tender(id="TND001", organization_id="ORG001", title="Test Tender", category="IT")
        bidder = Bidder(id="BDR001", name="Test Bidder Pvt Ltd")
        bid = Bid(id="BID001", tender_id="TND001", bidder_id="BDR001", status="SUBMITTED")

        db.session.add_all([org, org2, tender, bidder, bid])
        db.session.commit()

        yield app
        db.session.remove()
        db.drop_all()

    shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture
def client(test_app):
    return test_app.test_client()

def test_local_storage_service(tmp_path):
    storage = LocalStorageService(base_folder=str(tmp_path))
    storage_key = "org/ORG001/bids/BID001/documents/DOC001"
    content = b"%PDF-1.4 test document binary content"

    key = storage.upload(content, storage_key, mime_type="application/pdf")
    assert key == storage_key

    retrieved = storage.get(storage_key)
    assert retrieved == content

    assert storage.delete(storage_key) is True
    assert storage.get(storage_key) is None

def test_upload_document_success(client):
    pdf_data = b"%PDF-1.4 header and pdf content for testing upload"
    data = {
        "file": (io.BytesIO(pdf_data), "gst_certificate.pdf"),
        "document_type": "GST_CERTIFICATE"
    }

    res = client.post(
        "/api/v1/bids/BID001/documents",
        data=data,
        content_type="multipart/form-data",
        headers={"X-Organization-ID": "ORG001"}
    )
    assert res.status_code == 201
    json_data = res.get_json()
    assert json_data["success"] is True
    doc = json_data["data"]

    assert doc["bid_id"] == "BID001"
    assert doc["document_type"] == "GST_CERTIFICATE"
    assert doc["original_filename"] == "gst_certificate.pdf"
    assert doc["processing_status"] == "UPLOADED"
    assert doc["mime_type"] == "application/pdf"
    assert len(doc["sha256"]) == 64

def test_duplicate_document_upload_rejected(client):
    pdf_data = b"%PDF-1.4 header for duplicate test"
    data1 = {
        "file": (io.BytesIO(pdf_data), "gst1.pdf"),
        "document_type": "GST_CERTIFICATE"
    }

    res1 = client.post(
        "/api/v1/bids/BID001/documents",
        data=data1,
        content_type="multipart/form-data",
        headers={"X-Organization-ID": "ORG001"}
    )
    assert res1.status_code == 201

    # Upload exact same file payload again to the same bid
    data2 = {
        "file": (io.BytesIO(pdf_data), "gst2.pdf"),
        "document_type": "GST_CERTIFICATE"
    }
    res2 = client.post(
        "/api/v1/bids/BID001/documents",
        data=data2,
        content_type="multipart/form-data",
        headers={"X-Organization-ID": "ORG001"}
    )
    assert res2.status_code == 409
    err = res2.get_json()
    assert err["success"] is False
    assert err["error"]["code"] == "DOCUMENT_DUPLICATE"

def test_upload_invalid_file_extension(client):
    exe_data = b"MZ executable dummy header"
    data = {
        "file": (io.BytesIO(exe_data), "malicious.exe"),
        "document_type": "GST_CERTIFICATE"
    }
    res = client.post(
        "/api/v1/bids/BID001/documents",
        data=data,
        content_type="multipart/form-data",
        headers={"X-Organization-ID": "ORG001"}
    )
    assert res.status_code == 400
    err = res.get_json()
    assert err["error"]["code"] == "INVALID_FILE_TYPE"

def test_upload_file_too_large(client):
    # Construct buffer exceeding 10 MB
    large_data = b"%PDF-1.4 " + b"0" * (10 * 1024 * 1024 + 100)
    data = {
        "file": (io.BytesIO(large_data), "large.pdf"),
        "document_type": "GST_CERTIFICATE"
    }
    res = client.post(
        "/api/v1/bids/BID001/documents",
        data=data,
        content_type="multipart/form-data",
        headers={"X-Organization-ID": "ORG001"}
    )
    assert res.status_code == 400
    err = res.get_json()
    assert err["error"]["code"] == "FILE_TOO_LARGE"

def test_list_and_get_document(client):
    pdf_data = b"%PDF-1.4 valid test file payload"
    data = {
        "file": (io.BytesIO(pdf_data), "pan_card.pdf"),
        "document_type": "PAN_CARD"
    }
    res_up = client.post(
        "/api/v1/bids/BID001/documents",
        data=data,
        content_type="multipart/form-data",
        headers={"X-Organization-ID": "ORG001"}
    )
    assert res_up.status_code == 201
    doc_id = res_up.get_json()["data"]["id"]

    # List documents
    res_list = client.get("/api/v1/bids/BID001/documents", headers={"X-Organization-ID": "ORG001"})
    assert res_list.status_code == 200
    docs = res_list.get_json()["data"]
    assert len(docs) == 1
    assert docs[0]["id"] == doc_id

    # Get document details
    res_det = client.get(f"/api/v1/documents/{doc_id}", headers={"X-Organization-ID": "ORG001"})
    assert res_det.status_code == 200
    det = res_det.get_json()["data"]
    assert det["id"] == doc_id

    # Download binary file content
    res_file = client.get(f"/api/v1/documents/{doc_id}/file", headers={"X-Organization-ID": "ORG001"})
    assert res_file.status_code == 200
    assert res_file.data == pdf_data

def test_unauthorized_organization_access(client):
    pdf_data = b"%PDF-1.4 valid content"
    data = {
        "file": (io.BytesIO(pdf_data), "pan.pdf"),
        "document_type": "PAN_CARD"
    }
    # Upload with wrong organization header (ORG002 trying to upload to ORG001's bid)
    res = client.post(
        "/api/v1/bids/BID001/documents",
        data=data,
        content_type="multipart/form-data",
        headers={"X-Organization-ID": "ORG002"}
    )
    assert res.status_code == 403
    err = res.get_json()
    assert err["error"]["code"] == "UNAUTHORIZED_ACCESS"
