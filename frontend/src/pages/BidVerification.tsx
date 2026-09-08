import React from 'react';
import { Card } from '../components/ui/Card';
import { useParams } from 'react-router-dom';

export const BidVerificationPage: React.FC = () => {
  const { id } = useParams();
  return (
    <Card title={`Bid ${id ?? ''} — Verification`} subtitle="Verification workflow">
      <p className="text-sm text-slate-600">Verification placeholder for bid {id}.</p>
    </Card>
  );
};

export default BidVerificationPage;
