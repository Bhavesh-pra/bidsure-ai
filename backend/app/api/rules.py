from flask import Blueprint, g, request
from pydantic import ValidationError

from app.domain.compliance import ComplianceRule, evaluate_rule
from app.models.models import ComplianceRule as ComplianceRuleModel
from app.security.decorators import jwt_required, roles_required
from app.services.compliance.rule_service import (
    RuleServiceError,
    create_rule_for_requirement,
    evaluate_rule_record,
    generate_rules_for_tender,
    list_rules_for_requirement,
    list_rules_for_tender,
)
from app.utils.response import error_response, success_response

rules_bp = Blueprint("rules", __name__)

def _service_error(error):
    return error_response(error.code, error.message, error.status_code)

@rules_bp.post("/requirements/<string:requirement_id>/rules")
@jwt_required
@roles_required("PROCUREMENT_OFFICER", "ADMIN")
def create_rule(requirement_id):
    try: return success_response(create_rule_for_requirement(requirement_id, g.current_org_id, request.get_json() or {}), 201)
    except RuleServiceError as error: return _service_error(error)
    except ValidationError as error: return error_response("VALIDATION_ERROR", str(error), 400)

@rules_bp.get("/requirements/<string:requirement_id>/rules")
@jwt_required
def get_requirement_rules(requirement_id):
    try: return success_response(list_rules_for_requirement(requirement_id, g.current_org_id))
    except RuleServiceError as error: return _service_error(error)

@rules_bp.post("/tenders/<string:tender_id>/rules/generate")
@jwt_required
@roles_required("PROCUREMENT_OFFICER", "ADMIN")
def generate_tender_rules(tender_id):
    try: return success_response({"tender_id": tender_id, "rules": generate_rules_for_tender(tender_id, g.current_org_id)})
    except RuleServiceError as error: return _service_error(error)

@rules_bp.get("/tenders/<string:tender_id>/rules")
@jwt_required
def get_tender_rules(tender_id):
    try: return success_response({"tender_id": tender_id, "rules": list_rules_for_tender(tender_id, g.current_org_id)})
    except RuleServiceError as error: return _service_error(error)

@rules_bp.post("/rules/evaluate")
@jwt_required
def evaluate_rule_endpoint():
    payload = request.get_json() or {}
    rule_id = payload.get("rule_id")
    if not rule_id or not isinstance(payload.get("evidence", {}), dict): return error_response("VALIDATION_ERROR", "rule_id and evidence object are required", 400)
    try: return success_response(evaluate_rule_record(rule_id, g.current_org_id, payload.get("evidence", {})))
    except RuleServiceError as error: return _service_error(error)
