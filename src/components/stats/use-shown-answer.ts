import type { UseQueryResult } from "@tanstack/react-query";

export interface ShownAnswer<T> {
  /** The answer to draw, or `undefined` while there is none to draw (see below). */
  data: T | undefined;
  /** The answer is the one of the range before, kept while a new range loads. */
  placeholder: boolean;
}

/**
 * The answer a statistics screen may draw (spec 0024, AC-16, and spec 0025, AC-4 and AC-13). The
 * answer of the range before stays on screen while a new range loads. But once a range has failed,
 * "Thử lại" starts from the loading state (error to loading), so old numbers never come back under
 * the range that failed: a placeholder answer on a query that has an error is not drawn.
 *
 * Each screen decides what "busy" means from `placeholder` and `query.isFetching`: the landlord
 * screen only for a new range, the admin screen for any read while an answer is drawn.
 */
export function useShownAnswer<T>(
  query: Pick<
    UseQueryResult<T>,
    "data" | "isPlaceholderData" | "errorUpdatedAt"
  >,
): ShownAnswer<T> {
  const failedRange = query.isPlaceholderData && query.errorUpdatedAt > 0;
  return {
    data: failedRange ? undefined : query.data,
    placeholder: query.isPlaceholderData,
  };
}
