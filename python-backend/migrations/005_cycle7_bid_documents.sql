-- Cycle 7: bid-scoped document management, duplicate prevention, metadata.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description VARCHAR(500);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC');
CREATE INDEX IF NOT EXISTS idx_documents_bid_id ON documents(bid_id);
-- Partial unique index: prevents the same file (by SHA-256) being uploaded twice
-- to the same bid, while leaving tender documents (bid_id IS NULL) unrestricted.
CREATE UNIQUE INDEX IF NOT EXISTS uq_bid_document_hash ON documents(bid_id, sha256)
    WHERE bid_id IS NOT NULL;
