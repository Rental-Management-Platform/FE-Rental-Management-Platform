"use client";

import { TriangleAlertIcon } from "lucide-react";
import { FailureNotice } from "@/components/form/failure-notice";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { describeError } from "@/lib/api/errors";
import type { OrderFailure } from "../order-failure";
import { ORDER_GONE } from "../order-text";

/**
 * The failure of a cancel from a row, drawn inside the dialog (spec 0022, AC-16). A refusal is a
 * message with a next step, not something that broke, so every kind but `other` is a quiet
 * `warning` with words and an icon: the backend sentence for a conflict and a refused permission,
 * the countdown for a 429. Anything else is the red alert with the support code of a 5xx. A 401 is
 * left to the session layer, so `session` draws nothing.
 */
export function CancelRowNotice({ failure }: { failure: OrderFailure | null }) {
  if (failure === null) return null;
  switch (failure.kind) {
    case "conflict":
    case "denied":
    case "plan-gone":
      return (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertDescription>
            <p>{failure.message}</p>
          </AlertDescription>
        </Alert>
      );
    case "not-found":
      return (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertDescription>
            <p>{ORDER_GONE}</p>
          </AlertDescription>
        </Alert>
      );
    case "rate-limited":
      return <RateLimitNotice error={failure.error} className="w-full" />;
    case "other":
      return (
        <FailureNotice
          failure={failure.error}
          message={describeError(failure.error).message}
        />
      );
    case "session":
      return null;
  }
}
