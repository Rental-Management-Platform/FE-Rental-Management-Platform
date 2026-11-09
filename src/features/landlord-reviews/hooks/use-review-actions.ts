"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { landlordKeys } from "@/features/landlord-profile/api/landlord-keys";
import type { CreateReviewBody, MyReviewState } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { createReview } from "../api/review-api";
import { reviewKeys } from "../api/review-keys";

/**
 * The writes of the reviews zone (spec 0013, AC-8). There is no optimistic change: the pinned row
 * appears when the server has the review. None of them retries by itself, because a write is not
 * safe to repeat. Each returns the promise of its call, so the form that sent it can clear itself,
 * move focus and announce the result after the cache is up to date.
 *
 * After a write the answer goes straight into the `mine` key, the lists of this landlord are read
 * again, and so is the shared profile query of the landlord (`landlordKeys.profile`), which is how
 * the stars and the counts at the top of the page change (AC-16).
 */
export function useReviewActions(landlordId: string) {
  const api = useApi();
  const queryClient = useQueryClient();

  // The lists and the numbers at the top of the profile changed with any write.
  const refreshAfterWrite = () => {
    void queryClient.invalidateQueries({
      queryKey: reviewKeys.lists(landlordId),
    });
    void queryClient.invalidateQueries({
      queryKey: landlordKeys.profile(landlordId),
    });
  };

  const create = useMutation({
    mutationFn: (body: CreateReviewBody) => createReview(api, landlordId, body),
    onSuccess: (review) => {
      queryClient.setQueryData<MyReviewState>(reviewKeys.mine(landlordId), {
        review,
        canReview: false,
      });
      refreshAfterWrite();
    },
  });

  return { create: create.mutateAsync };
}
