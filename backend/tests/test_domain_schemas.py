import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from pydantic import ValidationError

from app.domain.requirement.schemas import (
    RequirementSchema,
    RequirementCategory,
    RequirementMandatoryLevel,
    RequirementReviewStatus,
    ComparisonOperator,
)
from app.domain.document.schemas import (
    DocumentSchema,
    DocumentType,
    DocumentProcessingStatus,
)
from app.domain.evidence.schemas import (
    EvidenceSchema,
    ExtractionMethod,
)
from app.domain.verification.schemas import (
    VerificationSchema,
    VerificationStatus,
    VerificationType,
)
from app.domain.compliance.schemas import (
    ComplianceResult,
    ComplianceStatus,
    RuleInput,
    RuleOutput,
)
from app.domain.risk.schemas import (
    RiskAssessmentSchema,
    RiskFactor,
    FindingSeverity,
)
from app.domain.recommendation.schemas import (
    RecommendationSchema,
    RecommendationStatus,
)
from app.domain.tender.schemas import (
    TenderSchema,
    TenderStatus,
    TenderType,
)
from app.domain.tender.contracts import (
    ExtractionInput,
    ExtractedClause,
    ExtractedRequirement,
    ExtractionResult,
)

# 1. Requirement Schema Tests
def test_requirement_schema_valid():
    req = RequirementSchema(
        id="REQ-001",
        title="GST Registration",
        description="Must have active GST registration in Maharashtra",
        category=RequirementCategory.STATUTORY,
        mandatory=True,
        applicability="ALL_BIDDERS",
        operator=ComparisonOperator.EQUALS,
        expected_value="ACTIVE",
        unit="STATUS",
        evaluation_period="CURRENT",
        source_clause="Clause 4.2",
        source_page=7,
        confidence=0.99,
    )
    assert req.id == "REQ-001"
    assert req.category == "STATUTORY"
    assert req.mandatory is True
    assert req.operator == "EQUALS"
    assert req.source_clause == "Clause 4.2"
    assert req.source_page == 7

def test_requirement_schema_invalid():
    with pytest.raises(ValidationError):
        # Missing required id, title, category
        RequirementSchema(mandatory=True)

# 2. Evidence Schema Tests
def test_evidence_schema_valid():
    evd = EvidenceSchema(
        id="EVD-001",
        document_id="DOC-001",
        requirement_id="REQ-001",
        field="gstin",
        value="27ABCDE1234F1Z5",
        normalized_value="27ABCDE1234F1Z5",
        page=1,
        confidence=0.98,
        extraction_method=ExtractionMethod.OCR_LLM,
    )
    assert evd.id == "EVD-001"
    assert evd.document_id == "DOC-001"
    assert evd.field == "gstin"
    assert evd.value == "27ABCDE1234F1Z5"
    assert evd.confidence == 0.98
    assert evd.extraction_method == "OCR_LLM"

def test_evidence_confidence_out_of_bounds():
    with pytest.raises(ValidationError):
        EvidenceSchema(
            document_id="DOC-001",
            field="gstin",
            value="27ABCDE1234F1Z5",
            confidence=1.5,  # Exceeds max 1.0
        )

# 3. Verification Schema Tests
def test_verification_schema_all_statuses():
    allowed_statuses = [
        VerificationStatus.VERIFIED,
        VerificationStatus.VERIFIED_FAIL,
        VerificationStatus.REVIEW_REQUIRED,
        VerificationStatus.UNABLE_TO_VERIFY,
        VerificationStatus.CONFLICTING_EVIDENCE,
    ]
    for status in allowed_statuses:
        ver = VerificationSchema(
            requirement_id="REQ-001",
            verification_type=VerificationType.GST_STATUS,
            source="GST_MOCK_ADAPTER",
            status=status,
            match_result=True,
        )
        assert ver.status == status.value
        assert ver.requirement_id == "REQ-001"
        assert ver.source == "GST_MOCK_ADAPTER"

# 4. Compliance Schema Tests
def test_compliance_result_statuses():
    allowed_statuses = [
        ComplianceStatus.PASS,
        ComplianceStatus.FAIL,
        ComplianceStatus.REVIEW_REQUIRED,
        ComplianceStatus.NOT_APPLICABLE,
        ComplianceStatus.EVIDENCE_MISSING,
        ComplianceStatus.UNABLE_TO_VERIFY,
    ]
    for status in allowed_statuses:
        comp = ComplianceResult(
            requirement_id="REQ-001",
            status=status,
            score=15,
            finding=None,
        )
        assert comp.requirement_id == "REQ-001"
        assert comp.status == status.value
        assert comp.score == 15

# 5. Risk Schema Tests
def test_risk_assessment_schema():
    factor = RiskFactor(
        type="MISSING_EVIDENCE",
        severity=FindingSeverity.HIGH,
        description="OEM authorization certificate is missing",
    )
    risk = RiskAssessmentSchema(
        risk_score=72.0,
        risk_level=FindingSeverity.MEDIUM,
        factors=[factor],
        explanation="Medium risk due to missing critical authorization evidence",
    )
    assert risk.risk_score == 72.0
    assert risk.risk_level == "MEDIUM"
    assert len(risk.factors) == 1
    assert risk.factors[0].type == "MISSING_EVIDENCE"
    assert risk.factors[0].severity == "HIGH"

def test_risk_score_validation():
    with pytest.raises(ValidationError):
        # risk_score must be <= 100.0
        RiskAssessmentSchema(
            risk_score=150.0,
            risk_level=FindingSeverity.CRITICAL,
        )

# 6. Recommendation Schema Tests
def test_recommendation_schema():
    rec = RecommendationSchema(
        status=RecommendationStatus.REVIEW_REQUIRED,
        rationale="OEM authorization requires manual review.",
        supporting_findings=["FIND-001"],
    )
    assert rec.status == "REVIEW_REQUIRED"
    assert rec.rationale == "OEM authorization requires manual review."
    assert rec.supporting_findings == ["FIND-001"]
    assert "Procurement Officer" in rec.officer_authority_disclaimer

# 7. Document & Tender Schema Tests
def test_document_schema():
    doc = DocumentSchema(
        id="DOC-001",
        document_type=DocumentType.GST_CERTIFICATE,
        original_filename="gst_cert.pdf",
        storage_key="tenders/TND-001/bids/BID-001/gst_cert.pdf",
        mime_type="application/pdf",
        size_bytes=102400,
        sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        processing_status=DocumentProcessingStatus.UPLOADED,
    )
    assert doc.id == "DOC-001"
    assert doc.sha256.startswith("e3b0c442")

def test_tender_schema():
    from datetime import datetime, timezone
    req = RequirementSchema(
        id="REQ-001",
        title="PAN Card",
        category=RequirementCategory.STATUTORY,
        mandatory=True,
    )
    tender = TenderSchema(
        id="TND-001",
        organization_id="ORG-001",
        tender_number="GEM/2026/B/1001",
        title="Supply of IT Infrastructure",
        entity="Ministry of Electronics and Information Technology",
        category="EQUIPMENT",
        submission_deadline=datetime(2026, 10, 15, 17, 0, 0, tzinfo=timezone.utc),
        status=TenderStatus.ACTIVE,
        requirements=[req],
    )
    assert tender.tender_number == "GEM/2026/B/1001"
    assert len(tender.requirements) == 1


# 11. Cycle 3 Main Dev 1 Schema & Validation Tests

def test_tender_schema_full_cycle3_metadata():
    from datetime import datetime, timezone
    deadline = datetime(2026, 10, 15, 17, 0, 0, tzinfo=timezone.utc)
    tender = TenderSchema(
        tender_number="GEM/2026/B/1234567",
        title="Supply of Industrial Equipment",
        description="Supply and installation of industrial equipment",
        organization="Example Government Organization",
        category="TECHNICAL",
        tender_type=TenderType.OPEN,
        submission_deadline=deadline,
        status=TenderStatus.DRAFT,
    )
    assert tender.tender_number == "GEM/2026/B/1234567"
    assert tender.title == "Supply of Industrial Equipment"
    assert tender.description == "Supply and installation of industrial equipment"
    assert tender.organization == "Example Government Organization"
    assert tender.entity == "Example Government Organization"
    assert tender.category == "TECHNICAL"
    assert tender.tender_type == "OPEN"
    assert tender.status == "DRAFT"
    assert tender.id.startswith("TND-")
    assert tender.created_at is not None
    assert tender.updated_at is not None


def test_tender_schema_blank_tender_number_rejected():
    from datetime import datetime, timezone
    with pytest.raises(ValidationError) as exc:
        TenderSchema(
            tender_number="   ",
            title="Valid Title",
            category="TECHNICAL",
            submission_deadline=datetime(2026, 10, 15, 17, 0, 0, tzinfo=timezone.utc),
        )
    assert "tender_number" in str(exc.value)


def test_tender_schema_blank_title_rejected():
    from datetime import datetime, timezone
    with pytest.raises(ValidationError) as exc:
        TenderSchema(
            tender_number="GEM/2026/B/1001",
            title="",
            category="TECHNICAL",
            submission_deadline=datetime(2026, 10, 15, 17, 0, 0, tzinfo=timezone.utc),
        )
    assert "title" in str(exc.value)


def test_tender_schema_invalid_status_rejected():
    from datetime import datetime, timezone
    with pytest.raises(ValidationError):
        TenderSchema(
            tender_number="GEM/2026/B/1001",
            title="Valid Title",
            category="TECHNICAL",
            submission_deadline=datetime(2026, 10, 15, 17, 0, 0, tzinfo=timezone.utc),
            status="NON_EXISTENT_STATUS",
        )


def test_tender_schema_invalid_tender_type_rejected():
    from datetime import datetime, timezone
    with pytest.raises(ValidationError):
        TenderSchema(
            tender_number="GEM/2026/B/1001",
            title="Valid Title",
            category="TECHNICAL",
            tender_type="INVALID_TYPE",
            submission_deadline=datetime(2026, 10, 15, 17, 0, 0, tzinfo=timezone.utc),
        )


def test_requirement_classification_enums():
    # Test Mandatory Level enum
    assert RequirementMandatoryLevel.MANDATORY == "MANDATORY"
    assert RequirementMandatoryLevel.OPTIONAL == "OPTIONAL"

    # Test Review Status enum
    assert RequirementReviewStatus.REQUIRED == "REQUIRED"
    assert RequirementReviewStatus.NOT_REQUIRED == "NOT_REQUIRED"
    assert RequirementReviewStatus.REVIEW == "REVIEW"

    # Test RequirementSchema with new enums
    req = RequirementSchema(
        id="REQ-TEST-001",
        title="Valid GST",
        category=RequirementCategory.STATUTORY,
        mandatory=True,
        mandatory_level=RequirementMandatoryLevel.MANDATORY,
        review_status=RequirementReviewStatus.REQUIRED,
    )
    assert req.mandatory_level == "MANDATORY"
    assert req.review_status == "REQUIRED"


# 12. Cycle 4 Extraction Contract Tests

def test_cycle4_extraction_contract_valid():
    input_contract = ExtractionInput(
        tender_id="TND-001",
        document_id="DOC-001",
        file_path="storage/tenders/TND-001/rfp.pdf",
    )
    assert input_contract.tender_id == "TND-001"
    assert input_contract.document_id == "DOC-001"

    req1 = ExtractedRequirement(
        id="REQ-001",
        title="Annual Turnover",
        description="Average annual turnover >= 5 Cr",
        category=RequirementCategory.FINANCIAL,
        mandatory=True,
        mandatory_level=RequirementMandatoryLevel.MANDATORY,
        operator=ComparisonOperator.GREATER_THAN_EQUAL,
        expected_value=50000000,
        unit="INR",
        source_clause="Clause 5.1",
        source_page=8,
        confidence=0.95,
    )
    req2 = ExtractedRequirement(
        id="REQ-002",
        title="GST Registration",
        category=RequirementCategory.STATUTORY,
        mandatory=True,
        confidence=0.99,
    )

    clause = ExtractedClause(
        clause_id="Clause 5.1",
        text="The bidder must possess average turnover of at least Rs 5 Cr.",
        page_number=8,
        section="Financial Qualifications",
    )

    result = ExtractionResult(
        tender_id=input_contract.tender_id,
        document_id=input_contract.document_id,
        requirements=[req1, req2],
        raw_clauses=[clause],
    )
    assert result.total_requirements == 2
    assert result.avg_confidence == 0.97  # (0.95 + 0.99) / 2
    assert len(result.raw_clauses) == 1
    assert result.raw_clauses[0].clause_id == "Clause 5.1"


def test_cycle4_extraction_confidence_out_of_bounds():
    with pytest.raises(ValidationError):
        ExtractedRequirement(
            title="Invalid Confidence",
            category=RequirementCategory.TECHNICAL,
            confidence=1.5,  # must be <= 1.0
        )

