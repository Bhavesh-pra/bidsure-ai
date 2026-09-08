-- Cycle 5: deterministic compliance rules generated from tender requirements.
CREATE TABLE IF NOT EXISTS compliance_rules (
    id VARCHAR(36) PRIMARY KEY,
    requirement_id VARCHAR(36) NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL,
    operator VARCHAR(30),
    expected_value TEXT,
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority INTEGER NOT NULL DEFAULT 100,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);
CREATE INDEX IF NOT EXISTS idx_compliance_rules_requirement_id ON compliance_rules(requirement_id);
