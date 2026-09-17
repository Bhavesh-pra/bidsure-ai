import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./error-boundary";
import { AuthProvider } from "@/features/auth/auth-context";
import { queryClient } from "@/lib/query/query-client";

export { queryClient };

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
