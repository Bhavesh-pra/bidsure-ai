import React from "react";
import { useNavigate } from "react-router-dom";
import { ForbiddenState } from "@/components/feedback/forbidden-state";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/use-auth";

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleReturn = () => {
    if (role === "BIDDER") {
      navigate("/bidder/dashboard");
    } else {
      navigate("/officer/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <ForbiddenState message="Your account does not have authorization to access this view or resource." />
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={handleReturn} className="w-full">
            Return to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/auth/login")}
            className="w-full"
          >
            Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
};
