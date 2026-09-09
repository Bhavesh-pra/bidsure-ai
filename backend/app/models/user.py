from datetime import datetime
from . import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(64), primary_key=True)
    organization_id = db.Column(db.String(64), db.ForeignKey("organizations.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    role = db.Column(db.String(50), nullable=False, default="OFFICER")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    organization = db.relationship("Organization", back_populates="users")

    def to_dict(self):
        return {
            "id": self.id,
            "organization_id": self.organization_id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
