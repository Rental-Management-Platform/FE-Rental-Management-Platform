"use client";

import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMembership } from "../hooks/use-membership";
import { describeMembership } from "../membership-text";
import { PricingAction } from "./pricing-action";

/**
 * The status strip at the top of "Tin của tôi" and "Đăng tin mới" (spec 0020): the trial or the
 * plan, and how many listings are showing out of how many are allowed. It reads the shared
 * membership entry and never blocks the page it sits on.
 */
export function MembershipStrip() {
  const { query, allowed } = useMembership();
  if (!allowed || query.data === undefined) return null;
  const notice = describeMembership(query.data);
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
      {notice.action !== null && (
        <div className="col-start-2 mt-2 flex flex-wrap gap-3">
          <PricingAction way={notice.action} />
        </div>
      )}
    </Alert>
  );
}
