-- Cycle 6: organization-scoped bidder identity and bid lifecycle.
ALTER TABLE bidders ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36) REFERENCES organizations(id);
ALTER TABLE bidders ADD COLUMN IF NOT EXISTS address VARCHAR(1000);
ALTER TABLE bidders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC');
ALTER TABLE bids ALTER COLUMN status SET DEFAULT 'DRAFT';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC');
CREATE INDEX IF NOT EXISTS idx_bidders_organization_id ON bidders(organization_id);
