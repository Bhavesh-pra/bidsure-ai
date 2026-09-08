import React from 'react';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => (
  <Card title="BidSure Procurement Dashboard" subtitle="Overview of active tenders, bids, and verification status">
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Cycle 2 Dashboard placeholder.</p>
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

export default DashboardPage;
