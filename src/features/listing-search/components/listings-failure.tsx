"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { ErrorState } from "@/components/states/error-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { createApiError, type ApiError } from "@/lib/api/errors";
import { useCountdown } from "@/lib/use-countdown";

// The plain fields of an `ApiError`. The page reads the list on the server, catches the error
// there and hands it over as these fields, because the error has to cross into the browser.
export type ListingsFailureProps = Pick<
  ApiError,
  | "status"
  | "code"
  | "message"
  | "requestId"
  | "retryAfterSeconds"
  | "retryAfterExact"
>;

/**
 * What the results area shows when the list could not be read (spec 0009, AC-11). A 429 shows
 * the wait counting down, and "Thử lại" stays disabled until it ends. Any other failure shows the
 * backend or client message, with the support code for a 5xx only. "Thử lại" asks the server to
 * render the page again, and the server never retries by itself. The detail page (spec 0010,
 * AC-13) uses it too and passes its own `title`.
 */
export function ListingsFailure({
  status,
  code,
  message,
  requestId,
  retryAfterSeconds,
  retryAfterExact,
  title = "Không tải được danh sách tin",
}: ListingsFailureProps & { title?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // One object per failure: the countdown and `ErrorState` key on its identity. A second 429
  // carries its own `requestId`, so it is a new error and starts the count again.
  const error = useMemo(
    () =>
      createApiError({
        status,
        code,
        message,
        requestId,
        retryAfterSeconds,
        retryAfterExact,
      }),
    [status, code, message, requestId, retryAfterSeconds, retryAfterExact],
  );
  const secondsLeft = useCountdown(error);

  const retry = () => startTransition(() => router.refresh());

  if (error.status === 429) {
    return (
      <div className="flex flex-col items-start gap-4">
        <RateLimitNotice error={error} className="w-full" />
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={retry}
          disabled={secondsLeft > 0 || isPending}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div aria-busy={isPending}>
      <ErrorState error={error} title={title} onRetry={retry} />
    </div>
  );
}
