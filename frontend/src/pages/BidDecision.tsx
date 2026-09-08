import React from 'react';
import { Card } from '../components/ui/Card';
import { useParams } from 'react-router-dom';

export const BidDecisionPage: React.FC = () => {
  const { id } = useParams();
  return (
    <Card title={`Bid ${id ?? ''} — Decision`} subtitle="Officer decision">
      <p className="text-sm text-slate-600">Decision placeholder for bid {id}.</p>
    </Card>
  );
};

export default BidDecisionPage;
