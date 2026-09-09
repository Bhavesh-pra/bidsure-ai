"""
Cycle 7 — Automated Definition of Done (DoD) Verification Runner.

Runs end-to-end verification of all Cycle 7 requirements:
  - Document Model & Table
  - Valid File Ingestion (PDF, JPG, PNG)
  - Metadata & SHA-256 Hash Generation
  - Path Protection (storage_key NOT exposed)
  - Duplicate Detection (DOCUMENT_DUPLICATE 409)
  - Security Validations (EXE, ZIP, Corrupt signature, Oversized)
  - Authorization & Tenancy (No JWT, Wrong Org, Unauthorized Role)
  - Object Storage Verification (File on disk & cleanup on delete)
"""

import io
import os
import shutil
import sys
from datetime import datetime, timezone

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.models.models import db, Organization, User, Tender, Bidder, Bid, Document
from app.security.jwt_manager import create_access_token


def make_pdf(size=300):
    header = b"%PDF-1.4\n"
    return header + b"0" * max(0, size - len(header))

def make_jpg(size=300):
    header = b"\xff\xd8\xff\xe0"
    return header + b"\x00" * max(0, size - len(header))

def make_png(size=300):
    header = b"\x89PNG\r\n\x1a\n"
    return header + b"\x00" * max(0, size - len(header))


def run_dod_verification():
    print("=" * 70)
    print("BidSure AI — Cycle 7 Definition of Done (DoD) Verification Runner")
    print("=" * 70)

    app = create_app("testing")
    app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
    test_storage_dir = os.path.join(os.path.dirname(__file__), "_dod_test_storage")
    app.config["UPLOAD_FOLDER"] = test_storage_dir

    if os.path.exists(test_storage_dir):
        shutil.rmtree(test_storage_dir, ignore_errors=True)

    results = []

    def record(name, passed, details=""):
        status = "PASS" if passed else "FAIL"
        results.append((name, status, details))
        color = "\033[92m" if passed else "\033[91m"
        reset = "\033[0m"
        print(f"[{color}{status}{reset}] {name}")
        if details and not passed:
            print(f"       -> Details: {details}")

    client = app.test_client()

    with app.app_context():
        db.create_all()

        # 1. Setup Tenant & User
        org = Organization(id="ORG-DOD-1", name="DoD Defense Agency", code="DOD1", status="ACTIVE")
        db.session.add(org)
        user = User(
            id="USER-OFFICER-1",
            organization_id=org.id,
            email="officer@dod.gov",
            password_hash="pwd",
            name="Major Procurement",
            role="PROCUREMENT_OFFICER",
        )
        db.session.add(user)
        tender = Tender(
            id="TND-DOD-1",
            organization_id=org.id,
            tender_number="TND-2026-99",
            title="Defense Network Overhaul",
            category="GOODS",
            submission_deadline=datetime(2026, 12, 31, tzinfo=timezone.utc),
        )
        db.session.add(tender)
        bidder = Bidder(id="BDR-DOD-1", organization_id=org.id, legal_name="Apex Aero Ltd")
        db.session.add(bidder)
        bid = Bid(id="BID-DOD-1", tender_id=tender.id, bidder_id=bidder.id, quoted_amount=7500000)
        db.session.add(bid)

        # Other Org
        org2 = Organization(id="ORG-DOD-2", name="Rival Agency", code="DOD2", status="ACTIVE")
        db.session.add(org2)
        user2 = User(
            id="USER-OTHER-2",
            organization_id=org2.id,
            email="other@rival.gov",
            password_hash="pwd",
            name="Rival Officer",
            role="PROCUREMENT_OFFICER",
        )
        db.session.add(user2)
        db.session.commit()

        # Generate tokens
        officer_token = create_access_token(user.id, org.id, role="PROCUREMENT_OFFICER", name="Major Procurement")
        other_org_token = create_access_token(user2.id, org2.id, role="PROCUREMENT_OFFICER", name="Rival Officer")
        viewer_token = create_access_token("USER-VIEWER", org.id, role="VIEWER", name="Read Only Auditor")

        auth_h = {"Authorization": f"Bearer {officer_token}"}

        # Check 1: Document Table Exists
        record("Document model & database table initialized", hasattr(Document, "sha256"))

        # Check 2: Valid PDF Upload
        pdf_bytes = make_pdf(400)
        resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(pdf_bytes), "gst_cert.pdf"), "document_type": "GST_CERTIFICATE"},
            content_type="multipart/form-data",
            headers=auth_h,
        )
        doc1 = resp.get_json().get("data", {}) if resp.status_code == 201 else {}
        record("Valid PDF document upload (GST_CERTIFICATE)", resp.status_code == 201 and doc1.get("document_type") == "GST_CERTIFICATE")

        # Check 3: Valid JPG Upload
        jpg_bytes = make_jpg(350)
        resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(jpg_bytes), "pan.jpg"), "document_type": "PAN_CARD"},
            content_type="multipart/form-data",
            headers=auth_h,
        )
        doc2 = resp.get_json().get("data", {}) if resp.status_code == 201 else {}
        record("Valid JPG document upload (PAN_CARD)", resp.status_code == 201 and doc2.get("mime_type") == "image/jpeg")

        # Check 4: Valid PNG Upload
        png_bytes = make_png(300)
        resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(png_bytes), "udyam.png"), "document_type": "UDYAM_CERTIFICATE"},
            content_type="multipart/form-data",
            headers=auth_h,
        )
        doc3 = resp.get_json().get("data", {}) if resp.status_code == 201 else {}
        record("Valid PNG document upload (UDYAM_CERTIFICATE)", resp.status_code == 201 and doc3.get("mime_type") == "image/png")

        # Check 5: SHA-256 Hash Generated
        record("SHA-256 hash generated & verified (length = 64)", len(doc1.get("sha256", "")) == 64)

        # Check 6: Path Protection (storage_key NOT exposed)
        record("Internal storage_key not leaked in API response", "storage_key" not in doc1 and "storage_key" not in doc2)

        # Check 7: Duplicate Detection
        dup_resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(pdf_bytes), "gst_cert_duplicate.pdf"), "document_type": "GST_CERTIFICATE"},
            content_type="multipart/form-data",
            headers=auth_h,
        )
        record("Duplicate detection rejects identical file (409 DOCUMENT_DUPLICATE)", dup_resp.status_code == 409 and dup_resp.get_json().get("error", {}).get("code") == "DOCUMENT_DUPLICATE")

        # Check 8: Security - Reject EXE
        exe_resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(b"MZ\x00\x00\x00"), "trojan.exe"), "document_type": "OTHER"},
            content_type="multipart/form-data",
            headers=auth_h,
        )
        record("Security: Executable file (.exe) rejected", exe_resp.status_code == 400 and exe_resp.get_json().get("error", {}).get("code") == "INVALID_FILE_TYPE")

        # Check 9: Security - Reject ZIP
        zip_resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(b"PK\x03\x04\x00"), "files.zip"), "document_type": "OTHER"},
            content_type="multipart/form-data",
            headers=auth_h,
        )
        record("Security: Archive file (.zip) rejected", zip_resp.status_code == 400 and zip_resp.get_json().get("error", {}).get("code") == "INVALID_FILE_TYPE")

        # Check 10: Security - Signature Mismatch
        sig_resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(jpg_bytes), "spoofed.pdf"), "document_type": "GST_CERTIFICATE"},
            content_type="multipart/form-data",
            headers=auth_h,
        )
        record("Security: Corrupt / magic byte mismatch rejected", sig_resp.status_code == 400 and sig_resp.get_json().get("error", {}).get("code") == "INVALID_FILE_SIGNATURE")

        # Check 11: Security - Oversized File
        oversized = make_pdf(10 * 1024 * 1024 + 1024)
        size_resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(oversized), "oversized.pdf"), "document_type": "GST_CERTIFICATE"},
            content_type="multipart/form-data",
            headers=auth_h,
        )
        record("Security: Oversized file (> 10 MB) rejected", size_resp.status_code in (400, 413))

        # Check 12: Auth - Missing Token
        unauth_resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(pdf_bytes), "test.pdf"), "document_type": "GST_CERTIFICATE"},
            content_type="multipart/form-data",
        )
        record("Authorization: Missing JWT rejected (401)", unauth_resp.status_code == 401)

        # Check 13: Auth - Cross-Tenant Access
        cross_resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(make_pdf(500)), "cross.pdf"), "document_type": "GST_CERTIFICATE"},
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {other_org_token}"},
        )
        record("Authorization: Cross-tenant access denied (403)", cross_resp.status_code == 403)

        # Check 14: Auth - Unauthorized Role
        role_resp = client.post(
            f"/api/v1/bids/{bid.id}/documents",
            data={"file": (io.BytesIO(make_pdf(550)), "viewer.pdf"), "document_type": "GST_CERTIFICATE"},
            content_type="multipart/form-data",
            headers={"Authorization": f"Bearer {viewer_token}"},
        )
        record("Authorization: Unauthorized role denied (403)", role_resp.status_code == 403)

        # Check 15: Document List API
        list_resp = client.get(f"/api/v1/bids/{bid.id}/documents", headers=auth_h)
        docs_list = list_resp.get_json().get("data", [])
        record("Document listing API returns uploaded files", list_resp.status_code == 200 and len(docs_list) == 3)

        # Check 16: Document Detail API
        doc1_id = doc1.get("id")
        detail_resp = client.get(f"/api/v1/documents/{doc1_id}", headers=auth_h)
        record("Document detail API returns accurate metadata", detail_resp.status_code == 200 and detail_resp.get_json().get("data", {}).get("id") == doc1_id)

        # Check 17: Physical Storage on Disk
        expected_disk_path = os.path.join(test_storage_dir, "org", org.id, "bids", bid.id, "documents", doc1_id)
        record("File physically stored in deterministic directory structure", os.path.exists(expected_disk_path))

        # Check 18: Document Deletion & Storage Cleanup
        del_resp = client.delete(f"/api/v1/documents/{doc1_id}", headers=auth_h)
        post_del_get = client.get(f"/api/v1/documents/{doc1_id}", headers=auth_h)
        record("Document deletion removes DB record and purges file from disk", del_resp.status_code == 200 and post_del_get.status_code == 404 and not os.path.exists(expected_disk_path))

        # Teardown
        shutil.rmtree(test_storage_dir, ignore_errors=True)

    print("=" * 70)
    passed_count = sum(1 for _, status, _ in results if status == "PASS")
    total_count = len(results)
    print(f"Cycle 7 DoD Verification Summary: {passed_count}/{total_count} PASSED")
    print("=" * 70)

    if passed_count == total_count:
        print(">> ALL CYCLE 7 DEFINITION OF DONE REQUIREMENTS SATISFIED <<")
        return 0
    else:
        print(">> SOME DOD CHECKS FAILED <<")
        return 1


if __name__ == "__main__":
    sys.exit(run_dod_verification())
