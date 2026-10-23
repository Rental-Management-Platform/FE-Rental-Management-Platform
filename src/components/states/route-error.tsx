"use client";

import { ErrorState } from "./error-state";

interface RouteErrorProps {
  /** What Next.js hands an `error.tsx`: any value, not always an `Error`. */
  error: unknown;
  retry: () => void;
}

// Next.js gives a server error a `digest`, a hash that matches the server log. It is the
// support code here, because such an error has no `requestId` (spec 0001).
function digestOf(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "digest" in error) {
    return typeof error.digest === "string" ? error.digest : null;
  }
  return null;
}

// The body of every `error.tsx` and of `global-error.tsx`. The message is the generic one: a
// server error never carries text that is safe to show.
export function RouteError({ error, retry }: RouteErrorProps) {
  return (
    <ErrorState
      error={error}
      onRetry={retry}
      title="Có lỗi xảy ra"
      supportCode={digestOf(error)}
      className="py-16"
    />
  );
}
