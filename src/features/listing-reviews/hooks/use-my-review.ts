"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/session/auth-provider";
import { myListingReviewQuery } from "../api/review-queries";

/**
 * My review of the room and whether I may write one (spec 0014, AC-5 and AC-8). `enabled` is true
 * only for a `writer`, so a guest, a landlord and an admin never make this call.
 */
export function useMyListingReview(listingId: string, enabled: boolean) {
  const api = useApi();
  return useQuery({ ...myListingReviewQuery(api, listingId), enabled });
}
