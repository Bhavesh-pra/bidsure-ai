import React from 'react';
import { Card } from '../components/ui/Card';
import { useParams } from 'react-router-dom';

export const BidEvidencePage: React.FC = () => {
  const { id } = useParams();
  return (
    <Card title={`Bid ${id ?? ''} — Evidence`} subtitle="Evidence viewer">
      <p className="text-sm text-slate-600">Evidence placeholder for bid {id}.</p>
    </Card>
  );
};

export default BidEvidencePage;
