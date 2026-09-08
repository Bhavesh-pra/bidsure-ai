import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export const EmptyTenderState: React.FC = () => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
    <h3 className="text-lg font-semibold text-slate-900">No tenders found</h3>
    <p className="mt-1 text-sm text-slate-600">Create your first tender to begin the procurement workflow.</p>
    <Link className="mt-4 inline-block" to="/tenders/new"><Button>Create Tender</Button></Link>
  </div>
);
