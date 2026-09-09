import React from 'react';
import { Card } from '../components/ui/Card';
import { useParams } from 'react-router-dom';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { evidenceService } from '../services/evidenceService';
import { documentService } from '../services/documentService';
import { EvidenceFieldCard, ExtractionStatus, FieldTable, OCRPagePreview } from '../components/documents';
import type { Evidence, Document, OCRPage } from '../types';

export const BidEvidencePage: React.FC = () => {
  const { id } = useParams();
  const [evidence, setEvidence] = React.useState<Evidence[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [sourcePages, setSourcePages] = React.useState<OCRPage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  React.useEffect(() => { if (!id) return; void Promise.all([evidenceService.listForBid(id), documentService.listBidDocuments(id)]).then(([evidenceResponse, docsResponse]) => { setEvidence(evidenceResponse.data.evidence || []); setDocuments(docsResponse.data || []); }).catch((err) => setError(err?.message || 'Unable to load extracted evidence.')).finally(() => setLoading(false)); }, [id]);
  const showSource = async (item: Evidence) => { try { const pages = await documentService.getOCRPages(item.document_id); setSourcePages(pages.data.pages.map((page: any) => ({ page_number: page.page_number, text: page.raw_text || page.text, ocr_confidence: page.ocr_confidence }))); } catch (err: any) { setError(err?.message || 'Unable to load evidence source.'); } };
  if (loading) return <Card title="Evidence"><Loading message="Loading extracted evidence..." /></Card>;
  if (error && !evidence.length) return <Card title="Evidence"><ErrorState title="Unable to load evidence" message={error} /></Card>;
  return <div className="space-y-6"><div><h1 className="text-2xl font-semibold text-slate-900">Bid {id} — Evidence</h1><p className="text-sm text-slate-500">Validated extracted fields with document and page provenance.</p></div>{error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Card title="Document extraction status"><div className="space-y-3">{documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"><span className="font-medium">{document.original_filename}</span><ExtractionStatus status={document.processing_status === 'EXTRACTED' ? 'EXTRACTED' : document.processing_status === 'EXTRACTION_FAILED' ? 'EXTRACTION_FAILED' : 'EXTRACTING'} /></div>)}</div></Card><Card title="Extracted fields" subtitle="Low confidence is a review signal, not a compliance result.">{evidence.length ? <><div className="hidden md:block"><FieldTable fields={evidence} /></div><div className="grid gap-3 md:hidden">{evidence.map((item) => <EvidenceFieldCard key={item.id} evidence={item} onViewSource={showSource} />)}</div></> : <p className="text-sm text-slate-500">No structured evidence is available yet.</p>}</Card>{sourcePages.length > 0 && <Card title="Evidence source"><OCRPagePreview pages={sourcePages} /></Card>}</div>;
};

export default BidEvidencePage;
