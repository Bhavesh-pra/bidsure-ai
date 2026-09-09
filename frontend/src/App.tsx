import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import DashboardPage from './pages/Dashboard';
import LoginPage from './pages/Login';
import TendersPage from './pages/Tenders';
import TenderDetailsPage from './pages/TenderDetails';
import CreateTenderPage from './pages/CreateTender';
import RequirementDetailsPage from './pages/RequirementDetails';
import ProtectedRoute from './components/auth/ProtectedRoute';
import BidsPage from './pages/Bids';
import BidDetailsPage from './pages/BidDetails';
import BidVerificationPage from './pages/BidVerification';
import BidEvidencePage from './pages/BidEvidence';
import BidDecisionPage from './pages/BidDecision';
import BidAuditPage from './pages/BidAudit';
import BiddersPage from './pages/Bidders';
import CreateBidPage from './pages/CreateBid';
import BidderDashboard from './pages/BidderDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          {/* Bidder Dashboard */}
          <Route path="/bidder/dashboard" element={<ProtectedRoute allowedActorTypes={['BIDDER', 'ADMIN']}><BidderDashboard /></ProtectedRoute>} />

          {/* Tenders */}
          <Route path="/tenders" element={<ProtectedRoute><TendersPage /></ProtectedRoute>} />
          <Route path="/tenders/new" element={<ProtectedRoute><CreateTenderPage /></ProtectedRoute>} />
          <Route path="/tenders/:id" element={<ProtectedRoute><TenderDetailsPage /></ProtectedRoute>} />
          <Route path="/tenders/:id/bids/new" element={<ProtectedRoute><CreateBidPage /></ProtectedRoute>} />
          <Route path="/tenders/:tenderId/bids/new" element={<ProtectedRoute><CreateBidPage /></ProtectedRoute>} />
          <Route path="/tenders/:id/requirements/:requirementId" element={<ProtectedRoute><RequirementDetailsPage /></ProtectedRoute>} />

          {/* Bidders */}
          <Route path="/bidders" element={<ProtectedRoute><BiddersPage /></ProtectedRoute>} />

          {/* Bids List (Sidebar 'Bids & Evidence') */}
          <Route path="/bids" element={<ProtectedRoute><BidsPage /></ProtectedRoute>} />

          {/* Bid Details (Single Bid View & Cycle 7 Document Ingestion) */}
          <Route path="/bids/:id" element={<ProtectedRoute><BidDetailsPage /></ProtectedRoute>} />
          <Route path="/tenders/:tenderId/bids/:bidId" element={<ProtectedRoute><BidDetailsPage /></ProtectedRoute>} />
          <Route path="/tenders/:tenderId/bids/:id" element={<ProtectedRoute><BidDetailsPage /></ProtectedRoute>} />

          {/* Bid Sub-workflows */}
          <Route path="/bids/:id/verification" element={<ProtectedRoute><BidVerificationPage /></ProtectedRoute>} />
          <Route path="/bids/:id/evidence" element={<ProtectedRoute><BidEvidencePage /></ProtectedRoute>} />
          <Route path="/bids/:id/decision" element={<ProtectedRoute><BidDecisionPage /></ProtectedRoute>} />
          <Route path="/bids/:id/audit" element={<ProtectedRoute><BidAuditPage /></ProtectedRoute>} />
          <Route path="/tenders/:tenderId/bids/:id/verification" element={<ProtectedRoute><BidVerificationPage /></ProtectedRoute>} />
          <Route path="/tenders/:tenderId/bids/:id/evidence" element={<ProtectedRoute><BidEvidencePage /></ProtectedRoute>} />
          <Route path="/tenders/:tenderId/bids/:id/decision" element={<ProtectedRoute><BidDecisionPage /></ProtectedRoute>} />
          <Route path="/tenders/:tenderId/bids/:id/audit" element={<ProtectedRoute><BidAuditPage /></ProtectedRoute>} />

          {/* Sidebar Top-level Category Fallbacks */}
          <Route path="/verifications" element={<Navigate to="/bids" replace />} />
          <Route path="/decision" element={<Navigate to="/bids" replace />} />
          <Route path="/audit" element={<Navigate to="/bids" replace />} />
        </Routes>
      </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}
