import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { TenderForm } from '../components/tenders/TenderForm';
import { tenderService } from '../services/tenderService';
import type { CreateTenderPayload } from '../types/tender';
import { FilePlus } from 'lucide-react';

const messageFor = (error: unknown) =>
  error && typeof error === 'object' && 'message' in error
    ? String(error.message)
    : 'Unable to create tender. Please try again.';

export const CreateTenderPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const create = async (payload: CreateTenderPayload) => {
    setIsSubmitting(true);
    setError(undefined);
    try {
      const response = await tenderService.createTender(payload);
      navigate(`/tenders/${response.data.id}`);
    } catch (requestError) {
      setError(messageFor(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Tenders', href: '/tenders' }, { label: 'Create New Tender' }]} />

      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#0F766E]">
            <FilePlus className="h-4 w-4" />
            <span>Specification Authoring</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight mt-0.5">Create New Tender Notice</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enter tender metadata and submission timeline to initiate automated compliance extraction.
          </p>
        </div>

        <Link to="/tenders">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      </div>

      <Card title="Tender Metadata & Constraints" subtitle="Provide statutory organization details and submission deadlines">
        <TenderForm onSubmit={create} isSubmitting={isSubmitting} serverError={error} />
      </Card>
    </div>
  );
};

export default CreateTenderPage;
