-- Cycle 11: persist the period over which a tender requirement is evaluated.
ALTER TABLE requirements
    ADD COLUMN IF NOT EXISTS evaluation_period VARCHAR(255);
