import React, { useState } from "react";
import { useErrorTest } from "@/hooks/use-error-test";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";

const SCENARIOS = [
  { key: "internal", label: "Internal Error", code: "INTERNAL_ERROR", status: 500 },
  { key: "validation", label: "Validation Error", code: "VALIDATION_ERROR", status: 400 },
  { key: "not_found", label: "Not Found", code: "NOT_FOUND", status: 404 },
  { key: "unauthorized", label: "Unauthorized", code: "UNAUTHORIZED", status: 401 },
  { key: "forbidden", label: "Forbidden", code: "FORBIDDEN", status: 403 },
  { key: "rate_limited", label: "Rate Limited", code: "RATE_LIMITED", status: 429 },
] as const;

type ScenarioKey = (typeof SCENARIOS)[number]["key"];

export const ErrorTestPage: React.FC = () => {
  const [scenario, setScenario] = useState<ScenarioKey>("internal");
  const { isLoading, isError, error, isFetching, refetch } = useErrorTest(scenario);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/health-ui"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Health
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-blue-600" aria-hidden />
          <h1 className="text-xl font-bold text-slate-900">Error Integration Test</h1>
          <Badge variant="secondary" className="font-mono text-xs">Phase 02</Badge>
        </div>

        <Alert variant="info">
          <AlertTitle>Integration Verification</AlertTitle>
          <AlertDescription>
            This page deliberately triggers real backend errors to verify the complete error pipeline:
            Backend → API envelope → Axios interceptor → ApiError → ErrorState component.
          </AlertDescription>
        </Alert>

        {/* Scenario selector */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base">Select Error Scenario</CardTitle>
            <CardDescription>Choose a scenario to trigger the corresponding backend error.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setScenario(s.key)}
                  className={[
                    "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    scenario === s.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50",
                  ].join(" ")}
                  aria-pressed={scenario === s.key}
                >
                  <span>{s.label}</span>
                  <span className="ml-1.5 opacity-60 font-mono">{s.status}</span>
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-100 pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              isLoading={isFetching}
            >
              Re-trigger
            </Button>
          </CardFooter>
        </Card>

        {/* Result panel */}
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-base">Error Pipeline Result</CardTitle>
            <CardDescription>
              The ErrorState below is rendered from the real backend response.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {isLoading ? (
              <LoadingState message="Triggering backend error…" />
            ) : isError && error ? (
              <ErrorState
                title="Backend error received"
                error={error}
                onRetry={() => refetch()}
              />
            ) : (
              <div className="py-10 text-center text-sm text-slate-400">
                Select a scenario above to trigger a backend error.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raw error details for developers */}
        {isError && error && (
          <Card>
            <CardHeader className="border-b border-slate-100 pb-3">
              <CardTitle className="text-base font-mono text-xs text-slate-500 uppercase tracking-wide">
                Raw ApiError (dev reference)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <pre className="text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded p-3 overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ErrorTestPage;
