-- Cycle 9: document classification persistence
ALTER TABLE documents ADD COLUMN IF NOT EXISTS classification_confidence FLOAT;
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);
