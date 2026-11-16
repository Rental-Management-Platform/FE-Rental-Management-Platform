"use client";

import { useQuery } from "@tanstack/react-query";
import { pendingOrderQuery } from "@/features/order/api/orders";
import type { Order } from "@/lib/api/types";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { canBuyPlans } from "../access";

/**
 * The landlord's unpaid order, or `null` (spec 0021, AC-7). The read is made only for a person who
 * may buy and holds `order:read`; for anyone else it is off, so no request is made. A failed read
 * (including a 429) is `null` too: the reminder is a courtesy, so it never blocks the page and
 * never shows an error. An order that is already shown stays shown when a later read fails.
 */
export function usePendingOrder(): Order | null {
  const api = useApi();
  const session = useSession();
  const allowed = canBuyPlans(session) && can(session, "order:read");
  const query = useQuery({ ...pendingOrderQuery(api), enabled: allowed });
  return allowed ? (query.data?.items[0] ?? null) : null;
}
