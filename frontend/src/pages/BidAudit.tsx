import React from 'react';
import { Card } from '../components/ui/Card';
import { useParams } from 'react-router-dom';

export const BidAuditPage: React.FC = () => {
  const { id } = useParams();
  return (
    <Card title={`Bid ${id ?? ''} — Audit`} subtitle="Audit trail">
      <p className="text-sm text-slate-600">Audit placeholder for bid {id}.</p>
    </Card>
  );
};

export default BidAuditPage;
