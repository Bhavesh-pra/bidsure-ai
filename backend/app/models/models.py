import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(255), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    status = db.Column(db.String(20), default="ACTIVE", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

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
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

class Tender(db.Model):
    __tablename__ = "tenders"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    organization_id = db.Column(db.String(36), db.ForeignKey("organizations.id"), nullable=False)
    tender_number = db.Column(db.String(100), unique=True, nullable=False)
    title = db.Column(db.String(500), nullable=False)
    entity = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    submission_deadline = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(50), default="DRAFT", nullable=False)
    current_version_id = db.Column(db.String(36), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    versions = db.relationship("TenderVersion", backref="tender", lazy=True)
    bids = db.relationship("Bid", backref="tender", lazy=True)

class TenderVersion(db.Model):
    __tablename__ = "tender_versions"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tender_id = db.Column(db.String(36), db.ForeignKey("tenders.id"), nullable=False)
    version_number = db.Column(db.Integer, nullable=False, default=1)
    source_document_id = db.Column(db.String(36), nullable=True)
    effective_from = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    change_summary = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

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

class Bidder(db.Model):
    __tablename__ = "bidders"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    legal_name = db.Column(db.String(255), nullable=False)
    pan = db.Column(db.String(10), nullable=True)
    gstin = db.Column(db.String(15), nullable=True)
    udyam_number = db.Column(db.String(50), nullable=True)
    organization_type = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    bids = db.relationship("Bid", backref="bidder", lazy=True)

class Bid(db.Model):
    __tablename__ = "bids"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tender_id = db.Column(db.String(36), db.ForeignKey("tenders.id"), nullable=False)
    bidder_id = db.Column(db.String(36), db.ForeignKey("bidders.id"), nullable=False)
    submission_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    quoted_amount = db.Column(db.Numeric(15, 2), nullable=False)
    proposed_completion_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(50), default="SUBMITTED", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    documents = db.relationship("Document", backref="bid", lazy=True)

class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    bid_id = db.Column(db.String(36), db.ForeignKey("bids.id"), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    storage_key = db.Column(db.String(500), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False, default="application/pdf")
    size_bytes = db.Column(db.BigInteger, nullable=False, default=0)
    sha256 = db.Column(db.String(64), nullable=False)
    page_count = db.Column(db.Integer, nullable=True)
    processing_status = db.Column(db.String(50), default="UPLOADED", nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
