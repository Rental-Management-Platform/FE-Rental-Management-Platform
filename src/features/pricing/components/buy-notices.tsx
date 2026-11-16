"use client";

import { TriangleAlertIcon } from "lucide-react";
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
  return (
    <div className="flex flex-col gap-4 empty:hidden">
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
