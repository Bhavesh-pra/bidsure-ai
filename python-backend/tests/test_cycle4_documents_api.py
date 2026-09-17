import io
import os
import sys
from datetime import datetime, timezone

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.models.models import db, Organization, User, Tender
from app.security.jwt_manager import create_access_token


@pytest.fixture
def client():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        organization = Organization(id="ORG-UPLOAD", name="Upload Test Org", code="UPLOAD-01")
        user = User(id="USR-UPLOAD", organization_id=organization.id, email="upload@test", password_hash="x", name="Upload Officer")
        tender = Tender(id="TND-UPLOAD", organization_id=organization.id, tender_number="TND/UPLOAD/001", title="Upload Test", category="TECHNICAL", tender_type="OPEN", submission_deadline=datetime(2099, 1, 1, tzinfo=timezone.utc))
        db.session.add_all([organization, user, tender])
        db.session.commit()
        token = create_access_token(user.id, organization.id, user.role, user.name)
        with app.test_client() as test_client:
            yield test_client, token
        db.session.remove()
        db.drop_all()


def test_document_endpoints_require_authentication(client):
    test_client, _ = client
    response = test_client.get("/api/v1/tenders/TND-UPLOAD/documents")
    assert response.status_code == 401
    response = test_client.get("/api/v1/tenders/TND-UPLOAD/requirements")
    assert response.status_code == 401


@pytest.mark.parametrize("filename, content", [
    ("notice.txt", b"not a pdf"),
    ("renamed.pdf", b"MZ executable content"),
    ("empty.pdf", b""),
])
def test_invalid_tender_documents_are_rejected(client, filename, content):
    test_client, token = client
    response = test_client.post(
        "/api/v1/tenders/TND-UPLOAD/documents",
        headers={"Authorization": f"Bearer {token}"},
        data={"file": (io.BytesIO(content), filename)},
        content_type="multipart/form-data",
    )
    assert response.status_code == 400
    assert response.get_json()["error"]["code"] == "VALIDATION_ERROR"
