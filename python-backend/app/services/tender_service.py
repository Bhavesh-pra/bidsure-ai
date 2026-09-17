import uuid
from datetime import datetime, timezone
from app.models.models import db, Tender

VALID_CATEGORIES = {
    "STATUTORY",
    "FINANCIAL",
    "TECHNICAL",
    "REGISTRATION",
    "DOCUMENT",
    "ELIGIBILITY",
    "OPERATIONAL",
    "GOODS",
    "SERVICES",
    "WORKS",
    "EQUIPMENT",
}

VALID_TENDER_TYPES = {
    "OPEN",
    "LIMITED",
    "CLOSED",
    "EOI",
    "RFP",
    "AUCTION",
    "SINGLE",
}

class TenderValidationError(Exception):
    def __init__(self, message: str, code: str = "VALIDATION_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class TenderNotFoundError(Exception):
    def __init__(self, message: str = "Tender not found", code: str = "NOT_FOUND", status_code: int = 404):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class TenderAccessDeniedError(Exception):
    def __init__(self, message: str = "Access denied to tender belonging to another organization", code: str = "FORBIDDEN", status_code: int = 403):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


def parse_deadline(deadline_val) -> datetime:
    if not deadline_val:
        raise TenderValidationError("Submission deadline is required")

    if isinstance(deadline_val, datetime):
        dt = deadline_val
    elif isinstance(deadline_val, str):
        try:
            clean_str = deadline_val.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
        except Exception:
            raise TenderValidationError("Invalid submission deadline format. Expected ISO-8601 datetime string")
    else:
        raise TenderValidationError("Invalid submission deadline type")

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    if dt <= datetime.now(timezone.utc):
        raise TenderValidationError("Submission deadline must be in the future")

    return dt


def validate_tender_payload(org_id: str, data: dict, tender_id: str = None) -> dict:
    if not isinstance(data, dict):
        raise TenderValidationError("Request payload must be a valid JSON object")

    tender_number = (data.get("tender_number") or "").strip()
    if not tender_number:
        raise TenderValidationError("Tender number is required")

    title = (data.get("title") or "").strip()
    if not title:
        raise TenderValidationError("Title is required")

    category = (data.get("category") or "").strip().upper()
    if not category:
        raise TenderValidationError("Category is required")
    if category not in VALID_CATEGORIES:
        raise TenderValidationError(
            f"Invalid category '{category}'. Allowed categories: {', '.join(sorted(VALID_CATEGORIES))}"
        )

    tender_type = (data.get("tender_type") or "OPEN").strip().upper()
    if tender_type not in VALID_TENDER_TYPES:
        raise TenderValidationError(
            f"Invalid tender type '{tender_type}'. Allowed types: {', '.join(sorted(VALID_TENDER_TYPES))}"
        )

    deadline_dt = parse_deadline(data.get("submission_deadline"))

    # Validate duplicate tender number within organization
    query = Tender.query.filter_by(organization_id=org_id, tender_number=tender_number)
    if tender_id:
        query = query.filter(Tender.id != tender_id)
    if query.first():
        raise TenderValidationError(
            f"Tender number '{tender_number}' already exists in this organization",
            code="DUPLICATE_TENDER_NUMBER",
            status_code=409,
        )

    return {
        "tender_number": tender_number,
        "title": title,
        "description": data.get("description", "").strip() or None,
        "entity": data.get("entity", "").strip() or None,
        "category": category,
        "tender_type": tender_type,
        "submission_deadline": deadline_dt,
    }


def create_tender(org_id: str, data: dict) -> dict:
    cleaned = validate_tender_payload(org_id, data)
    tender_id = data.get("id") or f"TND-{uuid.uuid4().hex[:8].upper()}"

    tender = Tender(
        id=tender_id,
        organization_id=org_id,
        tender_number=cleaned["tender_number"],
        title=cleaned["title"],
        description=cleaned["description"],
        entity=cleaned["entity"],
        category=cleaned["category"],
        tender_type=cleaned["tender_type"],
        submission_deadline=cleaned["submission_deadline"],
        status="DRAFT",
    )
    db.session.add(tender)
    db.session.commit()

    return {
        "id": tender.id,
        "tender_number": tender.tender_number,
        "title": tender.title,
        "status": tender.status,
    }


def list_tenders_for_org(org_id: str) -> list:
    tenders = (
        Tender.query.filter_by(organization_id=org_id)
        .order_by(Tender.created_at.desc())
        .all()
    )
    return [t.to_summary_dict() for t in tenders]


def get_tender_by_id_and_org(tender_id: str, org_id: str) -> dict:
    tender = Tender.query.filter_by(id=tender_id).first()
    if not tender:
        raise TenderNotFoundError(f"Tender with ID '{tender_id}' was not found")

    if tender.organization_id != org_id:
        raise TenderAccessDeniedError("Access denied: tender belongs to another organization")

    return tender.to_dict()
