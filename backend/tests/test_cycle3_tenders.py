"""Cycle 3 API contract tests for tender creation and tenant security.

These tests intentionally exercise the public contract from the Cycle 3 brief.
They should remain red until the authentication, persistence, and authorization
implementation is integrated by the backend owner.
"""
import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app


VALID_TENDER = {
    "tender_number": "GEM/2026/B/1234567",
    "title": "Supply of Industrial Equipment",
    "description": "Supply and installation of industrial equipment",
    "category": "TECHNICAL",
    "tender_type": "OPEN",
    "submission_deadline": "2026-10-15T17:00:00Z",
}


from app.security.jwt_manager import create_access_token


@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as test_client:
        yield test_client


@pytest.fixture
def auth_headers(client):
    with client.application.app_context():
        token = create_access_token("USR-TEST-1", "ORG-A", "PROCUREMENT_OFFICER")
        return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def org_b_headers(client):
    with client.application.app_context():
        token = create_access_token("USR-TEST-2", "ORG-B", "PROCUREMENT_OFFICER")
        return {"Authorization": f"Bearer {token}"}


def assert_error(response, status_code, code=None):
    assert response.status_code == status_code
    body = response.get_json()
    assert body["success"] is False
    assert body["request_id"]
    assert body["error"]["message"]
    if code:
        assert body["error"]["code"] == code


def test_create_tender_requires_authentication(client):
    response = client.post("/api/v1/tenders", json=VALID_TENDER)
    assert_error(response, 401)


def test_list_tenders_requires_authentication(client):
    response = client.get("/api/v1/tenders")
    assert_error(response, 401)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("tender_number", ""),
        ("title", ""),
        ("category", "NOT_A_CATEGORY"),
        ("tender_type", "NOT_A_TYPE"),
        ("submission_deadline", "not-a-date"),
    ],
)
def test_invalid_tender_metadata_returns_validation_error(client, auth_headers, field, value):
    payload = {**VALID_TENDER, field: value}
    response = client.post(
        "/api/v1/tenders", json=payload, headers=auth_headers
    )
    assert response.status_code in (400, 422)
    body = response.get_json()
    assert body["success"] is False
    assert body["error"]["code"] in ("VALIDATION_ERROR", "INVALID_REQUEST")


def test_duplicate_tender_number_is_rejected(client, auth_headers):
    first = client.post("/api/v1/tenders", json=VALID_TENDER, headers=auth_headers)
    assert first.status_code == 201

    duplicate = client.post("/api/v1/tenders", json=VALID_TENDER, headers=auth_headers)
    assert_error(duplicate, 409, "DUPLICATE_TENDER_NUMBER")


def test_created_tender_is_returned_by_list_and_details(client, auth_headers):
    created = client.post("/api/v1/tenders", json=VALID_TENDER, headers=auth_headers)
    assert created.status_code == 201
    created_data = created.get_json()["data"]
    assert created_data["tender_number"] == VALID_TENDER["tender_number"]
    assert created_data["status"] == "DRAFT"

    listed = client.get("/api/v1/tenders", headers=auth_headers)
    assert listed.status_code == 200
    assert any(item["id"] == created_data["id"] for item in listed.get_json()["data"])

    details = client.get(f"/api/v1/tenders/{created_data['id']}", headers=auth_headers)
    assert details.status_code == 200
    assert details.get_json()["data"]["title"] == VALID_TENDER["title"]


def test_tender_isolation_between_organizations(client, auth_headers, org_b_headers):
    created = client.post("/api/v1/tenders", json=VALID_TENDER, headers=auth_headers)
    assert created.status_code == 201
    tender_id = created.get_json()["data"]["id"]

    response = client.get(f"/api/v1/tenders/{tender_id}", headers=org_b_headers)
    assert_error(response, 403)


@pytest.mark.parametrize("authorization", [None, "Bearer expired-token", "Bearer invalid-token"])
def test_missing_expired_or_invalid_jwt_is_rejected(client, authorization):
    headers = {} if authorization is None else {"Authorization": authorization}
    response = client.get("/api/v1/tenders", headers=headers)
    assert_error(response, 401)

