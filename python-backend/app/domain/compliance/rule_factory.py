from .rule_schema import ComplianceRule, RuleType

def build_rule(requirement, rule_id=None):
    """Map a structured requirement to a controlled deterministic rule."""
    def get(name, default=None): return getattr(requirement, name, requirement.get(name, default) if isinstance(requirement, dict) else default)
    title, description, category = str(get("title", "")).lower(), str(get("description", "")).lower(), str(get("category", "")).upper()
    operator, expected, mandatory = get("operator"), get("expected_value"), get("mandatory", True)
    unit, period, requirement_id = get("unit"), get("evaluation_period"), get("id")
    if any(x in title or x in description for x in ("expiry", "valid until", "validity", "certificate valid")):
        rule_type, operator = RuleType.EXPIRY, operator or ">="
    elif any(x in title for x in ("turnover", "experience", "projects", "years")) or unit in ("INR", "PROJECTS", "YEARS"):
        rule_type, operator = (RuleType.EXPERIENCE if "experience" in title or unit in ("PROJECTS", "YEARS") else RuleType.THRESHOLD), operator or ">="
    elif any(x in title or x in description for x in ("gst", "pan", "udyam", "registration")):
        rule_type, operator, expected = RuleType.REGISTRATION, operator or "==", expected or "ACTIVE"
    elif category == "DOCUMENT" or any(x in title for x in ("document", "authorization", "certificate", "undertaking")):
        rule_type, operator = RuleType.MANDATORY_DOCUMENT, operator or "EXISTS"
    elif operator in ("==", "EQUALS", "!=", "NOT_EQUALS"):
        rule_type = RuleType.EQUALITY
    else: rule_type, operator = RuleType.BOOLEAN, operator or "EXISTS"
    return ComplianceRule(id=rule_id, requirement_id=requirement_id, rule_type=rule_type, operator=operator, expected_value=expected, parameters={"unit": unit, "period": period, "mandatory": bool(mandatory)})
