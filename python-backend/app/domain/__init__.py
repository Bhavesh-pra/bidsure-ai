# BidSure AI Domain Schemas Package
from app.domain.tender.schemas import (
    TenderSchema,
    TenderVersionSchema,
    TenderStatus,
    TenderType,
)
from app.domain.tender.contracts import (
    ExtractionInput,
    ExtractedClause,
    ExtractedRequirement,
    ExtractionResult,
    RequirementExtractionProtocol,
)
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
from app.domain.document.contracts import (
    DocumentProcessingStage,
    DocumentLifecycleState,
    DocumentValidationContract,
    DocumentIngestionInput,
    DocumentIngestionResult,
    ExtractedPageText,
    DocumentProcessingResult,
    DocumentProcessingProtocol,
)
from app.domain.evidence.schemas import EvidenceSchema, ExtractionMethod
from app.domain.verification.schemas import (
    VerificationSchema,
    VerificationStatus,
    VerificationType,
)
from app.domain.compliance.schemas import (
    ComplianceResult,
    ComplianceSchema,
    ComplianceStatus,
    RuleInput,
    RuleOutput,
)
from app.domain.risk.schemas import (
    RiskAssessmentSchema,
    RiskFactor,
    RiskFactorType,
    FindingSchema,
    FindingSeverity,
)
from app.domain.recommendation.schemas import (
    RecommendationSchema,
    RecommendationStatus,
)

__all__ = [
    "TenderSchema",
    "TenderVersionSchema",
    "TenderStatus",
    "TenderType",
    "ExtractionInput",
    "ExtractedClause",
    "ExtractedRequirement",
    "ExtractionResult",
    "RequirementExtractionProtocol",
    "RequirementSchema",
    "RequirementCategory",
    "RequirementMandatoryLevel",
    "RequirementReviewStatus",
    "ComparisonOperator",
    "DocumentSchema",
    "DocumentType",
    "DocumentProcessingStatus",
    "DocumentProcessingStage",
    "DocumentLifecycleState",
    "DocumentValidationContract",
    "DocumentIngestionInput",
    "DocumentIngestionResult",
    "ExtractedPageText",
    "DocumentProcessingResult",
    "DocumentProcessingProtocol",
    "EvidenceSchema",
    "ExtractionMethod",
    "VerificationSchema",
    "VerificationStatus",
    "VerificationType",
    "ComplianceResult",
    "ComplianceSchema",
    "ComplianceStatus",
    "RuleInput",
    "RuleOutput",
    "RiskAssessmentSchema",
    "RiskFactor",
    "RiskFactorType",
    "FindingSchema",
    "FindingSeverity",
    "RecommendationSchema",
    "RecommendationStatus",
]
