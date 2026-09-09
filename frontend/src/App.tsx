import React from 'react';
import { BrowserRouter, Routes, Route } from './react_router_dom_shim';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TendersPage from './pages/TendersPage';
import TenderDetailPage from './pages/TenderDetailPage';
import BidDetailPage from './pages/BidDetailPage';
import VerificationPage from './pages/VerificationPage';
import EvidencePage from './pages/EvidencePage';
import DecisionPage from './pages/DecisionPage';
import AuditPage from './pages/AuditPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tenders" element={<TendersPage />} />
        <Route path="/tenders/:id" element={<TenderDetailPage />} />
        <Route path="/bids/:id" element={<BidDetailPage />} />
        <Route path="/bids/:id/verification" element={<VerificationPage />} />
        <Route path="/bids/:id/evidence" element={<EvidencePage />} />
        <Route path="/bids/:id/decision" element={<DecisionPage />} />
        <Route path="/bids/:id/audit" element={<AuditPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
