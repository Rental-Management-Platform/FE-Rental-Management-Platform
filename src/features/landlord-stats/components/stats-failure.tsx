"use client";

import { ForbiddenState } from "@/components/states/forbidden-state";
import { ErrorState } from "@/components/states/error-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isApiError } from "@/lib/api/errors";
import { useCountdown } from "@/lib/use-countdown";
import {
  FORBIDDEN_MESSAGE,
  RESET_RANGE_LABEL,
  RETRY_LABEL,
} from "../landlord-stats-text";

interface StatsFailureProps {
  /** What the read threw. */
  error: unknown;
  onRetry: () => void;
  /** Goes back to the last 30 days, which clears the params of the address. */
  onReset: () => void;
  /** The address holds a range, so there is something to clear. */
  hasRange: boolean;
}

/**
 * A read that failed, in place of the zones (spec 0024, AC-16), so no old numbers stay under a new
 * range. The range bar above it stays usable. A 429 shows the wait and keeps "Thử lại" off until it
 * ends, a 400 means the contract moved (the page checks the range first) and offers the 30 days, a
 * second 403 is the forbidden state, and anything else (a network error, a 5xx with its support
 * code) is the error state with "Thử lại".
 */
export function StatsFailure({
  error,
  onRetry,
  onReset,
  hasRange,
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
    // The first 403 already asked for a new token and read once more, so this is the second.
    if (error.status === 403 && error.code === "PERMISSION_DENIED") {
      return (
        <Card>
          <ForbiddenState message={FORBIDDEN_MESSAGE} level={2} />
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
      <ErrorState
        error={error}
        title="Không tải được thống kê"
        onRetry={onRetry}
      />
    </Card>
  );
}
