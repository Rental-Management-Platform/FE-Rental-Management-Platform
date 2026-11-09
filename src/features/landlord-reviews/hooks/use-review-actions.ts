"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { landlordKeys } from "@/features/landlord-profile/api/landlord-keys";
import type {
  CreateReviewBody,
  MyReviewState,
  UpdateReviewBody,
} from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { createReview, deleteReview, updateReview } from "../api/review-api";
import { reviewKeys } from "../api/review-keys";
import { classifyReviewError, type ReviewAction } from "../review-errors";

/** How a delete ended: it worked, or there was nothing left to delete (it counts as done). */
export type DeleteOutcome = "deleted" | "already-gone";

/**
 * The writes of the reviews zone (spec 0013, AC-8, AC-9, AC-10 and AC-14). There is no optimistic
 * change: the row changes when the server has answered. None of them retries by itself, because a
 * write is not safe to repeat. Each returns the promise of its call, so the component that sent it
 * can clear itself, move focus and announce the result once the cache is up to date.
 *
 * After a write the answer goes straight into the `mine` key, the lists of this landlord are read
 * again, and so is the shared profile query of the landlord (`landlordKeys.profile`), which is how
 * the stars and the counts at the top of the page change (AC-16). After a failure, what
 * `classifyReviewError` says is stale is read again, so the zone shows what is true now.
 */
export function useReviewActions(landlordId: string) {
  const api = useApi();
  const queryClient = useQueryClient();
  const mineKey = reviewKeys.mine(landlordId);

  const invalidateLists = () =>
    queryClient.invalidateQueries({ queryKey: reviewKeys.lists(landlordId) });
  const invalidateProfile = () =>
    queryClient.invalidateQueries({
      queryKey: landlordKeys.profile(landlordId),
    });

  // The lists and the numbers at the top of the profile changed with any write.
  const refreshAfterWrite = () => {
    void invalidateLists();
    void invalidateProfile();
  };

  const reloadAfterFailure = (error: unknown, action: ReviewAction) => {
    const { reload } = classifyReviewError(error, action);
    if (reload.mine) {
      void queryClient.invalidateQueries({ queryKey: mineKey });
    }
    if (reload.lists) void invalidateLists();
    if (reload.profile) void invalidateProfile();
  };

  const create = useMutation({
    mutationFn: (body: CreateReviewBody) => createReview(api, landlordId, body),
    onSuccess: (review) => {
      queryClient.setQueryData<MyReviewState>(mineKey, {
        review,
        canReview: false,
      });
      refreshAfterWrite();
    },
    onError: (error) => reloadAfterFailure(error, "create"),
  });

  const update = useMutation({
    mutationFn: (body: UpdateReviewBody) => updateReview(api, landlordId, body),
    onSuccess: (review) => {
      // `canReview` is false while a review exists, and an edit does not change that.
      queryClient.setQueryData<MyReviewState>(mineKey, {
        review,
        canReview: false,
      });
      refreshAfterWrite();
    },
    onError: (error) => reloadAfterFailure(error, "update"),
  });

  const remove = useMutation({
    // A review that is not there any more is what the person wanted: the call ends as a success,
    // and the caller says "Đánh giá đã được xóa trước đó." (AC-14).
    mutationFn: async (): Promise<DeleteOutcome> => {
      try {
        await deleteReview(api, landlordId);
        return "deleted";
      } catch (error) {
        if (classifyReviewError(error, "delete").alreadyDone) {
          return "already-gone";
        }
        throw error;
      }
    },
    onSuccess: async () => {
      queryClient.setQueryData<MyReviewState>(mineKey, {
        review: null,
        canReview: false,
      });
      refreshAfterWrite();
      // Whether the person may write again is only known from the server (a landlord who stopped
      // answering, say). The mutation waits for that one read, so the dialog stays open over the
      // page and the card is replaced by the form or the hint in one step, not by a flash of the
      // hint first. `refetchQueries` does not throw: a read that fails is not worth an error on a
      // delete that worked.
      await queryClient.refetchQueries({ queryKey: mineKey });
    },
    onError: (error) => reloadAfterFailure(error, "delete"),
  });

  return {
    create: create.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    /** True while the delete call, and the read that follows it, are running. */
    removing: remove.isPending,
  };
}
