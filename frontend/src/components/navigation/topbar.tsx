import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, User, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { healthService } from "@/services/api";
import { useAuth } from "@/features/auth/use-auth";

interface TopbarProps {
  currentRole?: "OFFICER" | "BIDDER";
  onRoleToggle?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ currentRole }) => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const { data: health, isSuccess, isError, isLoading } = useQuery({
    queryKey: ["backend-health"],
    queryFn: healthService.getHealth,
    refetchInterval: 30000,
    retry: 1,
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login", { replace: true });
    } catch {
      navigate("/auth/login", { replace: true });
    }
  };

  const roleDisplay = (role?: string | null) => {
    switch (role) {
      case "PROCUREMENT_OFFICER":
        return "Procurement Officer";
      case "BIDDER":
        return "Authorized Bidder";
      case "REVIEWER":
        return "Evaluation Reviewer";
      case "AUDITOR":
        return "Independent Auditor";
      case "ADMIN":
        return "System Administrator";
      default:
        return currentRole === "OFFICER" ? "Procurement Officer" : "Authorized Bidder";
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-sm">
            B
          </div>
          <span>
            BidSure{" "}
            <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              AI
            </span>
          </span>
        </Link>
        <span className="text-slate-300">|</span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {user?.role === "BIDDER" ? "Bidder Submission Portal" : "Tender Evaluation Portal"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Backend Connection Indicator */}
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 bg-slate-50"
          title={
            isSuccess
              ? `Connected to ${health?.data?.service} (Status: ${health?.data?.status})`
              : "Connecting to backend..."
          }
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
            <span className="flex items-center gap-1 text-amber-700 font-semibold" title="Backend not reached">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Offline
            </span>
          )}
        </div>

        {/* User Identity Display */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-semibold">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-slate-900 leading-tight truncate max-w-[140px]">
                  {user.fullName || user.email}
                </span>
                <span className="text-[11px] text-slate-500 leading-tight">
                  {roleDisplay(user.role)}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth/login"
            className="text-xs font-semibold text-blue-600 hover:underline border-l border-slate-200 pl-4"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
