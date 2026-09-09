import React from 'react';
import { Link } from 'react-router-dom';
import type { Tender } from '../../types/tender';
import { TenderCategoryBadge } from './TenderCategoryBadge';
import { TenderStatusBadge } from './TenderStatusBadge';
import { TenderCard } from './TenderCard';
import { Button } from '../ui/Button';

const formatDeadline = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const TenderTable: React.FC<{ tenders: Tender[] }> = ({ tenders }) => (
  <>
    <div className="space-y-3 md:hidden">
      {tenders.map((tender) => (
        <TenderCard key={tender.id} tender={tender} />
      ))}
    </div>
    <div className="hidden overflow-x-auto rounded-[6px] border border-slate-200 md:block">
      <table className="w-full min-w-[720px] text-left text-xs text-slate-700">
        <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3">Tender ID</th>
            <th className="px-4 py-3">Tender Title</th>
            <th className="px-4 py-3">Organization</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Deadline</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {tenders.map((tender) => (
            <tr key={tender.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-4 py-3 font-semibold text-[#0F2747]">
                <Link to={`/tenders/${tender.id}`} className="hover:underline">
                  {tender.tender_number}
                </Link>
              </td>
              <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate" title={tender.title}>
                {tender.title}
              </td>
              <td className="px-4 py-3 text-slate-600">{tender.organization || tender.entity || '—'}</td>
              <td className="px-4 py-3">
                <TenderCategoryBadge category={tender.category} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                {formatDeadline(tender.submission_deadline)}
              </td>
              <td className="px-4 py-3">
                <TenderStatusBadge status={tender.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link to={`/tenders/${tender.id}`}>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);
