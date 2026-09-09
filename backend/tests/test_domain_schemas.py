import pytest
from pydantic import ValidationError
from app.domain.requirement import RequirementSchema, RequirementCategory, RequirementOperator
from app.domain.evidence import EvidenceSchema, ExtractionMethod
from app.domain.verification import VerificationSchema, VerificationStatus
from app.domain.compliance import ComplianceResultSchema, ComplianceStatus
from app.domain.risk import RiskAssessmentSchema, RiskFactorSchema, RiskLevel
from app.domain.recommendation import RecommendationSchema, RecommendationStatus

def test_requirement_schema_validation():
    valid_data = {
        "id": "REQ-001",
        "title": "GST Registration",
        "category": "STATUTORY",
        "mandatory": True,
        "operator": "EQUALS",
        "expected_value": "ACTIVE",
        "source_clause": "Clause 4.2",
        "source_page": 7
    }
    req = RequirementSchema(**valid_data)
    assert req.id == "REQ-001"
    assert req.category == RequirementCategory.STATUTORY
    assert req.operator == RequirementOperator.EQUALS

def test_evidence_schema_validation():
    valid_data = {
        "document_id": "DOC-001",
        "field": "gstin",
        "value": "27ABCDE1234F1Z5",
        "normalized_value": "27ABCDE1234F1Z5",
        "page": 1,
        "confidence": 0.98,
        "extraction_method": "OCR_LLM"
    }
    evidence = EvidenceSchema(**valid_data)
    assert evidence.confidence == 0.98
    assert evidence.extraction_method == ExtractionMethod.OCR_LLM

    # Invalid confidence (> 1.0)
    with pytest.raises(ValidationError):
        EvidenceSchema(**{**valid_data, "confidence": 1.5})

def test_verification_schema_validation():
    valid_data = {
        "requirement_id": "REQ-001",
        "verification_type": "GST_STATUS",
        "source": "GST_MOCK_ADAPTER",
        "status": "VERIFIED",
        "match_result": True
    }
    v = VerificationSchema(**valid_data)
    assert v.status == VerificationStatus.VERIFIED
    assert v.match_result is True

def test_compliance_schema_validation():
    valid_data = {
        "requirement_id": "REQ-001",
        "status": "PASS",
        "score": 15.0,
        "finding": None
    }
    c = ComplianceResultSchema(**valid_data)
    assert c.status == ComplianceStatus.PASS
    assert c.score == 15.0

    # Invalid status
    with pytest.raises(ValidationError):
        ComplianceResultSchema(requirement_id="REQ-001", status="INVALID_STATUS", score=10)

def test_risk_schema_validation():
    valid_data = {
        "risk_score": 72.0,
        "risk_level": "MEDIUM",
        "factors": [
            {
                "type": "MISSING_EVIDENCE",
                "severity": "HIGH",
                "description": "Page missing"
            }
        ]
    }
    r = RiskAssessmentSchema(**valid_data)
    assert r.risk_score == 72.0
    assert r.risk_level == RiskLevel.MEDIUM
    assert len(r.factors) == 1
    assert r.factors[0].severity == RiskLevel.HIGH

def test_recommendation_schema_validation():
    valid_data = {
        "status": "REVIEW_REQUIRED",
        "rationale": "OEM authorization requires manual review.",
        "supporting_findings": ["FIND-001"]
    }
    rec = RecommendationSchema(**valid_data)
    assert rec.status == RecommendationStatus.REVIEW_REQUIRED
    assert rec.supporting_findings == ["FIND-001"]
