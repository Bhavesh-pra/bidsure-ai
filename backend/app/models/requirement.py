from datetime import datetime
import json
from . import db

class Requirement(db.Model):
    __tablename__ = "requirements"

    id = db.Column(db.String(64), primary_key=True)
    tender_version_id = db.Column(db.String(64), db.ForeignKey("tender_versions.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=False, default="STATUTORY")
    mandatory = db.Column(db.Boolean, nullable=False, default=True)
    applicability = db.Column(db.String(100), nullable=True, default="ALL")
    operator = db.Column(db.String(50), nullable=False, default="EQUALS")
    expected_value_raw = db.Column(db.Text, nullable=False)
    unit = db.Column(db.String(50), nullable=True)
    evaluation_period = db.Column(db.String(100), nullable=True)
    source_clause = db.Column(db.String(100), nullable=True)
    source_page = db.Column(db.Integer, nullable=True)
    confidence = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    tender_version = db.relationship("TenderVersion", back_populates="requirements")

    @property
    def expected_value(self):
        try:
            return json.loads(self.expected_value_raw)
        except Exception:
            return self.expected_value_raw

    @expected_value.setter
    def expected_value(self, val):
        self.expected_value_raw = json.dumps(val)

    def to_dict(self):
        return {
            "id": self.id,
            "tender_version_id": self.tender_version_id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "mandatory": self.mandatory,
            "applicability": self.applicability,
            "operator": self.operator,
            "expected_value": self.expected_value,
            "unit": self.unit,
            "evaluation_period": self.evaluation_period,
            "source_clause": self.source_clause,
            "source_page": self.source_page,
            "confidence": self.confidence
        }
