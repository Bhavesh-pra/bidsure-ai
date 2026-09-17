import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ShieldCheck,
  FileSpreadsheet,
  FileCheck2,
  ArrowRight,
  Scale,
  FileText,
  CheckCircle2,
  Activity,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { useTenders } from "@/hooks/use-tenders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/feedback/loading-state";

export const LandingPage: React.FC = () => {
  const { data: tendersResponse, isLoading } = useTenders({ page: 1, pageSize: 5 });
  const recentTenders = tendersResponse?.data || [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* 1. National Official Top Header Utility Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Tricolor Indicator */}
            <div className="flex h-3 w-4 rounded-xs overflow-hidden border border-slate-700">
              <span className="w-1/3 bg-[#FF9933]"></span>
              <span className="w-1/3 bg-white"></span>
              <span className="w-1/3 bg-[#138808]"></span>
            </div>
            <span className="font-semibold tracking-wide uppercase text-[11px] text-slate-200">
              Government Public Procurement Oversight System
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-[11px]">Department of Public Procurement & Evaluation</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Screen Reader Access</span>
            <span className="text-slate-700">|</span>
            <Link
              to="/health-ui"
              className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span>System Diagnostics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Official Masthead & Main Navigation */}
      <header className="bg-white border-b-2 border-blue-900 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Government Emblem Symbol / Seal */}
            <div className="w-14 h-14 rounded-md bg-blue-950 border-2 border-blue-900 flex flex-col items-center justify-center text-white shadow-xs p-1">
              <Building2 className="w-7 h-7 text-amber-400" />
              <span className="text-[7px] font-bold uppercase tracking-wider text-slate-300 mt-0.5">
                GOVT PORTAL
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-blue-950 tracking-tight leading-none uppercase">
                BidSure <span className="text-blue-800 text-lg font-bold">e-Procurement Portal</span>
              </h1>
              <p className="text-xs font-semibold text-slate-600 mt-1 uppercase tracking-wider">
                National Autonomous Procurement Compliance & Evaluation System
              </p>
              <p className="text-[11px] text-slate-500 italic">
                Operated in adherence to General Financial Rules (GFR 2017) & CVC Directives
              </p>
            </div>
          </div>

          {/* Quick Access Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/officer/dashboard">
              <Button size="sm" className="bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Officer Console</span>
              </Button>
            </Link>
            <Link to="/bidder/dashboard">
              <Button size="sm" variant="outline" className="border-blue-900 text-blue-900 hover:bg-blue-50 font-semibold text-xs gap-1.5">
                <FileCheck2 className="w-4 h-4" />
                <span>Bidder Portal</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Official Navigation Strip */}
        <nav className="bg-blue-950 text-white px-4 sm:px-8" aria-label="Portal Main Navigation">
          <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto text-xs font-semibold">
            <Link to="/" className="px-4 py-2.5 bg-blue-900 border-b-2 border-amber-400 whitespace-nowrap">
              Home
            </Link>
            <Link to="/officer/tenders" className="px-4 py-2.5 hover:bg-blue-900/80 transition-colors whitespace-nowrap">
              Tenders & Solicitations
            </Link>
            <Link to="/officer/bids" className="px-4 py-2.5 hover:bg-blue-900/80 transition-colors whitespace-nowrap">
              Vendor Submissions
            </Link>
            <Link to="/officer/verification" className="px-4 py-2.5 hover:bg-blue-900/80 transition-colors whitespace-nowrap">
              Verification Engine
            </Link>
            <Link to="/officer/audit" className="px-4 py-2.5 hover:bg-blue-900/80 transition-colors whitespace-nowrap">
              Audit Logs
            </Link>
            <Link to="/health-ui" className="px-4 py-2.5 hover:bg-blue-900/80 text-slate-300 transition-colors whitespace-nowrap">
              System Health
            </Link>
          </div>
        </nav>
      </header>

      {/* 3. Official Announcement Notice Ticker */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-3 text-xs text-amber-950 font-medium">
          <span className="bg-amber-600 text-white px-2 py-0.5 rounded-xs font-bold text-[10px] tracking-wide uppercase flex-shrink-0">
            Statutory Notice
          </span>
          <p className="truncate">
            All procurement criteria, vendor filings, and technical credentials are automatically evaluated against statutory compliance frameworks. Tamper-evident audit trails are maintained for vigilance review.
          </p>
        </div>
      </div>

      {/* 4. Central Portal Gateways */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 space-y-8">
        <div>
          <div className="border-b border-slate-300 pb-2 mb-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                Designated Access Portals
              </h2>
              <p className="text-xs text-slate-600">
                Select your designated role to enter the secure BidSure operational console.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
              Role Separation: GFR Rule 144
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Officer Gateway */}
            <Card className="border-t-4 border-t-blue-900 border-slate-300 bg-white shadow-xs">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded">
                    Authority Gateway
                  </span>
                  <ShieldCheck className="w-5 h-5 text-blue-900" />
                </div>
                <CardTitle className="text-lg font-bold text-blue-950 mt-2">
                  Procurement Officer & Evaluation Board Console
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 leading-relaxed">
                  Designated for Tender Inviting Authorities (TIA), Bid Evaluation Committees (BEC), and Chief Vigilance Officers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-800" />
                    <span>Publish tenders and establish mandatory technical clauses</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-800" />
                    <span>Inspect automated cross-verification of vendor credentials</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-800" />
                    <span>Review deterministic compliance findings and risk indices</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link to="/officer/dashboard" className="flex-1">
                    <Button className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs justify-between">
                      <span>Access Officer Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/officer/tenders">
                    <Button variant="outline" className="text-xs font-medium border-slate-300">
                      Manage Tenders
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Bidder Gateway */}
            <Card className="border-t-4 border-t-emerald-800 border-slate-300 bg-white shadow-xs">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                    Vendor Gateway
                  </span>
                  <FileCheck2 className="w-5 h-5 text-emerald-800" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 mt-2">
                  Contractor, Supplier & Bidder Portal
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 leading-relaxed">
                  Designated for registered suppliers, contractors, micro & small enterprises (MSEs), and original equipment manufacturers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Search public tenders and download specification documents</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Submit structured bid proposals with required credentials</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                    <span>Track proposal evaluation status and official clarifications</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link to="/bidder/dashboard" className="flex-1">
                    <Button className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs justify-between">
                      <span>Access Bidder Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/bidder/tenders">
                    <Button variant="outline" className="text-xs font-medium border-slate-300">
                      Browse Solicitations
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 5. Live Public Procurement Solicitations Table */}
        <div className="space-y-3">
          <div className="border-b border-slate-300 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-900" />
              <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                Current Public Tenders & Solicitations
              </h3>
            </div>
            <Link to="/officer/tenders" className="text-xs text-blue-800 hover:text-blue-950 font-semibold flex items-center gap-1">
              <span>View All Tenders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading && (
            <LoadingState message="Retrieving active public tenders from central database..." />
          )}

          {!isLoading && recentTenders.length === 0 && (
            <div className="p-8 bg-white border border-slate-200 rounded text-center text-xs text-slate-500">
              No public solicitations are currently open.
            </div>
          )}

          {!isLoading && recentTenders.length > 0 && (
            <div className="bg-white border border-slate-300 rounded shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-2.5 px-4">Tender Reference</th>
                    <th className="py-2.5 px-4">Work / Procurement Title</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Published Date</th>
                    <th className="py-2.5 px-4 text-right">Specifications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTenders.map((tender) => (
                    <tr key={tender.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-900 whitespace-nowrap">
                        {tender.referenceNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {tender.title}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            tender.status === "PUBLISHED"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {tender.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{new Date(tender.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <Link to={`/officer/tenders/${tender.id}`}>
                          <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                            <span>View Specs</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 6. Statutory & Regulatory Procurement Framework */}
        <div>
          <div className="border-b border-slate-300 pb-2 mb-4">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-tight">
              Statutory Procurement Governance Framework
            </h3>
            <p className="text-xs text-slate-600">
              Key transparency and verification mandates implemented in the BidSure core architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded border border-slate-200 space-y-1.5 shadow-xs">
              <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-900 mb-1">
                <Scale className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">GFR 2017 Compliance</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Automated clause-by-clause verification against General Financial Rules and mandatory procurement guidelines.
              </p>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200 space-y-1.5 shadow-xs">
              <div className="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-emerald-900 mb-1">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Multi-Registry Verification</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Deterministic cross-referencing against PAN, GSTIN, and Manufacturer Authorization Form (MAF) registries.
              </p>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200 space-y-1.5 shadow-xs">
              <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-amber-900 mb-1">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Two-Cover Evaluation</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Strict separation of technical criteria qualification before financial price proposal opening.
              </p>
            </div>

            <div className="bg-white p-4 rounded border border-slate-200 space-y-1.5 shadow-xs">
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-900 mb-1">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Immutable Audit Trail</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cryptographic hashing and evidence lineage for comprehensive scrutiny by CAG and Vigilance authorities.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 7. Institutional Government Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t-4 border-blue-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-slate-100 font-bold text-sm uppercase">BidSure e-Procurement</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                National public procurement verification system. Designed and developed to ensure objective, transparent, and legally compliant public contract evaluations.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-slate-200 font-bold text-xs uppercase tracking-wider">Portals</div>
              <ul className="space-y-1 text-[11px]">
                <li><Link to="/officer/dashboard" className="hover:text-white transition-colors">Officer Console</Link></li>
                <li><Link to="/officer/tenders" className="hover:text-white transition-colors">Tenders Management</Link></li>
                <li><Link to="/officer/bids" className="hover:text-white transition-colors">Submissions Evaluation</Link></li>
                <li><Link to="/bidder/dashboard" className="hover:text-white transition-colors">Bidder Portal</Link></li>
                <li><Link to="/bidder/tenders" className="hover:text-white transition-colors">Public Solicitations</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-slate-200 font-bold text-xs uppercase tracking-wider">Statutory Links</div>
              <ul className="space-y-1 text-[11px]">
                <li><span className="text-slate-400">General Financial Rules (GFR 2017)</span></li>
                <li><span className="text-slate-400">Central Vigilance Commission (CVC)</span></li>
                <li><span className="text-slate-400">Public Procurement Policy for MSEs</span></li>
                <li><span className="text-slate-400">Right to Information (RTI) Mandates</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-slate-200 font-bold text-xs uppercase tracking-wider">Diagnostics & Testing</div>
              <ul className="space-y-1 text-[11px]">
                <li>
                  <Link to="/health-ui" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    <span>System Health Diagnostic (/health-ui)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/error-test" className="text-slate-300 hover:text-white transition-colors">
                    Developer Error Test Bench (/error-test)
                  </Link>
                </li>
                <li><span className="text-slate-500 font-mono">Build Phase: Phase 03.2 Shell</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-slate-500">
            <p>© 2026 BidSure e-Procurement Portal. Government Public Procurement Oversight Architecture.</p>
            <p>Adheres to Guidelines for Indian Government Websites (GIGW) & ISO 27001.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
