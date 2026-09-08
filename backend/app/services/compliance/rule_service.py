import json
import uuid

from app.domain.compliance import ComplianceRule, build_rule, evaluate_rule
from app.models.models import ComplianceRule as ComplianceRuleModel, Requirement, Tender, db


class RuleServiceError(Exception):
    def __init__(self, message, code="VALIDATION_ERROR", status_code=400):
        super().__init__(message); self.message = message; self.code = code; self.status_code = status_code


def _requirement(requirement_id, organization_id):
    requirement = Requirement.query.get(requirement_id)
    if not requirement: raise RuleServiceError("Requirement not found", "NOT_FOUND", 404)
    if requirement.tender_version.tender.organization_id != organization_id: raise RuleServiceError("Access denied", "FORBIDDEN", 403)
    return requirement


def _to_domain(model):
    expected = model.expected_value
    try: expected = json.loads(expected)
    except (TypeError, json.JSONDecodeError): pass
    return ComplianceRule(id=model.id, requirement_id=model.requirement_id, rule_type=model.rule_type, operator=model.operator, expected_value=expected, parameters=model.parameters or {}, priority=model.priority, enabled=model.enabled, version=model.version)


def _persist(rule):
    expected = rule.expected_value
    if isinstance(expected, (dict, list, bool, int, float)): expected = json.dumps(expected)
    return ComplianceRuleModel(id=rule.id or f"RULE-{uuid.uuid4().hex[:10].upper()}", requirement_id=rule.requirement_id, rule_type=rule.rule_type, operator=rule.operator, expected_value=expected, parameters=rule.parameters, priority=rule.priority, enabled=rule.enabled, version=rule.version)


def create_rule_for_requirement(requirement_id, organization_id, payload=None):
    requirement = _requirement(requirement_id, organization_id)
    rule = build_rule(requirement)
    payload = payload or {}
    if payload:
        merged = rule.model_dump(); merged.update({key: payload[key] for key in ("rule_type", "operator", "expected_value", "parameters", "priority", "enabled", "version") if key in payload})
        merged["requirement_id"] = requirement_id
        rule = ComplianceRule(**merged)
    model = _persist(rule)
    db.session.add(model); db.session.commit()
    return model.to_dict()


def list_rules_for_requirement(requirement_id, organization_id):
    _requirement(requirement_id, organization_id)
    return [rule.to_dict() for rule in ComplianceRuleModel.query.filter_by(requirement_id=requirement_id).order_by(ComplianceRuleModel.priority.asc()).all()]


def generate_rules_for_tender(tender_id, organization_id):
    tender = Tender.query.filter_by(id=tender_id).first()
    if not tender: raise RuleServiceError("Tender not found", "NOT_FOUND", 404)
    if tender.organization_id != organization_id: raise RuleServiceError("Access denied", "FORBIDDEN", 403)
    requirements = []
    for version in sorted(tender.versions, key=lambda item: item.version_number, reverse=True):
        requirements.extend(version.requirements)
        if requirements: break
    generated = []
    for requirement in requirements:
        existing = ComplianceRuleModel.query.filter_by(requirement_id=requirement.id, enabled=True).first()
        if existing: generated.append(existing.to_dict()); continue
        generated.append(create_rule_for_requirement(requirement.id, organization_id))
    return generated


def list_rules_for_tender(tender_id, organization_id):
    tender = Tender.query.filter_by(id=tender_id).first()
    if not tender: raise RuleServiceError("Tender not found", "NOT_FOUND", 404)
    if tender.organization_id != organization_id: raise RuleServiceError("Access denied", "FORBIDDEN", 403)
    ids = [requirement.id for version in tender.versions for requirement in version.requirements]
    return [rule.to_dict() for rule in ComplianceRuleModel.query.filter(ComplianceRuleModel.requirement_id.in_(ids)).order_by(ComplianceRuleModel.priority.asc()).all()] if ids else []


def evaluate_rule_record(rule_id, organization_id, evidence):
    model = ComplianceRuleModel.query.get(rule_id)
    if not model: raise RuleServiceError("Rule not found", "NOT_FOUND", 404)
    requirement = _requirement(model.requirement_id, organization_id)
    result = evaluate_rule(_to_domain(model), evidence)
    return result.model_dump()
