-- Cycle 10: page-aware structured evidence extracted from classified bidder documents.
CREATE TABLE IF NOT EXISTS evidence (
    id VARCHAR(36) PRIMARY KEY,
    bid_id VARCHAR(36) NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    document_id VARCHAR(36) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    requirement_id VARCHAR(36) REFERENCES requirements(id),
    field VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    normalized_value JSONB,
    page INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL DEFAULT 'BIDDER_DOCUMENT',
    extraction_method VARCHAR(50) NOT NULL DEFAULT 'REGEX',
    confidence DOUBLE PRECISION NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'EXTRACTED',
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);
CREATE INDEX IF NOT EXISTS idx_evidence_bid_id ON evidence(bid_id);
CREATE INDEX IF NOT EXISTS idx_evidence_document_id ON evidence(document_id);
