import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { RequirementDetailCard } from '../components/tenders/RequirementDetailCard';
import { tenderService } from '../services/tenderService';
import type { Requirement } from '../types';

export const RequirementDetailsPage: React.FC = () => {
  const { id, requirementId } = useParams<{ id: string; requirementId: string }>();
  const [requirement, setRequirement] = useState<Requirement>(); const [loading, setLoading] = useState(true); const [error, setError] = useState<string>();
  useEffect(() => { if (!id || !requirementId) return; void tenderService.getRequirements(id).then((response) => { const match = response.data.requirements.find((item) => item.id === requirementId); if (!match) throw new Error('Requirement not found.'); setRequirement(match); }).catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Unable to load requirement.')).finally(() => setLoading(false)); }, [id, requirementId]);
  if (loading) return <Card title="Requirement details"><Loading /></Card>;
  if (error || !requirement) return <Card title="Requirement details"><ErrorState message={error || 'Requirement not found.'} /><Link to={`/tenders/${id}`}><Button variant="outline">Back to Tender</Button></Link></Card>;
  return <div className="space-y-4"><div><Link className="text-sm text-indigo-600" to={`/tenders/${id}`}>← Back to Tender</Link></div><RequirementDetailCard requirement={requirement} /></div>;
};

export default RequirementDetailsPage;
