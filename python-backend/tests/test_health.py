import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from app import create_app

@pytest.fixture
def client():
    app = create_app("testing")
    with app.test_client() as client:
        yield client

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert "request_id" in data

def test_get_tenders_unauthenticated(client):
    response = client.get("/api/v1/tenders")
    assert response.status_code == 401
    data = response.get_json()
    assert data["success"] is False
    assert data["error"]["code"] == "UNAUTHORIZED"

def test_get_tenders_authenticated(client):
    from app.security.jwt_manager import create_access_token
    with client.application.app_context():
        token = create_access_token("test-user", "ORG-001", "PROCUREMENT_OFFICER")
    response = client.get("/api/v1/tenders", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert isinstance(data["data"], list)

