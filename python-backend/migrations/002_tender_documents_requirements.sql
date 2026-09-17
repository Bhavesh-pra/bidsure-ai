-- Cycle 4: tender document ingestion metadata and tender-scoped documents.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tender_id VARCHAR(36) REFERENCES tenders(id) ON DELETE CASCADE;
ALTER TABLE documents ALTER COLUMN bid_id DROP NOT NULL;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(36) REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_documents_tender_id ON documents(tender_id);

-- Requirements are already present in the Cycle 2 schema; source_page and
-- confidence retain extraction traceability and confidence for Cycle 4.
