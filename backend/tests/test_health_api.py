import pytest
from app import create_app
from app.models import db, Organization

@pytest.fixture
def client():
    app = create_app("test")
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert "request_id" in data

def test_database_connection(client):
    org = Organization(id="TEST-ORG-1", name="Test Org")
    db.session.add(org)
    db.session.commit()

    fetched = Organization.query.get("TEST-ORG-1")
    assert fetched is not None
    assert fetched.name == "Test Org"
