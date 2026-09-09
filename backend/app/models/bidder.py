from datetime import datetime
from . import db

class Bidder(db.Model):
    __tablename__ = "bidders"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    cin = db.Column(db.String(50), nullable=True)
    gstin = db.Column(db.String(50), nullable=True)
    pan = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    bids = db.relationship("Bid", back_populates="bidder", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "cin": self.cin,
            "gstin": self.gstin,
            "pan": self.pan,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
