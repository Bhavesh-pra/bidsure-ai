import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const RegisterPage: React.FC = () => {
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle>Bidder Registration</CardTitle>
        <CardDescription>Register your organization on BidSure</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-slate-500 leading-relaxed">
          Organization registration with GSTIN and PAN validation will be enabled during Backend Phase 4 (Authentication & Identity).
        </p>
      </CardContent>
      <CardFooter>
        <Link to="/auth/login" className="w-full">
          <Button variant="outline" className="w-full">
            Back to Sign In
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
