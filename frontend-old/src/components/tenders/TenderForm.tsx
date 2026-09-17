import React, { useState } from 'react';
import { Button } from '../ui/Button';
import type { CreateTenderPayload, TenderCategory, TenderType } from '../../types/tender';
import { TENDER_CATEGORIES, TENDER_TYPES } from '../../types/tender';
import { FormField } from './FormField';
import { SelectField } from './SelectField';
import { DateTimeField } from './DateTimeField';
import { TextareaField } from './TextareaField';

type Errors = Partial<Record<keyof CreateTenderPayload, string>>;

const initialValues: CreateTenderPayload = {
  tender_number: '', title: '', description: '', category: 'TECHNICAL', tender_type: 'OPEN', submission_deadline: '',
};

export const TenderForm: React.FC<{
  onSubmit: (values: CreateTenderPayload) => Promise<void>;
  isSubmitting?: boolean;
  serverError?: string;
}> = ({ onSubmit, isSubmitting = false, serverError }) => {
  const [values, setValues] = useState<CreateTenderPayload>(initialValues);
  const [errors, setErrors] = useState<Errors>({});

  const update = <K extends keyof CreateTenderPayload>(key: K, value: CreateTenderPayload[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!values.tender_number.trim()) next.tender_number = 'Tender number is required.';
    if (!values.title.trim()) next.title = 'Title is required.';
    if (!values.category) next.category = 'Category is required.';
    if (!values.tender_type) next.tender_type = 'Tender type is required.';
    if (!values.submission_deadline) next.submission_deadline = 'Submission deadline is required.';
    else if (Number.isNaN(new Date(values.submission_deadline).getTime())) next.submission_deadline = 'Enter a valid date and time.';
    else if (new Date(values.submission_deadline).getTime() <= Date.now()) next.submission_deadline = 'Deadline must be in the future.';
    return next;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = validate();
    if (Object.keys(next).length) { setErrors(next); return; }
    await onSubmit(values);
  };

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      {serverError && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>}
      <div className="grid gap-5 md:grid-cols-2">
        <FormField id="tender_number" label="Tender Number" required error={errors.tender_number}>
          <input id="tender_number" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" value={values.tender_number} onChange={(e) => update('tender_number', e.target.value)} placeholder="GEM/2026/B/1234567" />
        </FormField>
        <FormField id="title" label="Title" required error={errors.title}>
          <input id="title" className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" value={values.title} onChange={(e) => update('title', e.target.value)} placeholder="Supply of Industrial Equipment" />
        </FormField>
        <SelectField id="category" label="Category" required value={values.category} error={errors.category} options={TENDER_CATEGORIES.map((category) => ({ value: category, label: category.replace(/_/g, ' ') }))} onChange={(e) => update('category', e.target.value as TenderCategory)} placeholder="Select category" />
        <SelectField id="tender_type" label="Tender Type" required value={values.tender_type} error={errors.tender_type} options={TENDER_TYPES.map((type) => ({ value: type, label: type.replace(/_/g, ' ') }))} onChange={(e) => update('tender_type', e.target.value as TenderType)} placeholder="Select tender type" />
      </div>
      <TextareaField id="description" label="Description" value={values.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe the goods or services required." />
      <DateTimeField id="submission_deadline" label="Submission Deadline" required value={values.submission_deadline} onChange={(e) => update('submission_deadline', e.target.value)} error={errors.submission_deadline} />
      <div className="flex justify-end"><Button type="submit" isLoading={isSubmitting}>Create Tender</Button></div>
    </form>
  );
};
