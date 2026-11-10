"use client";

import { useQuery } from "@tanstack/react-query";
import type { Ward } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { wardsQuery } from "../api/wards-query";

/**
 * The ward catalog, read once for the whole visit through the shared `["wards"]` query.
 *
 * `initialWards` is a catalog a Server Component already read. It becomes `initialData`, not
 * `placeholderData`: with `staleTime: Infinity` the query counts it as fresh, so the browser
 * never calls `GET /wards` and the first render (server included) already has the names. Three
 * rules (spec 0015, AC-17):
 * - `undefined` or an empty array means "none", so the browser reads it. A real catalog is never
 *   empty, and an empty one would be kept for good because it never goes stale.
 * - It only matters when the `["wards"]` query is first created. If the query cache already has
 *   data, that data wins, and a later change of the prop does nothing.
 * - It is never sorted, filtered or changed here.
 */
export function useWards(initialWards?: Ward[]) {
  const api = useApi();
  return useQuery({
    ...wardsQuery(api),
    initialData:
      initialWards && initialWards.length > 0 ? initialWards : undefined,
  });
}
