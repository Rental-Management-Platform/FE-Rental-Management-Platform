"use client";

import { ForbiddenState } from "@/components/states/forbidden-state";
import { ErrorState } from "@/components/states/error-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isApiError } from "@/lib/api/errors";
import { useCountdown } from "@/lib/use-countdown";
import { RESET_RANGE_LABEL, RETRY_LABEL } from "./stats-text";

interface StatsFailureProps {
  /** What the read threw. */
  error: unknown;
  onRetry: () => void;
  /** Goes back to the last 30 days, which clears the params of the address. */
  onReset: () => void;
  /** The address holds a range, so there is something to clear. */
  hasRange: boolean;
  /** The title of the error state: "Không tải được thống kê". */
  title: string;
  /** What the forbidden state says when the read answers 403 `PERMISSION_DENIED`. */
  forbiddenMessage: string;
}

/**
 * A read that failed, in place of the zones (spec 0024, AC-16, and spec 0025, AC-13), so no old
 * numbers stay under a new range. The range bar above it stays usable. A 429 shows the wait and
 * keeps "Thử lại" off until it ends, a 400 means the contract moved (the page checks the range
 * first) and offers the 30 days, a 403 `PERMISSION_DENIED` is the forbidden state (a screen that
 * renews its token and reads again only reaches this on the second 403), and anything else (a
 * network error, a 5xx with its support code) is the error state with "Thử lại".
 */
export function StatsFailure({
  error,
  onRetry,
  onReset,
  hasRange,
  title,
  forbiddenMessage,
}: StatsFailureProps) {
  const secondsLeft = useCountdown(error);

  if (isApiError(error)) {
    if (error.status === 429) {
      return (
        <div className="flex flex-col items-start gap-4">
          <RateLimitNotice error={error} className="w-full" />
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onRetry}
            disabled={secondsLeft > 0}
          >
            {RETRY_LABEL}
          </Button>
        </div>
      );
    }
    if (error.status === 403 && error.code === "PERMISSION_DENIED") {
      return (
        <Card>
          <ForbiddenState message={forbiddenMessage} level={2} />
        </Card>
      );
    }
    if (error.status === 400 && error.code === "VALIDATION_FAILED") {
      return (
        <Card>
          <CardContent className="flex flex-col items-center gap-4">
            <ErrorState error={error} className="p-0" />
            {hasRange && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onReset}
              >
                {RESET_RANGE_LABEL}
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }
  }

  return (
    <Card>
      <ErrorState error={error} title={title} onRetry={onRetry} />
    </Card>
  );
}
