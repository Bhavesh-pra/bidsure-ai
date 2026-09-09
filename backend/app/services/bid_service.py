import uuid
from datetime import date, datetime, timezone
from pydantic import ValidationError
from sqlalchemy import or_
from app.domain.bid.schemas import BidderSchema, BidSchema, BidStatus
from app.models.models import db, Bidder, Bid, Tender


class BidDomainError(Exception):
    def __init__(self, message, code="VALIDATION_ERROR", status_code=400):
        super().__init__(message); self.message = message; self.code = code; self.status_code = status_code


def _error(exc):
    if isinstance(exc, ValidationError):
        return BidDomainError("; ".join(e.get("msg", "Invalid value") for e in exc.errors()))
    return exc


def bidder_dict(b):
    return {"id": b.id, "organization_id": b.organization_id, "legal_name": b.legal_name,
            "pan": b.pan, "gstin": b.gstin, "udyam_number": b.udyam_number,
            "organization_type": b.organization_type, "address": b.address,
            "created_at": b.created_at.isoformat() if b.created_at else None,
            "updated_at": b.updated_at.isoformat() if b.updated_at else None}


def bid_dict(b):
    return {"id": b.id, "bid_id": b.id, "tender_id": b.tender_id, "bidder_id": b.bidder_id,
            "submission_time": b.submission_time.isoformat() if b.submission_time else None,
            "quoted_amount": float(b.quoted_amount) if b.quoted_amount is not None else None,
            "proposed_completion_date": b.proposed_completion_date.isoformat() if b.proposed_completion_date else None,
            "status": b.status, "created_at": b.created_at.isoformat() if b.created_at else None,
            "updated_at": b.updated_at.isoformat() if b.updated_at else None,
            "bidder": bidder_dict(b.bidder) if b.bidder else None,
            "tender": {"id": b.tender.id, "tender_number": b.tender.tender_number, "title": b.tender.title} if b.tender else None}


def create_bidder(org_id, data):
    try: payload = BidderSchema(**(data or {}))
    except ValidationError as exc: raise _error(exc)
    identity_filters = [Bidder.legal_name == payload.legal_name]
    if payload.pan:
        identity_filters.append(Bidder.pan == payload.pan)
    if payload.gstin:
        identity_filters.append(Bidder.gstin == payload.gstin)
    duplicate = Bidder.query.filter_by(organization_id=org_id).filter(or_(*identity_filters)).first()
    if duplicate: raise BidDomainError("A bidder with the same identity already exists", "DUPLICATE_BIDDER", 409)
    bidder = Bidder(id=payload.id or f"BIDDER-{uuid.uuid4().hex[:8].upper()}", organization_id=org_id,
                    legal_name=payload.legal_name, pan=payload.pan, gstin=payload.gstin,
                    udyam_number=payload.udyam_number, organization_type=payload.organization_type, address=payload.address)
    db.session.add(bidder); db.session.commit(); return bidder_dict(bidder)


def get_bidder(bidder_id, org_id):
    bidder = Bidder.query.filter_by(id=bidder_id).first()
    if not bidder: raise BidDomainError("Bidder not found", "NOT_FOUND", 404)
    if bidder.organization_id != org_id: raise BidDomainError("Access denied to bidder", "FORBIDDEN", 403)
    return bidder_dict(bidder)


def create_bid(tender_id, org_id, data):
    tender = Tender.query.filter_by(id=tender_id).first()
    if not tender: raise BidDomainError("Tender not found", "NOT_FOUND", 404)
    if tender.organization_id != org_id: raise BidDomainError("Access denied to tender", "FORBIDDEN", 403)
    try: payload = BidSchema(tender_id=tender_id, **(data or {}))
    except ValidationError as exc: raise _error(exc)
    bidder = Bidder.query.filter_by(id=payload.bidder_id).first()
    if not bidder: raise BidDomainError("Bidder not found", "NOT_FOUND", 404)
    if bidder.organization_id != org_id: raise BidDomainError("Access denied to bidder", "FORBIDDEN", 403)
    if Bid.query.filter_by(tender_id=tender_id, bidder_id=bidder.id).first():
        raise BidDomainError("This bidder already has a bid for the tender", "DUPLICATE_BID", 409)
    bid = Bid(id=payload.id or f"{bidder.id}-BID-{uuid.uuid4().hex[:6].upper()}", tender_id=tender_id,
              bidder_id=bidder.id, submission_time=payload.submission_time or datetime.now(timezone.utc),
              quoted_amount=payload.quoted_amount, proposed_completion_date=payload.proposed_completion_date,
              status=payload.status or BidStatus.DRAFT)
    db.session.add(bid); db.session.commit(); return bid_dict(bid)


def list_bids(tender_id, org_id):
    tender = Tender.query.filter_by(id=tender_id).first()
    if not tender: raise BidDomainError("Tender not found", "NOT_FOUND", 404)
    if tender.organization_id != org_id: raise BidDomainError("Access denied to tender", "FORBIDDEN", 403)
    return [bid_dict(b) for b in Bid.query.filter_by(tender_id=tender_id).order_by(Bid.created_at.desc()).all()]


def get_bid(bid_id, org_id):
    bid = Bid.query.filter_by(id=bid_id).first()
    if not bid: raise BidDomainError("Bid not found", "NOT_FOUND", 404)
    if not bid.tender or bid.tender.organization_id != org_id: raise BidDomainError("Access denied to bid", "FORBIDDEN", 403)
    return bid_dict(bid)
