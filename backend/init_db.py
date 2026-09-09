import json
from app import create_app
from app.models import db, Organization, User, Tender, TenderVersion, Requirement, Bidder, Bid, Document

def init_database():
    app = create_app("dev")
    with app.app_context():
        db.create_all()

        # Seed sample organization if empty
        if not Organization.query.get("ORG-001"):
            org = Organization(id="ORG-001", name="Demo Procurement Organization")
            db.session.add(org)

            user = User(
                id="USR-001",
                organization_id="ORG-001",
                name="Primary Officer",
                email="officer@bidsure.ai",
                role="PROCUREMENT_OFFICER"
            )
            db.session.add(user)

            tender = Tender(
                id="TND-2026-001",
                organization_id="ORG-001",
                title="Supply and Installation of Server Infrastructure",
                category="IT_INFRASTRUCTURE",
                estimated_value=50000000.0,
                status="PUBLISHED"
            )
            db.session.add(tender)

            version = TenderVersion(
                id="TV-001-v1",
                tender_id="TND-2026-001",
                version_number=1
            )
            db.session.add(version)

            req1 = Requirement(
                id="REQ-001",
                tender_version_id="TV-001-v1",
                title="GST Registration",
                category="STATUTORY",
                mandatory=True,
                operator="EQUALS",
                expected_value_raw=json.dumps("ACTIVE"),
                source_clause="Clause 4.2",
                source_page=7
            )
            req2 = Requirement(
                id="REQ-002",
                tender_version_id="TV-001-v1",
                title="Minimum Turnover",
                category="FINANCIAL",
                mandatory=True,
                operator="GREATER_THAN_EQUAL",
                expected_value_raw=json.dumps(50000000),
                unit="INR",
                source_clause="Clause 5.1",
                source_page=10
            )
            db.session.add_all([req1, req2])

            bidder1 = Bidder(
                id="BDR-001",
                name="ABC Technologies Pvt Ltd",
                cin="U72200MH2015PTC123456",
                gstin="27ABCDE1234F1Z5",
                pan="ABCDE1234F"
            )
            db.session.add(bidder1)

            bid1 = Bid(
                id="BID-001",
                tender_id="TND-2026-001",
                bidder_id="BDR-001",
                status="SUBMITTED"
            )
            db.session.add(bid1)

            doc1 = Document(
                id="DOC-001",
                bid_id="BID-001",
                filename="GST_Registration.pdf",
                category="GST_CERTIFICATE",
                file_path="bids/BID-001/GST_Registration.pdf",
                file_size_bytes=245120
            )
            db.session.add(doc1)

            db.session.commit()
            print("Database initialized and sample data seeded successfully!")
        else:
            print("Database already initialized.")

if __name__ == "__main__":
    init_database()
