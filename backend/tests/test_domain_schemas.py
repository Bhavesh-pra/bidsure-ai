import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.domain.tender.schemas import RequirementSchema, RequirementCategory, ComparisonOperator
from app.domain.evidence.schemas import EvidenceSchema, ExtractionMethod
from app.domain.verification.schemas import VerificationSchema, VerificationStatus, VerificationType
from app.domain.compliance.schemas import RuleInput, RuleOutput
from app.domain.risk.schemas import FindingSchema, FindingSeverity
from app.domain.recommendation.schemas import RecommendationSchema

def test_requirement_schema():
    req = RequirementSchema(
        id="REQ-001",
        title="GST Registration",
        category=RequirementCategory.STATUTORY,
        mandatory=True,
        operator=ComparisonOperator.EQUALS,
        expected_value="ACTIVE"
    )
    assert req.id == "REQ-001"
    assert req.category == "STATUTORY"
    assert req.operator == "=="

def test_evidence_schema():
    evd = EvidenceSchema(
        id="EVD-001",
        document_id="DOC-001",
        field="gstin",
        value="27ABCDE1234F1Z5",
        confidence=0.98
    )
    assert evd.id == "EVD-001"
    assert evd.value == "27ABCDE1234F1Z5"
    assert evd.extraction_method == "OCR_LLM"

def test_rule_output_schema():
    out = RuleOutput(
        requirement_id="REQ-001",
        status=VerificationStatus.VERIFIED_PASS,
        score=1.0,
        reason="GST registration is active in GSTN records"
    )
    assert out.status == "VERIFIED_PASS"
    assert out.score == 1.0
