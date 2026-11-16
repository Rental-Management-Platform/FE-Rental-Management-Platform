"use client";

import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { FailureNotice } from "@/components/form/failure-notice";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { describeError } from "@/lib/api/errors";
import { PRICING_PATH } from "@/lib/pricing-path";
import type { OrderFailure } from "../order-failure";
import { CANCEL, CHOOSE_ANOTHER_PLAN } from "../order-text";
import { useOrderActions } from "./order-actions-provider";

/**
 * The notice area above the zones (spec 0022, AC-9 to AC-11): at most one failure, and a new press
 * clears the old one. It sits outside the payment zone on purpose, because a conflict changes the
 * view (the zone is replaced by the paid or the cancelled result) and the sentence must stay
 * readable. `empty:hidden` drops the area when nothing is in it, so the page gap does not grow.
 */
export function OrderNotices() {
  const { failure, hidden, mayCancel, locked, askCancel } = useOrderActions();
  const ref = useRef<HTMLDivElement>(null);

  // A refused permission hides both buttons, so the button that had focus is gone. Focus goes to
  // the notice, which a screen reader then reads, and the next Tab reaches the page. The other
  // failures leave the pressed button where it is, still focused.
  useEffect(() => {
    if (failure?.kind === "denied") ref.current?.focus();
  }, [failure]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="flex flex-col gap-4 outline-none empty:hidden"
    >
      {failure !== null && (
        <FailureAlert
          failure={failure}
          showCancel={mayCancel && !hidden}
          locked={locked}
          onCancel={askCancel}
        />
      )}
    </div>
  );
}

// A refusal is a message with a next step, not something that broke, so every kind but `other` is
// quiet: words and an icon, a `status` region, never color alone. `session` and `not-found` draw
// nothing here: the session layer handles the first, and the page switches to its not found state
// for the second.
function FailureAlert({
  failure,
  showCancel,
  locked,
  onCancel,
}: {
  failure: OrderFailure;
  showCancel: boolean;
  locked: boolean;
  onCancel: () => void;
}) {
  switch (failure.kind) {
    case "plan-gone":
      return (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertDescription>
            <p>{failure.message}</p>
          </AlertDescription>
          <div className="col-start-2 mt-2 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={PRICING_PATH}>{CHOOSE_ANOTHER_PLAN}</Link>
            </Button>
            {showCancel && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="aria-disabled:opacity-50"
                aria-disabled={locked || undefined}
                onClick={onCancel}
              >
                {CANCEL}
              </Button>
            )}
          </div>
        </Alert>
      );
    case "conflict":
    case "denied":
      return (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertDescription>
            <p>{failure.message}</p>
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
    case "not-found":
    case "session":
      return null;
  }
}
