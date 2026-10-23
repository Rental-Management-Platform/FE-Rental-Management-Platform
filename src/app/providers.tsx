"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { shouldRetryQuery } from "@/lib/api/query-retry";
import { AuthProvider } from "@/lib/session/auth-provider";

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      // Queries retry once, only when a retry can help (spec 0002, "Query client defaults").
      queries: { retry: shouldRetryQuery },
      // A mutation can change data, so a retry could do it twice: never.
      mutations: { retry: false },
    },
  });

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  // A new client per server render keeps requests isolated; the browser reuses one
  // so its cache survives re-renders.
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <AuthProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
