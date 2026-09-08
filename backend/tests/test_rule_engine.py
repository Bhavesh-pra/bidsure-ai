import json
import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.domain.compliance import ComplianceRule, RuleType, evaluate_rule


DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../mock-data/rules"))


@pytest.mark.parametrize("filename", ["mandatory.json", "registration.json", "threshold.json", "experience.json", "expiry.json"])
def test_rule_dataset(filename):
    with open(os.path.join(DATA_DIR, filename), encoding="utf-8") as handle:
        cases = json.load(handle)
    for case in cases:
        rule = ComplianceRule(requirement_id="REQ-DATA", rule_type=case["rule_type"], operator=case.get("operator"), expected_value=case.get("expected_value"))
        result = evaluate_rule(rule, case["evidence"])
        assert result.status == case["expected"], f"{filename}: {case['name']}"


def test_no_arbitrary_expression_execution():
    rule = ComplianceRule(requirement_id="REQ-SAFE", rule_type=RuleType.THRESHOLD, operator=">=", expected_value=5)
    result = evaluate_rule(rule, {"actual_value": "__import__('os').system('echo unsafe')"})
    assert result.status == "REVIEW"
