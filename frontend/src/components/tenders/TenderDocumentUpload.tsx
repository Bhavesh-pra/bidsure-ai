import React, { useState } from 'react';
import { FileDropzone } from './FileDropzone';
import { FilePreview } from './FilePreview';
import { ProcessingStatus } from './ProcessingStatus';
import { UploadButton } from './UploadButton';
import { UploadProgress } from './UploadProgress';
import { tenderService } from '../../services/tenderService';

export const TenderDocumentUpload: React.FC<{ tenderId: string; onUploaded: () => void }> = ({ tenderId, onUploaded }) => {
  const [file, setFile] = useState<File>(); const [progress, setProgress] = useState(0); const [status, setStatus] = useState(''); const [error, setError] = useState<string>(); const [loading, setLoading] = useState(false);
  const choose = (next?: File) => { setError(undefined); if (next && (!next.name.toLowerCase().endsWith('.pdf') || next.type && next.type !== 'application/pdf')) { setError('Please select a valid PDF file.'); return; } if (next && next.size > 10 * 1024 * 1024) { setError('PDF must be smaller than 10 MB.'); return; } setFile(next); };
  const upload = async () => { if (!file) { setError('Select a PDF before uploading.'); return; } setLoading(true); setStatus('UPLOADING'); setError(undefined); try { setStatus('PROCESSING'); const result = await tenderService.uploadDocument(tenderId, file, setProgress); setStatus(result.data.status); onUploaded(); } catch (requestError) { setStatus('FAILED'); setError(requestError && typeof requestError === 'object' && 'message' in requestError ? String(requestError.message) : 'Upload or extraction failed.'); } finally { setLoading(false); } };
  return <div className="space-y-3"><FileDropzone file={file} onFile={choose} disabled={loading} error={error} /><FilePreview file={file} />{progress > 0 && <UploadProgress progress={progress} />} {status && <div className="flex items-center gap-2 text-sm text-slate-600">Processing status: <ProcessingStatus status={status} /></div>}<div className="flex justify-end"><UploadButton disabled={!file || loading} loading={loading} onClick={() => void upload()} /></div></div>;
};
