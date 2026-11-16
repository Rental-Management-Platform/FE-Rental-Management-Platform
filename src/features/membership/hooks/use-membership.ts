"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { membershipQuery } from "../api/membership-query";

/**
 * The shared membership answer (spec 0020). The read is made only for a person who holds
 * `subscription:read`; for anyone else it is off, so no request is made. `allowed` is that check,
 * for a caller that draws nothing without it.
 */
export function useMembership() {
  const api = useApi();
  const session = useSession();
  const allowed = can(session, "subscription:read");
  const query = useQuery({ ...membershipQuery(api), enabled: allowed });
  return { query, allowed };
}
