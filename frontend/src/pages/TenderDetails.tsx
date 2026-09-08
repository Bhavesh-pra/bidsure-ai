import React from 'react';
import { Card } from '../components/ui/Card';
import { useParams } from 'react-router-dom';

export const TenderDetailsPage: React.FC = () => {
  const { id } = useParams();
  return (
    <Card title={`Tender ${id ?? ''}`} subtitle="Tender details and requirements">
      <p className="text-sm text-slate-600">Tender details placeholder for {id}.</p>
    </Card>
  );
};

export default TenderDetailsPage;
