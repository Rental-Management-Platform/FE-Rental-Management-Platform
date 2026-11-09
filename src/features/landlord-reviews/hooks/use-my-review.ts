"use client";

import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/session/auth-provider";
import { myReviewQuery } from "../api/review-queries";

/**
 * My review and whether I may write one (spec 0013, AC-2 and AC-6). `enabled` is true only for a
 * `writer`, so a guest, a landlord and an admin never make this call.
 */
export function useMyReview(landlordId: string, enabled: boolean) {
  const api = useApi();
  return useQuery({ ...myReviewQuery(api, landlordId), enabled });
}
