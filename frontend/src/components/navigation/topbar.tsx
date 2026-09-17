import React from "react";
import { Link } from "react-router-dom";
import { Shield, Activity, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { healthService } from "@/services/api";

interface TopbarProps {
  currentRole: "OFFICER" | "BIDDER";
  onRoleToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ currentRole, onRoleToggle }) => {
  const { data: health, isSuccess, isError, isLoading } = useQuery({
    queryKey: ["backend-health"],
    queryFn: healthService.getHealth,
    refetchInterval: 30000,
    retry: 1,
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm">
            B
          </div>
          <span>BidSure <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">AI</span></span>
        </Link>
        <span className="text-slate-300">|</span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {currentRole === "OFFICER" ? "Tender Evaluation Portal" : "Bidder Submission Portal"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Backend Connection Indicator */}
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 bg-slate-50"
          title={isSuccess ? `Connected to ${health?.data?.service} (Status: ${health?.data?.status})` : "Connecting to backend..."}
        >
          <Activity className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600">Backend API:</span>
          {isLoading && <span className="text-amber-600 font-medium">Checking...</span>}
          {isSuccess && (
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {health?.data?.service} ({health?.data?.status})
            </span>
          )}
          {isError && (
            <span className="flex items-center gap-1 text-amber-700 font-semibold" title="Backend not reached on port 3000">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Offline
            </span>
          )}
        </div>

        {/* Role Switcher for Development / Multi-Role Shell */}
        {onRoleToggle && (
          <button
            onClick={onRoleToggle}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-medium border border-slate-300 transition-colors flex items-center gap-1.5"
            aria-label="Switch between Officer and Bidder views"
          >
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            Switch to {currentRole === "OFFICER" ? "Bidder" : "Officer"}
          </button>
        )}

        <div className="flex items-center gap-2 border-l border-slate-200 pl-4 text-xs text-slate-600 font-medium">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
            <User className="w-4 h-4" />
          </div>
          <span>{currentRole === "OFFICER" ? "Procurement Officer" : "Authorized Bidder"}</span>
        </div>
      </div>
    </header>
  );
};
