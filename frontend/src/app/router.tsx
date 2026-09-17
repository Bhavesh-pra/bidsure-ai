import { createBrowserRouter, Navigate } from "react-router-dom";
import { OfficerLayout, BidderLayout, AuthLayout } from "@/components/layout";
import { LoginPage } from "@/features/auth/login-page";
import { RegisterPage } from "@/features/auth/register-page";
import { ProfilePage } from "@/features/auth/profile-page";

import { OfficerDashboardPage } from "@/features/dashboard/officer-dashboard-page";
import { BidderDashboardPage } from "@/features/dashboard/bidder-dashboard-page";

import { OfficerTendersPage } from "@/features/tenders/officer-tenders-page";
import { OfficerTenderDetailsPage } from "@/features/tenders/officer-tender-details-page";
import { BidderTendersPage } from "@/features/tenders/bidder-tenders-page";

import { RequirementsPage } from "@/features/requirements/requirements-page";
import { OfficerBidsPage } from "@/features/bids/officer-bids-page";
import { OfficerBidDetailsPage } from "@/features/bids/officer-bid-details-page";
import { BidderBidsPage } from "@/features/bids/bidder-bids-page";

import { DocumentsPage } from "@/features/documents/documents-page";
import { EvidencePage } from "@/features/evidence/evidence-page";
import { VerificationPage } from "@/features/verification/verification-page";
import { CompliancePage } from "@/features/compliance/compliance-page";
import { FindingsPage } from "@/features/findings/findings-page";
import { DecisionPage } from "@/features/decisions/decision-page";
import { ClarificationsPage } from "@/features/clarifications/clarifications-page";
import { ReportsPage } from "@/features/reports/reports-page";
import { AuditPage } from "@/features/audit/audit-page";
import { SettingsPage } from "@/features/settings/settings-page";

import { HealthPage } from "@/features/health/health-page";
import { ErrorTestPage } from "@/features/health/error-test-page";
import { LandingPage } from "@/features/landing/landing-page";

export const router = createBrowserRouter([
  {
    path: "/health-ui",
    element: <HealthPage />,
  },
  // Phase 02 — Error integration test page
  {
    path: "/error-test",
    element: <ErrorTestPage />,
  },
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { index: true, element: <Navigate to="/auth/login" replace /> },
    ],
  },
  {
    path: "/officer",
    element: <OfficerLayout />,
    children: [
      { path: "dashboard", element: <OfficerDashboardPage /> },
      { path: "tenders", element: <OfficerTendersPage /> },
      { path: "tenders/:id", element: <OfficerTenderDetailsPage /> },
      { path: "tenders/:id/requirements", element: <RequirementsPage /> },
      { path: "bids", element: <OfficerBidsPage /> },
      { path: "bids/:id", element: <OfficerBidDetailsPage /> },
      { path: "bids/:id/compliance", element: <CompliancePage /> },
      { path: "bids/:id/evidence", element: <EvidencePage /> },
      { path: "bids/:id/findings", element: <FindingsPage /> },
      { path: "bids/:id/decision", element: <DecisionPage /> },
      { path: "bids/:id/audit", element: <AuditPage /> },
      { path: "verification", element: <VerificationPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { index: true, element: <Navigate to="/officer/dashboard" replace /> },
    ],
  },
  {
    path: "/bidder",
    element: <BidderLayout />,
    children: [
      { path: "dashboard", element: <BidderDashboardPage /> },
      { path: "tenders", element: <BidderTendersPage /> },
      { path: "tenders/:id", element: <BidderTendersPage /> },
      { path: "bids", element: <BidderBidsPage /> },
      { path: "bids/:id", element: <BidderBidsPage /> },
      { path: "bids/:id/documents", element: <DocumentsPage /> },
      { path: "bids/:id/verification", element: <VerificationPage /> },
      { path: "clarifications", element: <ClarificationsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
      { index: true, element: <Navigate to="/bidder/dashboard" replace /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/officer/dashboard" replace />,
  },
]);
