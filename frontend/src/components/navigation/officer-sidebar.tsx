import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileCheck2,
  CheckSquare,
  AlertCircle,
  FileText,
  History,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const officerNavItems = [
  { label: "Dashboard", path: "/officer/dashboard", icon: LayoutDashboard },
  { label: "Tenders", path: "/officer/tenders", icon: FileSpreadsheet },
  { label: "Bids & Submissions", path: "/officer/bids", icon: FileCheck2 },
  { label: "Verification", path: "/officer/verification", icon: CheckSquare },
  { label: "Findings & Risk", path: "/officer/findings", icon: AlertCircle },
  { label: "Reports", path: "/officer/reports", icon: FileText },
  { label: "Audit Trail", path: "/officer/audit", icon: History },
  { label: "Settings", path: "/officer/settings", icon: Settings },
];

export const OfficerSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Officer Console</span>
      </div>
      <nav className="flex-1 p-3 space-y-1" aria-label="Officer Navigation">
        {officerNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">BidSure SIH MVP</p>
        <p>Evidence-First Architecture</p>
      </div>
    </aside>
  );
};
