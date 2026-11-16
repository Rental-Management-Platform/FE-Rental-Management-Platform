"use client";

import { ErrorState } from "@/components/states/error-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/lib/api/errors";
import { useCountdown } from "@/lib/use-countdown";

/**
 * A failed first read of a table of the catalog: a 429 shows the wait counting down, anything else
 * the error with the support code of a 5xx. "Thử lại" stays off while the wait runs.
 */
export function ListFailure({
  error,
  title,
  onRetry,
}: {
  error: unknown;
  title: string;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  if (isApiError(error) && error.status === 429) {
    return (
      <div className="flex flex-col items-start gap-4 px-(--card-spacing)">
        <RateLimitNotice error={error} className="w-full" />
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onRetry}
          disabled={secondsLeft > 0}
        >
          Thử lại
        </Button>
      </div>
    );
  }
  return <ErrorState error={error} title={title} onRetry={onRetry} />;
}
