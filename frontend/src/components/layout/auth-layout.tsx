import React from "react";
import { Outlet } from "react-router-dom";

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">BidSure AI</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Autonomous Public Procurement Compliance Platform</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};
