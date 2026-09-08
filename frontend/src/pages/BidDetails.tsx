import React from 'react';
import { Card } from '../components/ui/Card';
import { useParams } from 'react-router-dom';

export const BidDetailsPage: React.FC = () => {
  const { id } = useParams();
  return (
    <Card title={`Bid ${id ?? ''}`} subtitle="Bid details and metadata">
      <p className="text-sm text-slate-600">Bid details placeholder for {id}.</p>
    </Card>
  );
};

export default BidDetailsPage;
