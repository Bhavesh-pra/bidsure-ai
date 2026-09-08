import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import TendersPage from './pages/Tenders';
import TenderDetailsPage from './pages/TenderDetails';
import BidDetailsPage from './pages/BidDetails';
import BidVerificationPage from './pages/BidVerification';
import BidEvidencePage from './pages/BidEvidence';
import BidDecisionPage from './pages/BidDecision';
import BidAuditPage from './pages/BidAudit';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tenders" element={<TendersPage />} />
          <Route path="/tenders/:id" element={<TenderDetailsPage />} />
          <Route path="/bids" element={<BidDetailsPage />} />
          <Route path="/bids/:id" element={<BidDetailsPage />} />
          <Route path="/bids/:id/verification" element={<BidVerificationPage />} />
          <Route path="/bids/:id/evidence" element={<BidEvidencePage />} />
          <Route path="/bids/:id/decision" element={<BidDecisionPage />} />
          <Route path="/bids/:id/audit" element={<BidAuditPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
