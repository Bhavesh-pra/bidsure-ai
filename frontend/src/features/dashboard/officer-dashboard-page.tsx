import React from "react";
import { Link } from "react-router-dom";
import { Activity, ShieldCheck, FileSpreadsheet, FileCheck2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { healthService } from "@/services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const OfficerDashboardPage: React.FC = () => {
  const { data: health, isLoading, isError } = useQuery({
    queryKey: ["backend-health"],
    queryFn: healthService.getHealth,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Procurement Officer Console</h1>
        <p className="text-sm text-slate-500 mt-1">
          Autonomous public procurement compliance verification & deterministic bid evaluation.
        </p>
      </div>

      {/* Backend Integration Test Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 font-semibold">
              <Activity className="w-5 h-5 text-blue-600" />
              <span>Backend Integration Health Status</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-white border border-blue-200 text-blue-700">
              API v1
            </span>
          </div>
          <CardDescription>
            Live connection between the new Vite/React frontend and the new TypeScript backend (/api/v1/health).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-slate-600">Testing connection to backend...</p>
          )}
          {health && (
            <div className="bg-white p-4 rounded-md border border-blue-200 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Service Name:</span>
                <span className="font-mono font-bold text-slate-900">{health.data.service}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {health.data.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Architecture Contract:</span>
                <span className="text-xs text-slate-600 font-mono">Clean Architecture + TanStack Query</span>
              </div>
            </div>
          )}
          {isError && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-sm text-amber-800">
              <p className="font-semibold">Backend server not detected on port 3000.</p>
              <p className="text-xs mt-1">Run `npm run dev` in the `backend/` directory to enable live API communication.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Modules Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <CardTitle>Tenders & Specs</CardTitle>
            <CardDescription>Manage procurement tenders and strict requirement clauses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/officer/tenders">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>View Tenders</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <CardTitle>Bids & Submissions</CardTitle>
            <CardDescription>Evaluate submitted vendor documents and extracted evidence.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/officer/bids">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>View Submissions</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <CardTitle>Verification Engine</CardTitle>
            <CardDescription>Cross-check GSTIN, PAN, Udyam, and OEM authorization authenticity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/officer/verification">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Verification Pipeline</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Evidence Chain Provenance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Evidence-First Provenance Architecture</CardTitle>
          <CardDescription>
            Traceable lineage from tender version to officer sign-off and immutable audit logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700">
            {["Tender", "Requirement", "BidDocument", "ExtractedEvidence", "Verification", "ComplianceRule", "Finding", "RiskAssessment", "Recommendation", "OfficerDecision", "AuditEvent"].map((step, idx, arr) => (
              <React.Fragment key={step}>
                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-slate-800 font-mono">
                  {step}
                </span>
                {idx < arr.length - 1 && <span className="text-slate-400 font-bold">→</span>}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
