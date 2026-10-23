"use client";

import { ClockIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { isApiError } from "@/lib/api/errors";
import { formatWait } from "@/lib/format";
import { useCountdown } from "@/lib/use-countdown";

/**
 * The wait after a 429, counting down. It shows nothing for any other error. "khoảng" appears
 * only when the seconds came from the table and not from `Retry-After`. The owner of the form
 * disables its submit button while `useCountdown(error)` is above 0.
 *
 * A screen reader hears one sentence when the error arrives and one when the wait ends, not a
 * new number every second: the ticking number on screen is hidden from it.
 */
export function RateLimitNotice({
  error,
  className,
}: {
  error: unknown;
  className?: string;
}) {
  const secondsLeft = useCountdown(error);
  if (!isApiError(error) || error.status !== 429) return null;

  const approximate = !error.retryAfterExact;
  const total = error.retryAfterSeconds;
  const waiting = total !== null && secondsLeft > 0;
  const announced =
    total === null
      ? error.message
      : waiting
        ? `Hãy thử lại sau ${formatWait(total, { approximate })}.`
        : "Bạn có thể thử lại ngay.";

  return (
    <Alert variant="warning" aria-live="polite" className={className}>
      <ClockIcon />
      <AlertTitle>Bạn thao tác quá nhanh</AlertTitle>
      <AlertDescription>
        <span className="sr-only">{announced}</span>
        <span aria-hidden="true">
          {waiting
            ? `Hãy thử lại sau ${formatWait(secondsLeft, { approximate })}.`
            : announced}
        </span>
      </AlertDescription>
    </Alert>
  );
}
