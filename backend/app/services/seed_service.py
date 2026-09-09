import json
import logging
import os
from datetime import datetime, timezone
import bcrypt

from app.models.models import (
    db,
    Organization,
    User,
    Tender,
    TenderVersion,
    Requirement,
    Bidder,
    Bid,
)

logger = logging.getLogger(__name__)


def get_mock_data_path(filename: str) -> str:
    """Resolve absolute path to a mock-data file."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    candidate = os.path.join(project_root, "mock-data", filename)
    if os.path.exists(candidate):
        return candidate
    candidate2 = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "mock-data", filename))
    if os.path.exists(candidate2):
        return candidate2
    return candidate


def seed_demo_data() -> dict:
    """
    Idempotently seeds baseline demo data from mock-data into the active database.
    Ensures:
      - Default Organization (ORG-001)
      - Demo Procurement Officer (officer@bidsure.gov.in / officer123)
      - Demo Tender (TND-001) with version and requirements
      - Demo Bidders (BIDDER-001 ABC Technologies & BIDDER-002 QuickNet / XYZ Enterprises)
      - Demo Bids for TND-001
    """
    stats = {"orgs": 0, "users": 0, "tenders": 0, "requirements": 0, "bidders": 0, "bids": 0}

    # 1. Organization
    org = Organization.query.filter_by(id="ORG-001").first()
    if not org:
        org_file = get_mock_data_path("organizations.json")
        org_name = "Demo Procurement Department"
        org_code = "DPD-001"
        if os.path.exists(org_file):
            try:
                with open(org_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if data:
                        org_name = data[0].get("name", org_name)
                        org_code = data[0].get("code", org_code)
            except Exception as e:
                logger.warning("Could not read organizations.json: %s", e)

        org = Organization(
            id="ORG-001",
            name=org_name,
            code=org_code,
            status="ACTIVE",
        )
        db.session.add(org)
        db.session.flush()
        stats["orgs"] += 1

    # 2. Demo Officer User
    officer = User.query.filter_by(email="officer@bidsure.gov.in").first()
    if not officer:
        salt = bcrypt.gensalt()
        pw_hash = bcrypt.hashpw(b"officer123", salt).decode("utf-8")
        officer = User(
            id="USR-OFFICER-001",
            organization_id=org.id,
            email="officer@bidsure.gov.in",
            password_hash=pw_hash,
            name="Procurement Officer",
            role="PROCUREMENT_OFFICER",
            status="ACTIVE",
        )
        db.session.add(officer)
        stats["users"] += 1

    # 3. Tender & Requirements
    tender = Tender.query.filter_by(id="TND-001").first()
    if not tender:
        tenders_file = get_mock_data_path("tenders.json")
        t_data = {
            "tender_number": "GEM/2026/B/1001",
            "title": "Supply, Installation, and Commissioning of Enterprise High-Performance Server Infrastructure",
            "entity": "Ministry of Electronics and Information Technology (MeitY)",
            "category": "EQUIPMENT",
            "tender_type": "OPEN",
            "submission_deadline": "2026-12-31T17:00:00Z",
        }
        if os.path.exists(tenders_file):
            try:
                with open(tenders_file, "r", encoding="utf-8") as f:
                    raw_tenders = json.load(f)
                    if raw_tenders:
                        t_data.update(raw_tenders[0])
            except Exception as e:
                logger.warning("Could not read tenders.json: %s", e)

        deadline_str = t_data.get("submission_deadline", "2026-12-31T17:00:00Z").replace("Z", "+00:00")
        try:
            deadline = datetime.fromisoformat(deadline_str)
        except Exception:
            deadline = datetime(2026, 12, 31, 17, 0, tzinfo=timezone.utc)

        tender = Tender(
            id="TND-001",
            organization_id=org.id,
            tender_number=t_data.get("tender_number", "GEM/2026/B/1001"),
            title=t_data.get("title", "IT Infrastructure Supply Tender"),
            description=t_data.get("description", "Procurement of server and networking infrastructure"),
            entity=t_data.get("entity", "MeitY"),
            category=t_data.get("category", "EQUIPMENT"),
            tender_type=t_data.get("tender_type", "OPEN"),
            submission_deadline=deadline,
            status="ACTIVE",
        )
        db.session.add(tender)
        db.session.flush()
        stats["tenders"] += 1

        # Create TenderVersion
        tv = TenderVersion(
            id="TV-001-V1",
            tender_id=tender.id,
            version_number=1,
            effective_from=datetime.now(timezone.utc),
            change_summary="Initial RFP publication",
        )
        db.session.add(tv)
        db.session.flush()
        tender.current_version_id = tv.id

        # Load requirements
        req_file = get_mock_data_path("requirements.json")
        if os.path.exists(req_file):
            try:
                with open(req_file, "r", encoding="utf-8") as f:
                    req_list = json.load(f)
                    for r in req_list:
                        req = Requirement(
                            id=r.get("id"),
                            tender_version_id=tv.id,
                            category=r.get("category", "STATUTORY"),
                            title=r.get("title", "Requirement"),
                            description=r.get("description"),
                            mandatory=r.get("mandatory", True),
                            applicability=r.get("applicability", "ALL_BIDDERS"),
                            operator=r.get("operator", "EQUALS"),
                            expected_value=str(r.get("expected_value", "")),
                            unit=r.get("unit"),
                            source_clause=r.get("source_clause"),
                            source_page=r.get("source_page"),
                            confidence=r.get("confidence", 1.0),
                        )
                        db.session.add(req)
                        stats["requirements"] += 1
            except Exception as e:
                logger.warning("Could not read requirements.json: %s", e)

    # 4. Bidders (Bidder A and Bidder B)
    bidders_file = get_mock_data_path("bidders.json")
    if os.path.exists(bidders_file):
        try:
            with open(bidders_file, "r", encoding="utf-8") as f:
                b_list = json.load(f)
                for b_info in b_list:
                    b_id = b_info.get("id")
                    existing_bidder = Bidder.query.filter_by(id=b_id).first()
                    if not existing_bidder:
                        bidder = Bidder(
                            id=b_id,
                            organization_id=org.id,
                            legal_name=b_info.get("legal_name") or b_info.get("name"),
                            pan=b_info.get("pan"),
                            gstin=b_info.get("gstin"),
                            udyam_number=b_info.get("udyam_number"),
                            organization_type=b_info.get("organization_type", "PRIVATE_LIMITED"),
                            address=b_info.get("address", "New Delhi, India"),
                        )
                        db.session.add(bidder)
                        stats["bidders"] += 1
        except Exception as e:
            logger.warning("Could not read bidders.json: %s", e)

    db.session.flush()

    # 5. Bids
    bids_file = get_mock_data_path("bids.json")
    if os.path.exists(bids_file):
        try:
            with open(bids_file, "r", encoding="utf-8") as f:
                bids_data = json.load(f)
                for bid_item in bids_data:
                    bid_id = bid_item.get("id")
                    if not Bid.query.filter_by(id=bid_id).first():
                        t_id = bid_item.get("tender_id", "TND-001")
                        b_id = bid_item.get("bidder_id")
                        if Tender.query.filter_by(id=t_id).first() and Bidder.query.filter_by(id=b_id).first():
                            comp_date = None
                            if bid_item.get("proposed_completion_date"):
                                try:
                                    comp_date = datetime.fromisoformat(bid_item["proposed_completion_date"]).date()
                                except Exception:
                                    pass
                            bid_row = Bid(
                                id=bid_id,
                                tender_id=t_id,
                                bidder_id=b_id,
                                quoted_amount=bid_item.get("quoted_amount", 5000000),
                                proposed_completion_date=comp_date,
                                status=bid_item.get("status", "SUBMITTED"),
                            )
                            db.session.add(bid_row)
                            stats["bids"] += 1
        except Exception as e:
            logger.warning("Could not read bids.json: %s", e)

    db.session.commit()
    logger.info("Demo data seed completed: %s", stats)
    return stats
