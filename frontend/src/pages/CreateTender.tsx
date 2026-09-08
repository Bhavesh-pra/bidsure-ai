import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TenderForm } from '../components/tenders/TenderForm';
import { tenderService } from '../services/tenderService';
import type { CreateTenderPayload } from '../types/tender';

const messageFor = (error: unknown) => error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Unable to create tender. Please try again.';
export const CreateTenderPage: React.FC = () => {
  const navigate = useNavigate(); const [isSubmitting, setIsSubmitting] = useState(false); const [error, setError] = useState<string>();
  const create = async (payload: CreateTenderPayload) => { setIsSubmitting(true); setError(undefined); try { const response = await tenderService.createTender(payload); navigate(`/tenders/${response.data.id}`); } catch (requestError) { setError(messageFor(requestError)); } finally { setIsSubmitting(false); } };
  return <Card title="Create Tender" subtitle="Enter the tender metadata to start a procurement workflow" action={<Link to="/tenders"><Button variant="outline">Cancel</Button></Link>}><TenderForm onSubmit={create} isSubmitting={isSubmitting} serverError={error} /></Card>;
};
export default CreateTenderPage;
