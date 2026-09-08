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
import type { Document, Requirement } from '../types';
import { TenderDocumentUpload, ProcessingStatus, RequirementTable } from '../components/tenders';
import { RequirementRuleRow, RuleDetailsCard } from '../components/tenders';
import type { ComplianceRule } from '../types/rule';

const formatDate = (value?: string) => value ? new Date(value).toLocaleString() : '—';
const errorMessage = (error: unknown) => error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to load tender details.';

export const TenderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tender, setTender] = useState<Tender>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleError, setRuleError] = useState<string>();
  const [selectedRule, setSelectedRule] = useState<ComplianceRule>();
  const loadExtractionData = () => { if (!id) return; setDataLoading(true); Promise.all([tenderService.getDocuments(id), tenderService.getRequirements(id), tenderService.getRules(id)]).then(([documentsResponse, requirementsResponse, rulesResponse]) => { setDocuments(documentsResponse.data); setRequirements(requirementsResponse.data.requirements); setRules(rulesResponse.data.rules); }).catch(() => undefined).finally(() => setDataLoading(false)); };
  const generateRules = async () => { if (!id) return; setRulesLoading(true); setRuleError(undefined); try { const response = await tenderService.generateRules(id); setRules(response.data.rules); } catch (requestError) { setRuleError(requestError && typeof requestError === 'object' && 'message' in requestError ? String(requestError.message) : 'Unable to generate rules.'); } finally { setRulesLoading(false); } };
  useEffect(() => { if (!id) return; setLoading(true); void tenderService.getTender(id).then((response) => { setTender(response.data); loadExtractionData(); }).catch((requestError) => setError(errorMessage(requestError))).finally(() => setLoading(false)); }, [id]);
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
    <Card title="Tender Documents" subtitle="Upload a text-based PDF tender notice for extraction"><TenderDocumentUpload tenderId={tender.id} onUploaded={loadExtractionData} />{documents.length > 0 && <div className="mt-5 divide-y divide-slate-200 rounded-lg border border-slate-200">{documents.map((document) => <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"><span className="font-medium text-slate-800">{document.original_filename}</span><span className="text-slate-500">{document.page_count ? `${document.page_count} pages` : ''}</span><ProcessingStatus status={document.processing_status || 'UPLOADED'} /></div>)}</div>}</Card>
    <Card title="Extracted Requirements" subtitle="These are tender requirements, not bidder compliance results.">{dataLoading ? <Loading message="Loading extracted requirements..." /> : requirements.length ? <RequirementTable tenderId={tender.id} requirements={requirements} /> : <p className="text-sm text-slate-600">No requirements extracted yet.</p>}</Card>
    <Card title="Compliance Rules" subtitle="Deterministic rules generated from the extracted requirements" action={<Button onClick={() => void generateRules()} isLoading={rulesLoading} disabled={!requirements.length}>{rules.length ? 'Regenerate Rules' : 'Generate Rules'}</Button>}>
      {ruleError && <p role="alert" className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{ruleError}</p>}
      {!rules.length ? <p className="text-sm text-slate-600">No rules configured yet.</p> : <div className="space-y-2">{requirements.map((requirement) => <RequirementRuleRow key={requirement.id} requirement={requirement} rule={rules.find((rule) => rule.requirement_id === requirement.id)} onSelect={() => { const rule = rules.find((item) => item.requirement_id === requirement.id); if (rule) setSelectedRule(rule); }} />)}</div>}
      {selectedRule && <div className="mt-4"><RuleDetailsCard rule={selectedRule} /></div>}
    </Card>
    <div className="grid gap-6 md:grid-cols-2"><Card title="Bids"><p className="text-sm text-slate-500">Available in a later cycle.</p></Card><Card title="Verification"><p className="text-sm text-slate-500">Available in a later cycle.</p></Card></div>
  </div>;
};

export default TenderDetailsPage;
