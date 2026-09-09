import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Link, useParams } from 'react-router-dom';
import { TenderCategoryBadge } from '../components/tenders/TenderCategoryBadge';
import { TenderStatusBadge } from '../components/tenders/TenderStatusBadge';
import { tenderService } from '../services/tenderService';
import type { Tender } from '../types/tender';
import type { Document, Requirement } from '../types';
import { TenderDocumentUpload, ProcessingStatus, RequirementTable } from '../components/tenders';
import { RequirementRuleRow, RuleDetailsCard } from '../components/tenders';
import type { ComplianceRule } from '../types/rule';
import { bidService } from '../services/bidService';
import type { Bid } from '../types';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString('en-IN') : '—');
const errorMessage = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to load tender details.';

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
  const [bids, setBids] = useState<Bid[]>([]);

  const loadExtractionData = () => {
    if (!id) return;
    setDataLoading(true);
    Promise.all([
      tenderService.getDocuments(id),
      tenderService.getRequirements(id),
      tenderService.getRules(id),
      bidService.list(id),
    ])
      .then(([documentsResponse, requirementsResponse, rulesResponse, bidsResponse]) => {
        setDocuments(documentsResponse.data);
        setRequirements(requirementsResponse.data.requirements);
        setRules(rulesResponse.data.rules);
        setBids(bidsResponse.data.bids);
      })
      .catch(() => undefined)
      .finally(() => setDataLoading(false));
  };

  const generateRules = async () => {
    if (!id) return;
    setRulesLoading(true);
    setRuleError(undefined);
    try {
      const response = await tenderService.generateRules(id);
      setRules(response.data.rules);
    } catch (requestError) {
      setRuleError(
        requestError && typeof requestError === 'object' && 'message' in requestError
          ? String(requestError.message)
          : 'Unable to generate rules.'
      );
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void tenderService
      .getTender(id)
      .then((response) => {
        setTender(response.data);
        loadExtractionData();
      })
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Card title="Tender Details"><Loading message="Loading tender details and extracted requirements..." /></Card>;
  if (error || !tender)
    return (
      <Card title="Tender Details">
        <ErrorState title="Unable to load tender" message={error || 'Tender record not found.'} />
        <div className="pt-4">
          <Link to="/tenders">
            <Button variant="outline">Back to Tenders</Button>
          </Link>
        </div>
      </Card>
    );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link to="/tenders" className="hover:text-slate-800 flex items-center transition-colors">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Tenders
            </Link>
            <span>/</span>
            <span className="font-mono text-[#0F2747] font-semibold">{tender.tender_number}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight mt-1">{tender.title}</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link to={`/tenders/${tender.id}/bids/new`}>
            <Button variant="primary" size="sm" className="flex items-center space-x-1">
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Bid</span>
            </Button>
          </Link>
          <Link to="/tenders">
            <Button variant="outline" size="sm">
              Back to Tenders
            </Button>
          </Link>
        </div>
      </div>

      {/* Tender Metadata Grid */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 block text-[10px]">Tender Number</span>
            <span className="font-semibold text-sm text-[#0F2747] mt-0.5 block">{tender.tender_number}</span>
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 block text-[10px]">Issuing Organization</span>
            <span className="font-medium text-slate-900 mt-0.5 block">{tender.organization || tender.entity || '—'}</span>
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 block text-[10px]">Category & Type</span>
            <div className="mt-1 flex items-center space-x-2">
              <TenderCategoryBadge category={tender.category} />
              <span className="text-slate-500">• {tender.tender_type?.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <div>
            <span className="font-bold uppercase tracking-wider text-slate-400 block text-[10px]">Submission Deadline</span>
            <span className="font-medium text-slate-900 mt-0.5 block">{formatDate(tender.submission_deadline)}</span>
          </div>
        </div>

        {tender.description && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-400 block text-[10px] mb-1">
              Tender Description
            </span>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{tender.description}</p>
          </div>
        )}
      </Card>

      {/* Tender Documents Upload Section */}
      <Card
        title="Tender Document Notice Ingestion"
        subtitle="Upload text-based tender PDF specification documents to extract compliance requirements"
      >
        <TenderDocumentUpload tenderId={tender.id} onUploaded={loadExtractionData} />
        {documents.length > 0 && (
          <div className="mt-4 divide-y divide-slate-100 rounded-[6px] border border-slate-200 bg-white">
            {documents.map((document) => (
              <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs">
                <div className="flex items-center space-x-2.5">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">{document.original_filename}</span>
                  {document.page_count ? (
                    <span className="text-slate-400 text-[11px]">({document.page_count} pages)</span>
                  ) : null}
                </div>
                <ProcessingStatus status={document.processing_status || 'UPLOADED'} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Extracted Requirements Table */}
      <Card
        title="Extracted Requirements"
        subtitle="Parsed tender specifications mapped to clause & page references"
      >
        {dataLoading ? (
          <Loading message="Loading extracted requirements..." />
        ) : requirements.length ? (
          <RequirementTable tenderId={tender.id} requirements={requirements} />
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">No requirements extracted yet. Upload a tender document above.</p>
        )}
      </Card>

      {/* Deterministic Compliance Rules */}
      <Card
        title="Compliance Rules Configuration"
        subtitle="Deterministic rules generated from extracted requirements for automated verification"
        action={
          <Button
            onClick={() => void generateRules()}
            isLoading={rulesLoading}
            disabled={!requirements.length}
            size="sm"
            variant="secondary"
            className="flex items-center space-x-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{rules.length ? 'Regenerate Rules' : 'Generate Rules'}</span>
          </Button>
        }
      >
        {ruleError && (
          <div className="mb-3 rounded-[6px] border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {ruleError}
          </div>
        )}
        {!rules.length ? (
          <p className="text-xs text-slate-500 py-3">No compliance rules configured yet. Click "Generate Rules" to create rules from requirements.</p>
        ) : (
          <div className="space-y-2">
            {requirements.map((requirement) => (
              <RequirementRuleRow
                key={requirement.id}
                requirement={requirement}
                rule={rules.find((rule) => rule.requirement_id === requirement.id)}
                onSelect={() => {
                  const rule = rules.find((item) => item.requirement_id === requirement.id);
                  if (rule) setSelectedRule(rule);
                }}
              />
            ))}
          </div>
        )}
        {selectedRule && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <RuleDetailsCard rule={selectedRule} />
          </div>
        )}
      </Card>

      {/* Submitted Bids for this Tender */}
      <Card
        title={`Submitted Bids (${bids.length})`}
        subtitle="Review bidder submissions and verification results for this tender"
        action={
          <Link to={`/tenders/${tender.id}/bids/new`}>
            <Button size="sm" variant="outline">
              + Add Bid
            </Button>
          </Link>
        }
      >
        {bids.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bids.map((bid) => (
              <Link
                key={bid.id}
                to={`/bids/${bid.id}`}
                className="block p-3.5 rounded-[6px] border border-slate-200 bg-white hover:border-[#0F766E] hover:shadow-2xs transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#0F2747]">
                    {bid.bidder?.legal_name || bid.bidder_name || `Bidder ID: ${bid.bidder_id}`}
                  </span>
                  <StatusBadge status={bid.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Quoted: <strong className="text-slate-900 font-semibold">₹{Number(bid.quoted_amount).toLocaleString('en-IN')}</strong></span>
                  <span className="text-[11px] text-[#0F766E] font-medium">Manage Documents →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">No bids submitted yet for this tender.</p>
        )}
      </Card>
    </div>
  );
};

export default TenderDetailsPage;
