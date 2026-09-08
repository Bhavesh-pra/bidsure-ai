import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { Link, useParams } from 'react-router-dom';
import { TenderCategoryBadge } from '../components/tenders/TenderCategoryBadge';
import { TenderStatusBadge } from '../components/tenders/TenderStatusBadge';
import { tenderService } from '../services/tenderService';
import type { Tender } from '../types/tender';

const formatDate = (value?: string) => value ? new Date(value).toLocaleString() : '—';
const errorMessage = (error: unknown) => error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to load tender details.';

export const TenderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tender, setTender] = useState<Tender>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  useEffect(() => { if (!id) return; setLoading(true); void tenderService.getTender(id).then((response) => setTender(response.data)).catch((requestError) => setError(errorMessage(requestError))).finally(() => setLoading(false)); }, [id]);
  if (loading) return <Card title="Tender details"><Loading message="Loading tender..." /></Card>;
  if (error || !tender) return <Card title="Tender details"><ErrorState title="Unable to load tender" message={error || 'Tender not found.'} /><div className="px-6 pb-6"><Link to="/tenders"><Button variant="outline">Back to Tenders</Button></Link></div></Card>;
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Tender details</p><h1 className="text-2xl font-semibold text-slate-900">{tender.title}</h1></div><Link to="/tenders"><Button variant="outline">Back to Tenders</Button></Link></div>
    <Card><dl className="grid gap-5 sm:grid-cols-2">
      <div><dt className="text-xs uppercase text-slate-500">Tender Number</dt><dd className="mt-1 font-medium text-slate-900">{tender.tender_number}</dd></div>
      <div><dt className="text-xs uppercase text-slate-500">Organization</dt><dd className="mt-1 text-slate-900">{tender.organization || tender.entity || '—'}</dd></div>
      <div><dt className="text-xs uppercase text-slate-500">Category</dt><dd className="mt-1"><TenderCategoryBadge category={tender.category} /></dd></div>
      <div><dt className="text-xs uppercase text-slate-500">Tender Type</dt><dd className="mt-1 text-slate-900">{tender.tender_type.replace(/_/g, ' ')}</dd></div>
      <div><dt className="text-xs uppercase text-slate-500">Submission Deadline</dt><dd className="mt-1 text-slate-900">{formatDate(tender.submission_deadline)}</dd></div>
      <div><dt className="text-xs uppercase text-slate-500">Status</dt><dd className="mt-1"><TenderStatusBadge status={tender.status} /></dd></div>
      <div><dt className="text-xs uppercase text-slate-500">Created By</dt><dd className="mt-1 text-slate-900">{tender.created_by || '—'}</dd></div>
      <div><dt className="text-xs uppercase text-slate-500">Created At</dt><dd className="mt-1 text-slate-900">{formatDate(tender.created_at)}</dd></div>
      <div className="sm:col-span-2"><dt className="text-xs uppercase text-slate-500">Description</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{tender.description || 'No description provided.'}</dd></div>
    </dl></Card>
    <Card title="Requirements" subtitle="Requirement extraction is planned for Cycle 4."><p className="text-sm text-slate-600">No requirements extracted yet.</p></Card>
    <div className="grid gap-6 md:grid-cols-3"><Card title="Documents"><p className="text-sm text-slate-500">Available in Cycle 4.</p></Card><Card title="Bids"><p className="text-sm text-slate-500">Available in a later cycle.</p></Card><Card title="Verification"><p className="text-sm text-slate-500">Available in a later cycle.</p></Card></div>
  </div>;
};

export default TenderDetailsPage;
