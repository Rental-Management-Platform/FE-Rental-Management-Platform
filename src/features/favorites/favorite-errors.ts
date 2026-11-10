import { describeError, isApiError } from "@/lib/api/errors";
import { formatWait } from "@/lib/format";

export const LISTING_GONE_MESSAGE = "Tin này không còn.";
export const NO_FAVORITE_PERMISSION_MESSAGE = "Bạn không có quyền lưu tin.";

export type FavoriteFailure =
  /** A 429: the heart stays locked until the wait ends. */
  | { kind: "rate-limited"; message: string }
  /** The listing is not visible any more, so the page is asked to draw itself again. */
  | { kind: "gone"; message: string }
  | { kind: "message"; message: string };

/**
 * What a failed save or unsave means for the heart (api-for-frontend.md, 6.33). Pure: no React.
 * A 401 and `ACCOUNT_LOCKED` are not here: the session layer ends the session (spec 0002).
 * Nothing is sent again by itself: both calls are safe to repeat, but the person decides.
 */
export function classifyFavoriteError(error: unknown): FavoriteFailure {
  if (isApiError(error)) {
    if (error.status === 429) {
      const wait =
        error.retryAfterSeconds === null
          ? ""
          : ` Hãy thử lại sau ${formatWait(error.retryAfterSeconds, {
              approximate: !error.retryAfterExact,
            })}.`;
      return {
        kind: "rate-limited",
        message: `Bạn thao tác quá nhanh.${wait}`,
      };
    }
    switch (error.code) {
      // Only a save can answer this: the listing was hidden or deleted since the page opened.
      case "LISTING_NOT_FOUND":
        return { kind: "gone", message: LISTING_GONE_MESSAGE };
      case "PERMISSION_DENIED":
        return { kind: "message", message: NO_FAVORITE_PERMISSION_MESSAGE };
    }
  }
  return { kind: "message", message: describeError(error).message };
}
