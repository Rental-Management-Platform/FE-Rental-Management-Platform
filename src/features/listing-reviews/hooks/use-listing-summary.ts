"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/session/auth-provider";
import type { ListingSummary } from "../api/review-api";
import { listingSummaryQuery } from "../api/review-queries";

/**
 * The two numbers under the heading (spec 0014, AC-3 and AC-4): `reviewCount` and `ratingAverage` of
 * the listing detail. They start as the numbers the server read (`initial`), and the invalidate
 * after a write is the only thing that reads them again. A failed read keeps the old numbers and
 * shows nothing. The block never computes an average and never takes the count from the list.
 */
export function useListingSummary(
  listingId: string,
  code: string,
  initial: ListingSummary,
) {
  const api = useApi();
  return useQuery({
    ...listingSummaryQuery(api, listingId, code),
    initialData: initial,
  });
}
