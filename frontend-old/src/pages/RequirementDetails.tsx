import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { RequirementDetailCard } from '../components/tenders/RequirementDetailCard';
import { tenderService } from '../services/tenderService';
import type { Requirement } from '../types';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const RequirementDetailsPage: React.FC = () => {
  const { id, requirementId } = useParams<{ id: string; requirementId: string }>();
  const [requirement, setRequirement] = useState<Requirement>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!id || !requirementId) return;
    void tenderService
      .getRequirements(id)
      .then((response) => {
        const match = response.data.requirements.find((item) => item.id === requirementId);
        if (!match) throw new Error('Requirement not found.');
        setRequirement(match);
      })
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : 'Unable to load requirement.')
      )
      .finally(() => setLoading(false));
  }, [id, requirementId]);

  if (loading) {
    return (
      <Card title="Requirement Details">
        <Loading message="Loading requirement clause specification..." />
      </Card>
    );
  }

  if (error || !requirement) {
    return (
      <Card title="Requirement Details">
        <ErrorState message={error || 'Requirement not found.'} />
        <div className="pt-3 px-6 pb-6">
          <Link to={id ? `/tenders/${id}` : '/tenders'}>
            <Button variant="outline" size="sm">
              Back to Tender
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Tenders', href: '/tenders' },
          { label: `Tender #${id}`, href: `/tenders/${id}` },
          { label: `Requirement: ${requirement.title || requirement.id}` },
        ]}
      />

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F766E]">
            <CheckCircle2 className="h-4 w-4" />
            <span>Tender Clause Rule</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight mt-0.5">
            {requirement.title || 'Extracted Clause Specification'}
          </h1>
        </div>

        <Link to={`/tenders/${id}`}>
          <Button variant="outline" size="sm" className="flex items-center space-x-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Tender</span>
          </Button>
        </Link>
      </div>

      <RequirementDetailCard requirement={requirement} />
    </div>
  );
};

export default RequirementDetailsPage;
