import React from 'react';
import Input from '../ui/Input';
import { Button } from '../ui/Button';
import type { Bidder } from '../../types';
export const BidderForm: React.FC<{ onSubmit: (value: Omit<Bidder, 'id'>) => void; loading?: boolean }> = ({ onSubmit, loading }) => {
  const [value, setValue] = React.useState<Omit<Bidder, 'id'>>({ legal_name: '', pan: '', gstin: '', udyam_number: '', organization_type: '' });
  const update = (key: keyof typeof value) => (e: React.ChangeEvent<HTMLInputElement>) => setValue({ ...value, [key]: e.target.value });
  return <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(value); }}><Input required label="Legal Name" value={value.legal_name} onChange={update('legal_name')} /><Input label="PAN" value={value.pan} onChange={update('pan')} pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" title="PAN must look like ABCDE1234F" /><Input label="GSTIN" value={value.gstin} onChange={update('gstin')} pattern="[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][0-9A-Za-z]Z[0-9A-Za-z]" title="Enter a valid GSTIN" /><Input label="Udyam Number" value={value.udyam_number} onChange={update('udyam_number')} /><Input label="Organization Type" value={value.organization_type} onChange={update('organization_type')} /><Button type="submit" isLoading={loading}>Create Bidder</Button></form>;
};
