// What a subject (a landlord, a room) hands to the shared reviews view and write block (spec 0014,
// "The adapter"). Types only.

import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type {
  CreateReviewBody,
  MyReviewState,
  Page,
  PublicReview,
  UpdateReviewBody,
} from "@/lib/api/types";
import type { ReviewClassifier } from "./review-errors";

/** How a delete ended: it worked, or there was nothing left to delete (it counts as done). */
export type DeleteOutcome = "deleted" | "already-gone";

/**
 * The three writes of a subject, as plain functions. Each returns the promise of its call, so the
 * component that sent it can clear itself, move focus and announce the result once the cache is up
 * to date. None of them retries by itself, because a write is not safe to repeat.
 */
export interface ReviewActions {
  create: (body: CreateReviewBody) => Promise<unknown>;
  update: (body: UpdateReviewBody) => Promise<unknown>;
  /** Settles after the read of `mine` that follows the delete. */
  remove: () => Promise<DeleteOutcome>;
  /** True while the delete call, and the read that follows it, are running. */
  removing: boolean;
}

/** One reviews area as a subject describes it. The shared view draws it and calls no data hook. */
export interface ReviewSubject {
  /** One page of the public list. */
  list: UseQueryResult<Page<PublicReview>>;
  /** `GET /review`; it runs only for a `writer`. */
  mine: UseQueryResult<MyReviewState>;
  actions: ReviewActions;
  /** The subject's classifier, bound to its vocabulary. */
  classify: ReviewClassifier;
  /** The heading of the area: "Đánh giá", "Đánh giá phòng". */
  heading: string;
  /** The line under the heading, or `null` while the numbers are not known. */
  summary: ReactNode;
  /** The label of the guest's row: "Đăng nhập để đánh giá chủ trọ". */
  guestLabel: string;
  /** What a renter who may not review yet sees, or `null` for nothing at all. */
  hint: ReactNode;
  /** A write failed because the subject is gone: the subject decides what the page does. */
  onGone: () => void;
}
