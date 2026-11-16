"use client";

import { MembershipStrip } from "@/features/membership/components/membership-strip";
import { useMembership } from "@/features/membership/hooks/use-membership";
import { useSession } from "@/lib/session/auth-provider";
import { canBuyPlans } from "../access";
import { RENEWAL_LINE } from "../text";

/**
 * The status strip under the header, for a person who may buy (spec 0021, AC-6). Anyone else
 * draws nothing and makes no membership request: the gate is `canBuyPlans`, a step before the
 * shared read, because an admin holds `subscription:read` too. The strip keeps its own loading,
 * failed and rate limit states, so it never holds the cards back.
 */
export function MembershipSection() {
  const session = useSession();
  return canBuyPlans(session) ? <LandlordStatus /> : null;
}

// The strip without its buy action, because the cards are right below it. While a plan is
// running, one fixed line says how a second plan joins. It reads `state` from the same shared
// entry as the strip (one request), and a read that has not answered draws no line.
function LandlordStatus() {
  const { query } = useMembership();
  return (
    <div className="flex flex-col gap-3">
      <MembershipStrip showAction={false} />
      {query.data?.state === "plan" && (
        <p className="text-sm text-muted-foreground">{RENEWAL_LINE}</p>
      )}
    </div>
  );
}
