"use client";

import { CircleAlertIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/lib/api/errors";
import type { Membership } from "@/lib/api/types";
import { useCountdown } from "@/lib/use-countdown";
import { useMembership } from "../hooks/use-membership";
import { describeMembership } from "../membership-text";
import { PricingAction } from "./pricing-action";

// The API says this person may not read the answer (an admin took the permission away): the
// strip draws nothing, like a person who never had it.
const isDenied = (error: unknown) =>
  isApiError(error) &&
  error.status === 403 &&
  error.code === "PERMISSION_DENIED";

/**
 * The status strip at the top of "Tin của tôi" and "Đăng tin mới" (spec 0020, AC-2 to AC-4): the
 * trial or the plan, and how many listings are showing out of how many are allowed. It reads the
 * shared membership entry and never blocks the page it sits on: it has its own loading and failed
 * states, and draws nothing for a person who may not read the answer.
 *
 * An answer that is already shown stays shown when a later read fails, so the numbers never turn
 * into an error just because the window was focused while the network was down.
 *
 * `showAction` (default true) draws the "Mua gói" or "Xem bảng giá" button of the strip. The
 * pricing page turns it off (spec 0021, AC-6), because the plans are right below the strip.
 */
export function MembershipStrip({
  showAction = true,
}: {
  showAction?: boolean;
}) {
  const { query, allowed } = useMembership();
  if (!allowed) return null;
  if (query.data !== undefined) {
    return <StripAlert membership={query.data} showAction={showAction} />;
  }
  if (query.isError) {
    return isDenied(query.error) ? null : (
      <StripFailure error={query.error} onRetry={() => void query.refetch()} />
    );
  }
  return <StripSkeleton />;
}

// One fixed height, about one line of the strip, so the page below does not jump much when the
// answer arrives.
function StripSkeleton() {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        Đang tải trạng thái gói
      </span>
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  );
}

// A quiet status region: it is read as one sentence when its text changes, and it is words plus
// an icon, never color alone. An unknown `state` draws nothing.
function StripAlert({
  membership,
  showAction,
}: {
  membership: Membership;
  showAction: boolean;
}) {
  const notice = describeMembership(membership);
  if (notice === null) return null;

  const Icon = notice.tone === "warning" ? TriangleAlertIcon : InfoIcon;
  return (
    <Alert variant={notice.tone}>
      <Icon aria-hidden="true" />
      <AlertTitle>{notice.headline}</AlertTitle>
      {notice.lines.length > 0 && (
        <AlertDescription>
          {notice.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </AlertDescription>
      )}
      {showAction && notice.action !== null && (
        <div className="col-start-2 mt-2 flex flex-wrap gap-3">
          <PricingAction way={notice.action} />
        </div>
      )}
    </Alert>
  );
}

// A first read that failed. A 429 shows the wait counting down and keeps "Thử lại" off until it
// ends; anything else says so quietly (the page works without the strip, so it is not red).
function StripFailure({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  if (isApiError(error) && error.status === 429) {
    return (
      <div className="flex flex-col items-start gap-3">
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
  return (
    <Alert>
      <CircleAlertIcon aria-hidden="true" />
      <AlertTitle>Không tải được trạng thái gói.</AlertTitle>
      <div className="col-start-2 mt-2">
        <Button type="button" variant="outline" size="lg" onClick={onRetry}>
          Thử lại
        </Button>
      </div>
    </Alert>
  );
}
