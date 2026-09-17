import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./error-boundary";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ErrorBoundary>
  );
};
