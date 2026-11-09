// The calls of the reviews zone (api-for-frontend.md, 6.40), one function each. They take the
// client and, for a read, the `signal` TanStack hands a `queryFn`, so a call that is left behind is
// cancelled. Nothing here logs, stores or sends the text of a comment anywhere but the request body
// (spec 0013, AC-18).

import type { ApiClient } from "@/lib/api/client";
import type {
  CreateReviewBody,
  MyReview,
  MyReviewState,
  Page,
  PublicReview,
  UpdateReviewBody,
} from "@/lib/api/types";
import { REVIEWS_PAGE_SIZE } from "@/features/reviews/review-list";

const enc = encodeURIComponent;

/**
 * `GET /landlords/:id/reviews`: the visible reviews, newest first. The login is optional: with a
 * token each row carries `isMine`, without one it is `null`, and it is never a 401.
 */
export const getReviews = (
  api: ApiClient,
  landlordId: string,
  page: number,
  signal?: AbortSignal,
) =>
  api.get<Page<PublicReview>>(`/landlords/${enc(landlordId)}/reviews`, {
    query: { page, pageSize: REVIEWS_PAGE_SIZE },
    auth: "optional",
    signal,
  });

/** `GET /landlords/:id/review` (`review:read`, renters only): my review and whether I may write one. */
export const getMyReview = (
  api: ApiClient,
  landlordId: string,
  signal?: AbortSignal,
) =>
  api.get<MyReviewState>(`/landlords/${enc(landlordId)}/review`, {
    auth: "required",
    signal,
  });

/** `POST /landlords/:id/review` (`review:create`), 201. A create call: it is never sent twice by itself. */
export const createReview = (
  api: ApiClient,
  landlordId: string,
  body: CreateReviewBody,
) => api.post<MyReview>(`/landlords/${enc(landlordId)}/review`, body);

/** `PATCH /landlords/:id/review` (`review:update`): the body is never empty. */
export const updateReview = (
  api: ApiClient,
  landlordId: string,
  body: UpdateReviewBody,
) => api.patch<MyReview>(`/landlords/${enc(landlordId)}/review`, body);

/** `DELETE /landlords/:id/review` (`review:delete`), 204. */
export const deleteReview = (api: ApiClient, landlordId: string) =>
  api.delete<void>(`/landlords/${enc(landlordId)}/review`);
