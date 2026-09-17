from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, ConfigDict

class RuleType(str, Enum):
    MANDATORY_DOCUMENT = "MANDATORY_DOCUMENT"
    REGISTRATION = "REGISTRATION"
    EQUALITY = "EQUALITY"
    THRESHOLD = "THRESHOLD"
    EXPIRY = "EXPIRY"
    EXPERIENCE = "EXPERIENCE"
    BOOLEAN = "BOOLEAN"

class RuleResultStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW = "REVIEW"
    UNKNOWN = "UNKNOWN"
    EVIDENCE_MISSING = "EVIDENCE_MISSING"

class ComplianceRule(BaseModel):
    id: Optional[str] = None
    requirement_id: str
    rule_type: RuleType
    operator: Optional[str] = None
    expected_value: Any = None
    parameters: Dict[str, Any] = Field(default_factory=dict)
    priority: int = Field(100, ge=0)
    enabled: bool = True
    version: int = Field(1, ge=1)
    model_config = ConfigDict(use_enum_values=True)

class RuleEvaluationResult(BaseModel):
    rule_id: Optional[str] = None
    requirement_id: str
    status: RuleResultStatus
    actual_value: Any = None
    expected_value: Any = None
    reason: str
    rule_type: RuleType
    model_config = ConfigDict(use_enum_values=True)

def _to_date(value: Any) -> Optional[date]:
    if isinstance(value, datetime): return value.date()
    if isinstance(value, date): return value
    if isinstance(value, str):
        try: return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        except ValueError:
            try: return date.fromisoformat(value)
            except ValueError: return None
    return None

def _number(value: Any) -> Optional[float]:
    if isinstance(value, bool): return None
    try: return float(str(value).replace(",", "").replace("₹", "").strip())
    except (TypeError, ValueError): return None

def _result(rule, status, actual, reason):
    return RuleEvaluationResult(rule_id=rule.id, requirement_id=rule.requirement_id, rule_type=rule.rule_type, status=status, actual_value=actual, expected_value=rule.expected_value, reason=reason)

def _missing(rule, reason, actual=None):
    return _result(rule, RuleResultStatus.REVIEW, actual, reason)

def evaluate_rule(rule: ComplianceRule, evidence: Optional[Dict[str, Any]] = None) -> RuleEvaluationResult:
    """Evaluate controlled rule types; never executes expressions from storage."""
    evidence = evidence or {}
    if not rule.enabled:
        return _result(rule, RuleResultStatus.UNKNOWN, None, "Rule is disabled")
    actual = evidence.get("actual_value", evidence.get("value"))
    if actual is None: actual = evidence.get("status", evidence.get("years", evidence.get("experience_years")))
    if rule.rule_type == RuleType.MANDATORY_DOCUMENT:
        exists = evidence.get("exists", evidence.get("document_exists", evidence.get("value")))
        if exists is None: return _result(rule, RuleResultStatus.EVIDENCE_MISSING, None, "Mandatory document evidence is missing")
        return _result(rule, RuleResultStatus.PASS if bool(exists) else RuleResultStatus.FAIL, exists, f"Mandatory document {'exists' if bool(exists) else 'does not exist'}")
    if rule.rule_type == RuleType.REGISTRATION:
        if actual is None: return _result(rule, RuleResultStatus.EVIDENCE_MISSING, None, "Registration status evidence is missing")
        expected = rule.expected_value if rule.expected_value is not None else "ACTIVE"
        passed = str(actual).upper() == str(expected).upper()
        return _result(rule, RuleResultStatus.PASS if passed else RuleResultStatus.FAIL, actual, f"Registration status is {actual}; expected {expected}")
    if rule.rule_type in (RuleType.THRESHOLD, RuleType.EXPERIENCE):
        number, expected = _number(actual), _number(rule.expected_value)
        if number is None or expected is None: return _missing(rule, "Numeric evidence is missing or invalid", actual)
        operator = rule.operator or ">="
        comparisons = {">=": number >= expected, "GREATER_THAN_EQUAL": number >= expected, ">": number > expected, "GREATER_THAN": number > expected, "<=": number <= expected, "LESS_THAN_EQUAL": number <= expected, "<": number < expected, "LESS_THAN": number < expected, "==": number == expected, "EQUALS": number == expected}
        if operator not in comparisons: return _result(rule, RuleResultStatus.REVIEW, number, f"Unsupported numeric operator '{operator}'")
        passed = comparisons[operator]
        return _result(rule, RuleResultStatus.PASS if passed else RuleResultStatus.FAIL, number, f"{number:g} {operator} {expected:g} evaluates to {passed}")
    if rule.rule_type == RuleType.EXPIRY:
        expiry = _to_date(evidence.get("expiry_date", actual)); evaluation = _to_date(evidence.get("evaluation_date")) or date.today()
        if expiry is None: return _missing(rule, "Certificate expiry date is missing or invalid", actual)
        passed = expiry >= evaluation
        return _result(rule, RuleResultStatus.PASS if passed else RuleResultStatus.FAIL, expiry.isoformat(), f"Certificate expires {expiry.isoformat()}; evaluation date is {evaluation.isoformat()}")
    if rule.rule_type == RuleType.EQUALITY:
        if actual is None: return _missing(rule, "Evidence value is missing")
        passed = str(actual).strip().casefold() == str(rule.expected_value).strip().casefold()
        return _result(rule, RuleResultStatus.PASS if passed else RuleResultStatus.FAIL, actual, f"Value {'matches' if passed else 'does not match'} expected value")
    if rule.rule_type == RuleType.BOOLEAN:
        if actual is None: return _result(rule, RuleResultStatus.EVIDENCE_MISSING, None, "Boolean evidence is missing")
        expected = True if rule.expected_value is None else bool(rule.expected_value); passed = bool(actual) == expected
        return _result(rule, RuleResultStatus.PASS if passed else RuleResultStatus.FAIL, actual, f"Boolean value {'matches' if passed else 'does not match'} requirement")
    return _result(rule, RuleResultStatus.REVIEW, actual, "Rule type requires manual review")
