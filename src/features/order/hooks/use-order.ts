"use client";

import { useQuery } from "@tanstack/react-query";
import type { Uuid } from "@/lib/api/types";
import { isUuid } from "@/lib/is-uuid";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { orderQuery } from "../api/orders";

/**
 * One order of mine for the order page (spec 0022, AC-1 and AC-2). The read is made only for a
 * person who holds `order:read` and an address that has the shape of an id: with either missing the
 * query is off, so no request is made and the page shows its forbidden or not found state.
 */
export function useOrder(id: Uuid) {
  const api = useApi();
  const session = useSession();
  const allowed = can(session, "order:read");
  const validId = isUuid(id);
  const query = useQuery({
    ...orderQuery(api, id),
    enabled: allowed && validId,
  });
  return { query, allowed, validId };
}
