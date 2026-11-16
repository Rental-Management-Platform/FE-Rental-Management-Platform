"use client";

import { useSession } from "@/lib/session/auth-provider";
import { canBuyPlans } from "../access";
import { NOT_A_BUYER_NOTE } from "../text";

/**
 * The one line for a signed in person who gets no buy button: a renter, an admin, or a landlord
 * without `order:create` (spec 0021, AC-3). A guest has a sign in link under each card instead, and
 * nothing shows while the session is not known yet.
 */
export function ViewerNote() {
  const session = useSession();
  if (session.status !== "user" || canBuyPlans(session)) return null;
  return <p className="text-sm text-muted-foreground">{NOT_A_BUYER_NOTE}</p>;
}
