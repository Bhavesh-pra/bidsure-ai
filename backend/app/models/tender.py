from datetime import datetime
from . import db

class Tender(db.Model):
    __tablename__ = "tenders"

    id = db.Column(db.String(64), primary_key=True)
    organization_id = db.Column(db.String(64), db.ForeignKey("organizations.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    estimated_value = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(50), nullable=False, default="PUBLISHED")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    organization = db.relationship("Organization", back_populates="tenders")
    versions = db.relationship("TenderVersion", back_populates="tender", cascade="all, delete-orphan")
    bids = db.relationship("Bid", back_populates="tender", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "title": self.title,
            "category": self.category,
            "estimated_value": self.estimated_value,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "versions_count": len(self.versions),
            "bids_count": len(self.bids)
        }

class TenderVersion(db.Model):
    __tablename__ = "tender_versions"

    id = db.Column(db.String(64), primary_key=True)
    tender_id = db.Column(db.String(64), db.ForeignKey("tenders.id"), nullable=False)
    version_number = db.Column(db.Integer, nullable=False, default=1)
    published_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    tender = db.relationship("Tender", back_populates="versions")
    requirements = db.relationship("Requirement", back_populates="tender_version", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "tender_id": self.tender_id,
            "version_number": self.version_number,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "requirements": [req.to_dict() for req in self.requirements]
        }
