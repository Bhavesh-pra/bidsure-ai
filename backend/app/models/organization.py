from datetime import datetime
from . import db

class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    users = db.relationship("User", back_populates="organization", cascade="all, delete-orphan")
    tenders = db.relationship("Tender", back_populates="organization", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
