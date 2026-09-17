import React from 'react';
import { Link } from 'react-router-dom';
import type { Tender } from '../../types/tender';
import { TenderCategoryBadge } from './TenderCategoryBadge';
import { TenderStatusBadge } from './TenderStatusBadge';

const formatDeadline = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

/** Compact tender presentation for narrow screens and dashboard summaries. */
export const TenderCard: React.FC<{ tender: Tender }> = ({ tender }) => (
  <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-500">{tender.tender_number}</p><h3 className="mt-1 truncate font-semibold text-slate-900">{tender.title}</h3></div>
      <TenderStatusBadge status={tender.status} />
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2"><TenderCategoryBadge category={tender.category} /><span className="text-xs text-slate-500">Deadline: {formatDeadline(tender.submission_deadline)}</span></div>
    <p className="mt-2 truncate text-sm text-slate-600">{tender.organization || tender.entity || 'Organization not specified'}</p>
    <Link className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800" to={`/tenders/${tender.id}`}>View tender</Link>
  </article>
);
