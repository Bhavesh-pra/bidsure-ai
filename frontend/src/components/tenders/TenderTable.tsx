import React from 'react';
import { Link } from 'react-router-dom';
import type { Tender } from '../../types/tender';
import { TenderCategoryBadge } from './TenderCategoryBadge';
import { TenderStatusBadge } from './TenderStatusBadge';
import { TenderCard } from './TenderCard';

const formatDeadline = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export const TenderTable: React.FC<{ tenders: Tender[] }> = ({ tenders }) => (
  <>
  <div className="space-y-3 md:hidden">
    {tenders.map((tender) => <TenderCard key={tender.id} tender={tender} />)}
  </div>
  <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
    <table className="w-full min-w-[720px] text-left text-sm text-slate-700">
      <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
        <tr>
          <th className="px-4 py-3">Tender</th>
          <th className="px-4 py-3">Title</th>
          <th className="px-4 py-3">Organization</th>
          <th className="px-4 py-3">Category</th>
          <th className="px-4 py-3">Deadline</th>
          <th className="px-4 py-3">Status</th>
          <th className="px-4 py-3">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200 bg-white">
        {tenders.map((tender) => (
          <tr key={tender.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">{tender.tender_number}</td>
            <td className="px-4 py-3">{tender.title}</td>
            <td className="px-4 py-3">{tender.organization || tender.entity || '—'}</td>
            <td className="px-4 py-3"><TenderCategoryBadge category={tender.category} /></td>
            <td className="whitespace-nowrap px-4 py-3">{formatDeadline(tender.submission_deadline)}</td>
            <td className="px-4 py-3"><TenderStatusBadge status={tender.status} /></td>
            <td className="px-4 py-3"><Link className="font-medium text-indigo-600 hover:text-indigo-800" to={`/tenders/${tender.id}`}>View</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  </>
);
