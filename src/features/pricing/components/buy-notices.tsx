"use client";

import { TriangleAlertIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { FailureNotice } from "@/components/form/failure-notice";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { describeError } from "@/lib/api/errors";
import type { BuyFailure } from "../buy-failure";
import { CHOOSE_ANOTHER_PLAN } from "../text";
import { useBuy } from "./buy-provider";
import { PendingOrderNotice } from "./pending-order-notice";

/**
 * The notice area directly above the cards (spec 0021): the reminder of an unpaid order first,
 * then at most one failure notice, and a new press clears the old failure. `empty:hidden` drops the area when nothing is in it, so the
 * page gap does not grow for nothing.
 */
export function BuyNotices() {
  const { failure } = useBuy();
  const ref = useRef<HTMLDivElement>(null);

  // Two failures take away what had focus: a refused permission hides every button, and a plan
  // that is gone loses its card when the plans are read again. Focus goes to the notice, which a
  // screen reader then reads, and the next Tab reaches the cards. The other failures leave the
  // pressed button where it is, still focused.
  useEffect(() => {
    if (failure?.kind === "denied" || failure?.kind === "plan-gone") {
      ref.current?.focus();
    }
  }, [failure]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="flex flex-col gap-4 outline-none empty:hidden"
    >
      <PendingOrderNotice />
      {failure !== null && <FailureAlert failure={failure} />}
    </div>
  );
}

// A refusal is a message with a next step, not something that broke, so every kind but `other` is
// quiet: words and an icon, a `status` region, never color alone. `session` draws nothing here
// because the session layer already handles it.
function FailureAlert({ failure }: { failure: BuyFailure }) {
  switch (failure.kind) {
    case "plan-gone":
      return (
        <Alert variant="warning">
          <TriangleAlertIcon aria-hidden="true" />
          <AlertDescription>
            <p>{failure.message}</p>
            <p>{CHOOSE_ANOTHER_PLAN}</p>
          </AlertDescription>
        </Alert>
      );
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
    case "session":
      return null;
  }
}
