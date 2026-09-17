import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Topbar } from "../navigation/topbar";
import { BidderSidebar } from "../navigation/bidder-sidebar";
import { Breadcrumbs } from "../navigation/breadcrumbs";

export const BidderLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Topbar currentRole="BIDDER" onRoleToggle={() => navigate("/officer/dashboard")} />
      <div className="flex-1 flex">
        <BidderSidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
};
