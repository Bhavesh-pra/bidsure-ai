import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link, useParams } from 'react-router-dom';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { evidenceService } from '../services/evidenceService';
import { documentService } from '../services/documentService';
import { EvidenceFieldCard, ExtractionStatus, FieldTable, OCRPagePreview } from '../components/documents';
import type { Evidence, Document, OCRPage } from '../types';
import { ArrowLeft, FileCheck, Search, ShieldCheck } from 'lucide-react';

export const BidEvidencePage: React.FC = () => {
  const { id } = useParams();
  const [evidence, setEvidence] = React.useState<Evidence[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [sourcePages, setSourcePages] = React.useState<OCRPage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!id) return;
    void Promise.all([evidenceService.listForBid(id), documentService.listBidDocuments(id)])
      .then(([evidenceResponse, docsResponse]) => {
        setEvidence(evidenceResponse.data.evidence || []);
        setDocuments(docsResponse.data || []);
      })
      .catch((err) => setError(err?.message || 'Unable to load extracted evidence.'))
      .finally(() => setLoading(false));
  }, [id]);

  const showSource = async (item: Evidence) => {
    try {
      const pages = await documentService.getOCRPages(item.document_id);
      setSourcePages(
        pages.data.pages.map((page: any) => ({
          page_number: page.page_number,
          text: page.raw_text || page.text,
          ocr_confidence: page.ocr_confidence,
        }))
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to load evidence source.');
    }
  };

  if (loading) return <Card title="Extracted Evidence"><Loading message="Loading extracted evidence & OCR pages..." /></Card>;
  if (error && !evidence.length) return <Card title="Extracted Evidence"><ErrorState title="Unable to load evidence" message={error} /></Card>;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link to={`/bids/${id}`} className="hover:text-slate-800 flex items-center transition-colors">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Back to Bid
            </Link>
            <span>/</span>
            <span className="font-mono text-[#0F2747] font-semibold">Evidence Traceability</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight mt-1">
            Bid {id} — Extracted Evidence Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Structured OCR extractions linked to exact document page numbers and confidence scores.
          </p>
        </div>

        <Link to={`/bids/${id}/verification`}>
          <Button variant="secondary" size="sm" className="flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4" />
            <span>Go to Verification Results →</span>
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-[6px] border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Document Ingestion Status Bar */}
      <Card title="Document Extraction Pipeline Status" subtitle="Ingestion and OCR parsing status across submitted files">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map((document) => (
            <div key={document.id} className="flex items-center justify-between gap-3 rounded-[6px] border border-slate-200 bg-slate-50/60 p-3 text-xs">
              <span className="font-semibold text-slate-800 truncate" title={document.original_filename}>
                {document.original_filename}
              </span>
              <ExtractionStatus
                status={
                  document.processing_status === 'EXTRACTED'
                    ? 'EXTRACTED'
                    : document.processing_status === 'EXTRACTION_FAILED'
                    ? 'EXTRACTION_FAILED'
                    : 'EXTRACTING'
                }
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Split Viewer: Extracted Evidence vs OCR Document Source */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column / Main Table: Extracted Fields */}
        <div className={sourcePages.length ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
          <Card
            title="Extracted Field Values"
            subtitle="Validated extractions with confidence scores. Low confidence requires manual officer review."
          >
            {evidence.length ? (
              <div className="space-y-4">
                <div className="hidden md:block overflow-x-auto rounded-[6px] border border-slate-200">
                  <FieldTable fields={evidence} />
                </div>
                <div className="grid gap-3 md:hidden">
                  {evidence.map((item) => (
                    <EvidenceFieldCard key={item.id} evidence={item} onViewSource={showSource} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No structured evidence fields available yet.</p>
            )}
          </Card>
        </div>

        {/* Right Column / Inspector: Document Source Preview */}
        {sourcePages.length > 0 && (
          <div className="lg:col-span-5">
            <Card title="Document Page Source Text" subtitle="Raw OCR text extracted from document page">
              <OCRPagePreview pages={sourcePages} />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BidEvidencePage;
