"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReviewAction } from "@/features/reviews/review-errors";
import type { DeleteOutcome, ReviewActions } from "@/features/reviews/types";
import type {
  CreateReviewBody,
  MyReviewState,
  UpdateReviewBody,
} from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import {
  createListingReview,
  deleteListingReview,
  updateListingReview,
} from "../api/review-api";
import { listingReviewKeys } from "../api/review-keys";
import { classifyListingReview } from "../review-errors";

/**
 * The writes of the room reviews block (spec 0014, AC-11 to AC-13 and AC-17). There is no
 * optimistic change: the row changes when the server has answered. None of them retries by itself,
 * because a write is not safe to repeat. Each returns the promise of its call, so the component
 * that sent it can clear itself, move focus and announce the result once the cache is up to date.
 *
 * After a write the answer goes straight into the `mine` key, and the lists and the summary of this
 * room are read again (the summary is how the stars and the count under the heading change). A room
 * write never touches a landlord key. After a failure, what `classifyListingReview` says is stale is
 * read again. A listing that is gone is not handled here: the block's `onGone` refreshes the page.
 */
export function useListingReviewActions(listingId: string): ReviewActions {
  const api = useApi();
  const queryClient = useQueryClient();
  const mineKey = listingReviewKeys.mine(listingId);

  const invalidateLists = () =>
    queryClient.invalidateQueries({
      queryKey: listingReviewKeys.lists(listingId),
    });
  const invalidateSummary = () =>
    queryClient.invalidateQueries({
      queryKey: listingReviewKeys.summary(listingId),
    });

  // The lists and the two numbers changed with any write.
  const refreshAfterWrite = () => {
    void invalidateLists();
    void invalidateSummary();
  };

  const reloadAfterFailure = (error: unknown, action: ReviewAction) => {
    const { reload } = classifyListingReview(error, action);
    if (reload.mine) {
      void queryClient.invalidateQueries({ queryKey: mineKey });
    }
    if (reload.lists) void invalidateLists();
    if (reload.summary) void invalidateSummary();
  };

  const create = useMutation({
    mutationFn: (body: CreateReviewBody) =>
      createListingReview(api, listingId, body),
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
    mutationFn: (body: UpdateReviewBody) =>
      updateListingReview(api, listingId, body),
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
    // and the caller says "Đánh giá đã được xóa trước đó." (AC-17).
    mutationFn: async (): Promise<DeleteOutcome> => {
      try {
        await deleteListingReview(api, listingId);
        return "deleted";
      } catch (error) {
        if (classifyListingReview(error, "delete").alreadyDone) {
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
      // Whether the person may write again is only known from the server (the chat is still
      // there, so usually yes). The mutation waits for that one read, so the dialog stays open over
      // the page and the card is replaced by the form or the hint in one step. `refetchQueries` does
      // not throw: a read that fails is not worth an error on a delete that worked.
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
