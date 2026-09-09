from datetime import datetime
from . import db

class Bid(db.Model):
    __tablename__ = "bids"

    id = db.Column(db.String(64), primary_key=True)
    tender_id = db.Column(db.String(64), db.ForeignKey("tenders.id"), nullable=False)
    bidder_id = db.Column(db.String(64), db.ForeignKey("bidders.id"), nullable=False)
    status = db.Column(db.String(50), nullable=False, default="SUBMITTED")
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    tender = db.relationship("Tender", back_populates="bids")
    bidder = db.relationship("Bidder", back_populates="bids")
    documents = db.relationship("Document", back_populates="bid", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "tender_id": self.tender_id,
            "bidder_id": self.bidder_id,
            "bidder_name": self.bidder.name if self.bidder else None,
            "status": self.status,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "documents_count": len(self.documents)
        }
