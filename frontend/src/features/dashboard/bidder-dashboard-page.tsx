import React from "react";
import { Link } from "react-router-dom";
import { FileText, Send, CheckSquare, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const BidderDashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bidder Submission Portal</h1>
        <p className="text-sm text-slate-500 mt-1">
          Prepare, submit, and track public tender bids and compliance documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
              <Send className="w-5 h-5" />
            </div>
            <CardTitle>My Bids</CardTitle>
            <CardDescription>Track drafted and submitted bid packages.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/bidder/bids">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>View Bids</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
              <FileText className="w-5 h-5" />
            </div>
            <CardTitle>Documents Vault</CardTitle>
            <CardDescription>Pre-load GST, PAN, Udyam, and financial audits for rapid bidding.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/bidder/documents">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Manage Vault</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <CheckSquare className="w-5 h-5" />
            </div>
            <CardTitle>Compliance Pre-check</CardTitle>
            <CardDescription>Review statutory document validity before final bid submission.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/bidder/bids">
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span>Pre-check Submissions</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
