import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { bidService } from '../services/bidService';
import { documentService } from '../services/documentService';
import type { Bid, Document, DocumentType } from '../types';
import {
  DocumentCard,
  MissingDocumentsCard,
  MultiDocumentUploadModal,
  DocumentMetadataModal,
  DocumentEmptyState,
  DocumentErrorAlert,
  OCRPagePreview,
  DocumentStatus,
} from '../components/documents';
import { Modal } from '../components/ui/Modal';
import {
  ArrowLeft,
  Upload,
  Building2,
  Calendar,
  IndianRupee,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export const BidDetailsPage: React.FC = () => {
  const { id, bidId, tenderId: routeTenderId } = useParams<{ id?: string; bidId?: string; tenderId?: string }>();
  const activeBidId = bidId || id;

  const [bid, setBid] = useState<Bid | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] = useState<DocumentType | string>('GST_CERTIFICATE');

  // Metadata Modal State
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);

  // Deletion State
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [classifyingDocId, setClassifyingDocId] = useState<string | null>(null);
  const [extractingDocId, setExtractingDocId] = useState<string | null>(null);
  const [ocrDocument, setOcrDocument] = useState<Document | null>(null);
  const [ocrPages, setOcrPages] = useState<import('../types').OCRPage[]>([]);

  const loadData = async (bId: string) => {
    try {
      setError(null);
      const [bidResponse, docsResponse] = await Promise.all([
        bidService.get(bId),
        documentService.listBidDocuments(bId),
      ]);
      setBid(bidResponse.data);
      setDocuments(docsResponse.data || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load bid details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBidId) {
      setLoading(true);
      void loadData(activeBidId);
    } else {
      setError('No Bid ID provided.');
      setLoading(false);
    }
  }, [activeBidId]);

  const handleOpenUploadModal = (initialType?: DocumentType | string) => {
    if (initialType) {
      setUploadDocumentType(initialType);
    }
    setActionError(null);
    setIsUploadModalOpen(true);
  };

  const handleUploadSuccess = (newDoc: Document) => {
    // Add to documents list if not already present, or replace
    setDocuments((prev) => {
      const filtered = prev.filter((d) => d.id !== newDoc.id);
      return [newDoc, ...filtered];
    });
    setActionError(null);
  };

  const handleViewMetadata = (doc: Document) => {
    setSelectedDocument(doc);
    setIsMetadataModalOpen(true);
  };

  const handleProcessDocument = async (doc: Document) => {
    setProcessingDocId(doc.id);
    setActionError(null);
    try {
      await documentService.processDocument(doc.id);
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, processing_status: 'PROCESSING' } : item));
      // Poll briefly so the UI reflects PROCESSING → PROCESSED/FAILED without a refresh.
      for (let attempt = 0; attempt < 30; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
        const response = await documentService.getDocument(doc.id);
        const current = response.data;
        setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, ...current } : item));
        if (current.processing_status !== 'PROCESSING') break;
      }
    } catch (err: any) {
      setActionError(err?.message || 'OCR processing failed.');
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, processing_status: 'FAILED' } : item));
    } finally {
      setProcessingDocId(null);
    }
  };

  const handleViewOCR = async (doc: Document) => {
    setOcrDocument(doc);
    setOcrPages([]);
    try {
      const response = await documentService.getOCRPages(doc.id);
      setOcrPages(response.data.pages || []);
    } catch (err: any) {
      setActionError(err?.message || 'Unable to load OCR text.');
    }
  };

  const handleClassifyDocument = async (doc: Document) => {
    setClassifyingDocId(doc.id);
    setActionError(null);
    try {
      const response = await documentService.classifyDocument(doc.id);
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, ...response.data } : item));
    } catch (err: any) {
      setActionError(err?.message || 'Document classification failed.');
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, classification_status: 'FAILED' } : item));
    } finally {
      setClassifyingDocId(null);
    }
  };

  const handleExtractDocument = async (doc: Document) => {
    setExtractingDocId(doc.id);
    setActionError(null);
    try {
      const response = await documentService.extractDocument(doc.id);
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, processing_status: response.data.extraction_status } : item));
    } catch (err: any) {
      setActionError(err?.message || 'Evidence extraction failed.');
      setDocuments((prev) => prev.map((item) => item.id === doc.id ? { ...item, processing_status: 'EXTRACTION_FAILED' } : item));
    } finally {
      setExtractingDocId(null);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${doc.original_filename}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeletingDocId(doc.id);
    setActionError(null);

    try {
      await documentService.deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete document.');
    } finally {
      setDeletingDocId(null);
    }
  };

  if (loading) {
    return (
      <Card title="Bid Details">
        <Loading message="Loading bid details and documents..." />
      </Card>
    );
  }

  if (error || !bid) {
    return (
      <Card title="Bid Details">
        <ErrorState title="Unable to load bid" message={error || 'Bid not found.'} />
        <div className="px-6 pb-6">
          <Link to="/tenders">
            <Button variant="outline">Back to Tenders</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const tenderId = routeTenderId || bid.tender?.id || bid.tender_id;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link
              to={tenderId ? `/tenders/${tenderId}` : '/tenders'}
              className="flex items-center hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              {tenderId ? 'Back to Tender' : 'Back to Tenders'}
            </Link>
            <span>/</span>
            <span>Bid {bid.id}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {bid.bidder?.legal_name || 'Bidder'}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link to={`/bids/${bid.id}/evidence`}><Button variant="outline">View Evidence</Button></Link>
          <Button
            variant="outline"
            onClick={() => handleOpenUploadModal()}
            className="flex items-center space-x-1.5"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Document</span>
          </Button>
          <Link to={`/bids/${bid.id}/verification`}>
            <Button variant="primary" className="flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>Verify Compliance</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <DocumentErrorAlert
          error={actionError}
          onDismiss={() => setActionError(null)}
        />
      )}

      {/* Bid Details Summary Card */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Building2 className="h-3.5 w-3.5" />
              <span>Bidder</span>
            </div>
            <p className="font-semibold text-slate-900">{bid.bidder?.legal_name || '—'}</p>
            <p className="text-xs text-slate-500">
              {bid.bidder?.pan ? `PAN: ${bid.bidder.pan}` : ''}{' '}
              {bid.bidder?.gstin ? `| GSTIN: ${bid.bidder.gstin}` : ''}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <FileText className="h-3.5 w-3.5" />
              <span>Tender</span>
            </div>
            <p className="font-semibold text-slate-900 truncate" title={bid.tender?.title}>
              {bid.tender?.title || bid.tender_id}
            </p>
            {bid.tender?.tender_number && (
              <p className="text-xs text-slate-500">{bid.tender.tender_number}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <IndianRupee className="h-3.5 w-3.5" />
              <span>Quoted Amount</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              ₹{Number(bid.quoted_amount).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-slate-500">Proposed Quote</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Status & Date</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                {bid.status}
              </span>
            </div>
            {bid.proposed_completion_date && (
              <p className="text-xs text-slate-500">
                Target: {new Date(bid.proposed_completion_date).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Expected Documents Checklist (Cycle 7 Requirement) */}
      <MissingDocumentsCard
        documents={documents}
        onUploadForType={(type) => handleOpenUploadModal(type)}
        onOpenUploadModal={() => handleOpenUploadModal()}
      />

      {/* Uploaded Documents Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Uploaded Bid Documents ({documents.length})
            </h2>
            <p className="text-xs text-slate-500">
              Documents uploaded against this bid. Files are stored securely and hashed with SHA-256.
            </p>
          </div>

          {documents.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenUploadModal()}
              className="flex items-center space-x-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload More</span>
            </Button>
          )}
        </div>

        {documents.length === 0 ? (
          <DocumentEmptyState onUploadClick={() => handleOpenUploadModal()} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={handleViewMetadata}
                onDelete={handleDeleteDocument}
                isDeleting={deletingDocId === doc.id}
                onProcess={handleProcessDocument}
                isProcessing={processingDocId === doc.id}
                onViewOCR={handleViewOCR}
                onClassify={handleClassifyDocument}
                isClassifying={classifyingDocId === doc.id}
                onExtract={handleExtractDocument}
                isExtracting={extractingDocId === doc.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <MultiDocumentUploadModal
        bidId={bid.id}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
        initialDocumentType={uploadDocumentType}
      />

      <DocumentMetadataModal
        document={selectedDocument}
        isOpen={isMetadataModalOpen}
        onClose={() => {
          setIsMetadataModalOpen(false);
          setSelectedDocument(null);
        }}
      />

      <Modal isOpen={Boolean(ocrDocument)} onClose={() => setOcrDocument(null)} title={ocrDocument ? `OCR Text — ${ocrDocument.original_filename}` : 'OCR Text'}>
        {ocrDocument && <div className="space-y-4"><DocumentStatus status={ocrDocument.processing_status} /><OCRPagePreview pages={ocrPages} /></div>}
      </Modal>
    </div>
  );
};

export default BidDetailsPage;
