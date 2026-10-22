"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createApiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { Page, Plan } from "@/lib/api/types";
import { env } from "@/lib/env";

export function SessionLab() {
  const [api] = useState(() =>
    createApiClient({ baseUrl: env.NEXT_PUBLIC_API_URL }),
  );

  const plans = useQuery({
    queryKey: ["dev", "plans"],
    queryFn: ({ signal }) =>
      api.get<Page<Plan>>("/plans", { auth: "none", signal }),
    enabled: false,
    retry: false,
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">Session lab</h1>
        <p className="text-sm text-neutral-600">
          Temporary developer page for the API client. It answers 404 in a
          production build.
        </p>
      </header>

      <section aria-labelledby="public-call" className="flex flex-col gap-2">
        <h2 id="public-call" className="font-medium">
          Public call: GET /plans (mode none)
        </h2>
        <div>
          <button
            type="button"
            onClick={() => void plans.refetch()}
            disabled={plans.isFetching}
            className="rounded border px-3 py-1 disabled:opacity-50"
          >
            Call GET /plans
          </button>
        </div>
        <output aria-live="polite" className="text-sm">
          {plans.isFetching
            ? "Calling…"
            : plans.data
              ? `total: ${plans.data.total}`
              : !plans.error && "Not called yet."}
        </output>
        {plans.error && (
          <p role="alert" className="text-sm text-red-700">
            {isApiError(plans.error)
              ? `${plans.error.code} (status ${plans.error.status}): ${plans.error.message}`
              : "Unexpected error."}
          </p>
        )}
      </section>
    </main>
  );
}
