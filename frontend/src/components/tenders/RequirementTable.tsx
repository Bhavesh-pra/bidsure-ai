import React from 'react';
import type { Requirement } from '../../types';
import { RequirementBadge } from './RequirementBadge';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export const RequirementTable: React.FC<{ tenderId: string; requirements: Requirement[] }> = ({ tenderId, requirements }) => (
  <div className="overflow-x-auto rounded-[6px] border border-slate-200">
    <table className="w-full min-w-[680px] text-left text-xs">
      <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
        <tr>
          <th className="px-4 py-3">Requirement Title</th>
          <th className="px-4 py-3">Category</th>
          <th className="px-4 py-3">Mandatory</th>
          <th className="px-4 py-3">Document Source</th>
          <th className="px-4 py-3 text-right">Extraction Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {requirements.map((requirement) => (
          <tr key={requirement.id} className="hover:bg-slate-50/80 transition-colors">
            <td className="px-4 py-3">
              <Link
                className="font-semibold text-[#0F2747] hover:underline hover:text-[#0F766E]"
                to={`/tenders/${tenderId}/requirements/${requirement.id}`}
              >
                {requirement.title}
              </Link>
              {requirement.description && (
                <p className="mt-0.5 max-w-lg text-[11px] text-slate-500 line-clamp-2">{requirement.description}</p>
              )}
            </td>
            <td className="px-4 py-3 font-medium text-slate-700">
              {requirement.category.replace(/_/g, ' ')}
            </td>
            <td className="px-4 py-3">
              <RequirementBadge requirement={requirement} />
            </td>
            <td className="px-4 py-3">
              {requirement.source_page ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
                  <FileText className="h-3 w-3 text-slate-400 mr-1" />
                  <span>Page {requirement.source_page}</span>
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </td>
            <td className="px-4 py-3 text-right">
              <span className="inline-flex items-center rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-semibold text-[#15803D] border border-[#A7F3D0]">
                ✓ Extracted
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
