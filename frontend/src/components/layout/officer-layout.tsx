import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Topbar } from "../navigation/topbar";
import { OfficerSidebar } from "../navigation/officer-sidebar";
import { Breadcrumbs } from "../navigation/breadcrumbs";

export const OfficerLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Topbar currentRole="OFFICER" onRoleToggle={() => navigate("/bidder/dashboard")} />
      <div className="flex-1 flex">
        <OfficerSidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
