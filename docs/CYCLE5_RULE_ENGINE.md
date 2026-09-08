# Cycle 5 — Deterministic Compliance Rule Engine

Cycle 5 converts Cycle 4 structured requirements into controlled executable rules. It does not verify bidders or make risk/recommendation decisions.

## API flow

```text
GET /api/v1/tenders/{id}/requirements
        ↓
POST /api/v1/tenders/{id}/rules/generate
        ↓
GET /api/v1/tenders/{id}/rules
        ↓
POST /api/v1/rules/evaluate
```

Supported rule types are `MANDATORY_DOCUMENT`, `REGISTRATION`, `EQUALITY`, `THRESHOLD`, `EXPIRY`, `EXPERIENCE`, and `BOOLEAN`.

Evaluation returns `PASS`, `FAIL`, `REVIEW`, `UNKNOWN`, or `EVIDENCE_MISSING`. Missing or malformed evidence is never silently treated as a pass.

## Example

```json
{
  "rule_type": "THRESHOLD",
  "operator": ">=",
  "expected_value": 50000000,
  "parameters": {"unit": "INR", "period": "ANNUAL"}
}
```

```json
{
  "rule_id": "RULE-001",
  "evidence": {"actual_value": 75000000}
}
```

Returns `PASS` because `75000000 >= 50000000`. The evaluator uses explicit rule-type branches and never executes expressions from the database.
