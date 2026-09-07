import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Card } from './components/ui/Card';
import { StatusBadge } from './components/ui/StatusBadge';
import { Button } from './components/ui/Button';

const DashboardPlaceholder: React.FC = () => (
  <Card title="BidSure Procurement Dashboard" subtitle="Overview of active tenders, bids, and verification status">
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Cycle 1 Frontend Skeleton & UI Component Primitives initialized cleanly.
      </p>
      <div className="flex flex-wrap gap-3">
        <StatusBadge status="VERIFIED_PASS" />
        <StatusBadge status="REVIEW_REQUIRED" />
        <StatusBadge status="VERIFIED_FAIL" />
        <StatusBadge status="UNABLE_TO_VERIFY" />
      </div>
      <div className="pt-2">
        <Button variant="primary">Create Tender</Button>
      </div>
    </div>
  </Card>
);

const GenericPlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <Card title={title} subtitle="Subsystem page initialized under Cycle 1 contract">
    <p className="text-sm text-slate-500">Component skeleton ready for Cycle 2 integration.</p>
  </Card>
);

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/tenders" element={<GenericPlaceholder title="Tender Management & Extraction" />} />
          <Route path="/bids" element={<GenericPlaceholder title="Bid Submissions & Evidence Viewer" />} />
          <Route path="/verifications" element={<GenericPlaceholder title="Verification & Compliance Engine" />} />
          <Route path="/decision" element={<GenericPlaceholder title="Procurement Officer Decision Portal" />} />
          <Route path="/audit" element={<GenericPlaceholder title="Immutable Audit Trail Timeline" />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
