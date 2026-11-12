"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/session/auth-provider";
import { wardBoundsQuery } from "../api/wards-query";

/**
 * The ward catalog with the box of each ward, for the location map (spec 0011). It is read only
 * once `enabled` has been true, and it stays in the cache after that, so a component that only
 * needs the answer can ask with `enabled: false` and still get it. A failed read is not retried
 * by hand: the map then falls back to the two city boxes, and the backend checks the ward.
 */
export function useWardBounds({ enabled }: { enabled: boolean }) {
  const api = useApi();
  return useQuery({ ...wardBoundsQuery(api), enabled });
}
