import React from "react";
import { Link } from "react-router-dom";
import { useHealth } from "@/hooks/use-health";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw, FlaskConical } from "lucide-react";

export const HealthPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useHealth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">BidSure</h1>
          <p className="text-sm font-medium text-slate-500">Autonomous Procurement Assurance Platform</p>
        </div>

        <Card className="border-slate-200 shadow-md">
          <CardHeader className="text-center border-b border-slate-100 pb-4">
            <CardTitle className="text-xl">System Health</CardTitle>
            <CardDescription>Real-time vertical API connectivity status</CardDescription>
          </CardHeader>

          <CardContent className="pt-6 pb-4 space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3" role="status" aria-label="loading">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="text-sm font-medium text-slate-600">Checking BidSure API…</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center text-center space-y-4 py-4" role="alert">
                <div className="flex items-center space-x-2 text-rose-600 font-semibold text-lg">
                  <AlertTriangle className="h-6 w-6" />
                  <span>API unavailable</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-sm text-rose-700 w-full space-y-1">
                  <p className="font-medium">
                    {error?.message || "Unable to connect to the BidSure backend."}
                  </p>
                  {error?.requestId && (
                    <p className="font-mono text-xs text-rose-600">
                      Request ID: {error.requestId}
                    </p>
                  )}
                </div>
              </div>
            ) : data?.success ? (
              <div className="space-y-6 py-2">
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    API Online
                  </span>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500 text-xs uppercase tracking-wider font-sans">Service:</span>
                    <span className="font-semibold text-slate-800">{data.data.service}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-200">
                    <span className="text-slate-500 text-xs uppercase tracking-wider font-sans">Version:</span>
                    <span className="text-slate-800">{data.data.version}</span>
                  </div>
                  <div className="flex flex-col py-1 space-y-1">
                    <span className="text-slate-500 text-xs uppercase tracking-wider font-sans">Request ID:</span>
                    <span className="text-xs text-slate-700 break-all bg-white p-2 rounded border border-slate-200">
                      {data.requestId}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="pt-2 border-t border-slate-100 flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">Phase 02</Badge>
              <Link
                to="/error-test"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                <FlaskConical className="h-3 w-3" aria-hidden />
                Error Test
              </Link>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="gap-1 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default HealthPage;
