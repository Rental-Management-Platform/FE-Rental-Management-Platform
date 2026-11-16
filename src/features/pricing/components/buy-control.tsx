"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Plan } from "@/lib/api/types";
import { authHref } from "@/lib/next-path";
import { PRICING_PATH } from "@/lib/pricing-path";
import { useSession } from "@/lib/session/auth-provider";
import { canBuyPlans } from "../access";
import { BUYING, SIGN_IN_TO_BUY, buyLabel } from "../text";
import { useBuy } from "./buy-provider";

// A guest comes back to this page after signing in and presses "Mua" again (spec 0021). The
// address goes through the same check as every `next` value.
const SIGN_IN_HREF = authHref("/login", PRICING_PATH);

/**
 * What sits under one card, by who is looking (spec 0021, AC-3). While the session is not known
 * the server HTML and the first browser render hold a 44 px placeholder, so the cards do not jump
 * and are the same for everyone. A guest gets a link to sign in, a landlord who may buy gets the
 * button, and anyone else gets nothing here (the page says why once, below the cards).
 */
export function BuyControl({ plan }: { plan: Plan }) {
  const session = useSession();
  const { locked, busyPlanId, hidden, buy } = useBuy();

  if (session.status === "loading") {
    return <div aria-hidden="true" className="h-11 w-full" />;
  }

  if (session.status === "guest") {
    return (
      <Button asChild size="lg" variant="outline" className="w-full">
        <Link href={SIGN_IN_HREF}>{SIGN_IN_TO_BUY}</Link>
      </Button>
    );
  }

  // The backend refused the permission on a press (`hidden`): no button for the rest of the visit.
  if (!canBuyPlans(session) || hidden) return null;

  const busy = busyPlanId === plan.id;
  return (
    <Button
      type="button"
      size="lg"
      // A plan name can be up to 60 characters, so the label may wrap and the button grows
      // from its 44 px instead of running out of the card.
      className="h-auto min-h-11 w-full py-2 whitespace-normal"
      disabled={locked}
      aria-busy={busy || undefined}
      onClick={() => buy(plan.id)}
    >
      {busy && <Spinner size="sm" aria-hidden="true" />}
      {busy ? BUYING : buyLabel(plan.name)}
    </Button>
  );
}
