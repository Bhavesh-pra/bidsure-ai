import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import TendersPage from './pages/Tenders';
import TenderDetailsPage from './pages/TenderDetails';
import CreateTenderPage from './pages/CreateTender';
import RequirementDetailsPage from './pages/RequirementDetails';
import ProtectedRoute from './components/auth/ProtectedRoute';
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
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/tenders" element={<ProtectedRoute><TendersPage /></ProtectedRoute>} />
          <Route path="/tenders/new" element={<ProtectedRoute><CreateTenderPage /></ProtectedRoute>} />
          <Route path="/tenders/:id" element={<ProtectedRoute><TenderDetailsPage /></ProtectedRoute>} />
          <Route path="/tenders/:id/requirements/:requirementId" element={<ProtectedRoute><RequirementDetailsPage /></ProtectedRoute>} />
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
