import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.models.models import (
    db,
    Organization,
    Tender,
    TenderVersion,
    Requirement,
    Bidder,
    Bid,
    Document,
)
from app.domain.requirement.schemas import RequirementSchema

MOCK_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../mock-data"))

def test_full_cycle2_integration():
    """
    Validates the full Cycle 2 end-to-end integration:
    1. Flask app initializes with clean context.
    2. Health endpoint responds with standard envelope.
    3. Synthetic datasets load and validate cleanly against Pydantic domain models.
    4. Database models persist Organizations, Tenders, Requirements, Bidders, Bids, and Documents.
    5. Relational traversals work seamlessly.
    """
    app = create_app("testing")
    client = app.test_client()

    # 1. Health Endpoint Check
    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200
    health_json = health_res.get_json()
    assert health_json["success"] is True
    assert health_json["data"]["status"] == "healthy"
    assert "request_id" in health_json

    # 2. Database & Data Integration
    with app.app_context():
        db.create_all()

        # Load Organization
        with open(os.path.join(MOCK_DATA_DIR, "organizations.json"), "r", encoding="utf-8") as f:
            org_data = json.load(f)[0]
        org = Organization(
            id=org_data["id"],
            name=org_data["name"],
            code=org_data["code"],
            status=org_data["status"],
        )
        db.session.add(org)

        # Load Tender
        with open(os.path.join(MOCK_DATA_DIR, "tenders.json"), "r", encoding="utf-8") as f:
            tnd_data = json.load(f)[0]
        tender = Tender(
            id=tnd_data["id"],
            organization_id=org.id,
            tender_number=tnd_data["tender_number"],
            title=tnd_data["title"],
            entity=tnd_data["entity"],
            category=tnd_data["category"],
            submission_deadline=datetime.now(timezone.utc),
            status=tnd_data["status"],
        )
        db.session.add(tender)

        # Version
        version = TenderVersion(
            id="TV-001",
            tender_id=tender.id,
            version_number=1,
            change_summary="Initial publication",
        )
        db.session.add(version)

        # Requirements
        with open(os.path.join(MOCK_DATA_DIR, "requirements.json"), "r", encoding="utf-8") as f:
            reqs_data = json.load(f)
        for r in reqs_data:
            # Validate against Pydantic schema
            validated_schema = RequirementSchema(**r)
            # Persist to database
            req_model = Requirement(
                id=validated_schema.id,
                tender_version_id=version.id,
                category=validated_schema.category,
                title=validated_schema.title,
                description=validated_schema.description,
                mandatory=validated_schema.mandatory,
                applicability=validated_schema.applicability,
                operator=str(validated_schema.operator) if validated_schema.operator else None,
                expected_value=str(validated_schema.expected_value) if validated_schema.expected_value is not None else None,
                unit=validated_schema.unit,
                source_clause=validated_schema.source_clause,
                source_page=validated_schema.source_page,
                confidence=validated_schema.confidence,
            )
            db.session.add(req_model)

        # Bidders
        with open(os.path.join(MOCK_DATA_DIR, "bidders.json"), "r", encoding="utf-8") as f:
            bidders_data = json.load(f)
        for b in bidders_data:
            bidder = Bidder(
                id=b["id"],
                legal_name=b["legal_name"],
                pan=b.get("pan"),
                gstin=b.get("gstin"),
                udyam_number=b.get("udyam_number"),
                organization_type=b.get("organization_type"),
            )
            db.session.add(bidder)

            bid = Bid(
                id=f"BID-{b['id']}",
                tender_id=tender.id,
                bidder_id=bidder.id,
                quoted_amount=b["quoted_amount"],
                status="SUBMITTED",
            )
            db.session.add(bid)

            for doc in b.get("documents", []):
                doc_record = Document(
                    id=doc["id"],
                    bid_id=bid.id,
                    document_type=doc["document_type"],
                    original_filename=doc["filename"],
                    storage_key=f"storage/bids/{doc['filename']}",
                    sha256="b" * 64,
                    processing_status="VERIFIED" if doc.get("verified") else "FAILED",
                )
                db.session.add(doc_record)

        db.session.commit()

        # Query & Relationship assertions
        queried_tender = Tender.query.filter_by(tender_number="GEM/2026/B/1001").first()
        assert queried_tender is not None
        assert len(queried_tender.versions) == 1
        assert len(queried_tender.versions[0].requirements) == 9
        assert len(queried_tender.bids) == 2

        # Check Bidder A and Bidder B
        bids = {b.bidder.id: b for b in queried_tender.bids}
        assert "BIDDER-001" in bids
        assert "BIDDER-002" in bids
        assert len(bids["BIDDER-001"].documents) == 6
        assert len(bids["BIDDER-002"].documents) == 4
