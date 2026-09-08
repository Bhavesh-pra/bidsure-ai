import uuid
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

def get_utc_now():
    return datetime.now(timezone.utc)

class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(20), default="ACTIVE", nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)

    users = db.relationship("User", backref="organization", lazy=True)
    tenders = db.relationship("Tender", backref="organization", lazy=True)

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="PROCUREMENT_OFFICER")
    status = db.Column(db.String(20), default="ACTIVE", nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)

class Tender(db.Model):
    __tablename__ = "tenders"
    __table_args__ = (
        db.UniqueConstraint("organization_id", "tender_number", name="uq_org_tender_number"),
    )

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False, index=True)
    tender_number = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text, nullable=True)
    entity = db.Column(db.String(255), nullable=True)
    category = db.Column(db.String(100), nullable=False)
    tender_type = db.Column(db.String(50), default="OPEN", nullable=False)
    submission_deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default="DRAFT", nullable=False)
    current_version_id = db.Column(db.String(36), nullable=True)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    versions = db.relationship("TenderVersion", backref="tender", lazy=True)
    bids = db.relationship("Bid", backref="tender", lazy=True)
    documents = db.relationship("Document", backref="tender", lazy=True)

    def to_summary_dict(self):
        return {
            "id": self.id,
            "tender_number": self.tender_number,
            "title": self.title,
            "category": self.category,
            "status": self.status,
        }

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "tender_number": self.tender_number,
            "title": self.title,
            "description": self.description,
            "entity": self.entity,
            "category": self.category,
            "tender_type": self.tender_type,
            "submission_deadline": self.submission_deadline.isoformat() if self.submission_deadline else None,
            "status": self.status,
            "current_version_id": self.current_version_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class TenderVersion(db.Model):
    __tablename__ = "tender_versions"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tender_id = db.Column(db.String(36), db.ForeignKey("tenders.id"), nullable=False)
    version_number = db.Column(db.Integer, nullable=False, default=1)
    source_document_id = db.Column(db.String(36), nullable=True)
    effective_from = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    change_summary = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)

    requirements = db.relationship("Requirement", backref="tender_version", lazy=True)

class Requirement(db.Model):
    __tablename__ = "requirements"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tender_version_id = db.Column(db.String(36), db.ForeignKey("tender_versions.id"), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    mandatory = db.Column(db.Boolean, default=True, nullable=False)
    applicability = db.Column(db.String(50), default="ALL_BIDDERS", nullable=False)
    operator = db.Column(db.String(20), nullable=True)
    expected_value = db.Column(db.String(255), nullable=True)
    unit = db.Column(db.String(50), nullable=True)
    source_clause = db.Column(db.String(100), nullable=True)
    source_page = db.Column(db.Integer, nullable=True)
    confidence = db.Column(db.Float, nullable=True)
    rules = db.relationship("ComplianceRule", backref="requirement", lazy=True, cascade="all, delete-orphan")

class ComplianceRule(db.Model):
    __tablename__ = "compliance_rules"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    requirement_id = db.Column(db.String(36), db.ForeignKey("requirements.id"), nullable=False, index=True)
    rule_type = db.Column(db.String(50), nullable=False)
    operator = db.Column(db.String(30), nullable=True)
    expected_value = db.Column(db.Text, nullable=True)
    parameters = db.Column(db.JSON, nullable=False, default=dict)
    priority = db.Column(db.Integer, nullable=False, default=100)
    enabled = db.Column(db.Boolean, nullable=False, default=True)
    version = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "requirement_id": self.requirement_id,
            "rule_type": self.rule_type,
            "operator": self.operator,
            "expected_value": self.expected_value,
            "parameters": self.parameters or {},
            "priority": self.priority,
            "enabled": self.enabled,
            "version": self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Bidder(db.Model):
    __tablename__ = "bidders"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    legal_name = db.Column(db.String(255), nullable=False)
    pan = db.Column(db.String(10), nullable=True)
    gstin = db.Column(db.String(15), nullable=True)
    udyam_number = db.Column(db.String(50), nullable=True)
    organization_type = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)

    bids = db.relationship("Bid", backref="bidder", lazy=True)

class Bid(db.Model):
    __tablename__ = "bids"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tender_id = db.Column(db.String(36), db.ForeignKey("tenders.id"), nullable=False)
    bidder_id = db.Column(db.String(36), db.ForeignKey("bidders.id"), nullable=False)
    submission_time = db.Column(db.DateTime, default=get_utc_now, nullable=False)
    quoted_amount = db.Column(db.Numeric(15, 2), nullable=False)
    proposed_completion_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), default="SUBMITTED", nullable=False)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)

    documents = db.relationship("Document", backref="bid", lazy=True)

class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tender_id = db.Column(db.String(36), db.ForeignKey("tenders.id"), nullable=True, index=True)
    bid_id = db.Column(db.String(36), db.ForeignKey("bids.id"), nullable=True)
    document_type = db.Column(db.String(50), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    storage_key = db.Column(db.String(500), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False, default="application/pdf")
    size_bytes = db.Column(db.BigInteger, nullable=False, default=0)
    sha256 = db.Column(db.String(64), nullable=False)
    page_count = db.Column(db.Integer, nullable=True)
    processing_status = db.Column(db.String(50), default="UPLOADED", nullable=False)
    uploaded_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=get_utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.id,
            "tender_id": self.tender_id,
            "filename": self.original_filename,
            "original_filename": self.original_filename,
            "mime_type": self.mime_type,
            "size_bytes": self.size_bytes,
            "sha256": self.sha256,
            "storage_key": self.storage_key,
            "page_count": self.page_count,
            "processing_status": self.processing_status,
            "uploaded_by": self.uploaded_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
