// Which server answers prove that a session is over, and why. Pure: no state, no React.
// Only a response from the server can end a session. A network error, a 5xx, a 429 or the
// local `TOKEN_MISSING` of a guest never does, so they all map to `undefined` here.

import type { ApiError } from "@/lib/api/errors";

/** The reason shown to the person, `null` for a silent end, `undefined` when it does not end. */
export type EndReason = "expired" | "revoked" | "locked" | null | undefined;

/**
 * A failed `POST /auth/refresh`. `REFRESH_TOKEN_MISSING` while someone was logged in means
 * the shared `rt` cookie is gone (a logout in another tab); on a fresh page load it only
 * means this browser never had a session, so it ends silently.
 */
export function endReasonForRefresh(
  error: ApiError,
  wasLoggedIn: boolean,
): EndReason {
  switch (error.code) {
    case "SESSION_EXPIRED":
      return "expired";
    case "SESSION_REVOKED":
      return "revoked";
    case "REFRESH_TOKEN_MISSING":
      return wasLoggedIn ? "revoked" : null;
    case "ACCOUNT_LOCKED":
      return "locked";
    default:
      return undefined;
  }
}

/**
 * A failed call that carried a token. `TOKEN_EXPIRED` is not here: it is answered with one
 * refresh and one resend, and only ends the session when the resend fails again.
 */
export function endReasonForTokenCall(error: ApiError): EndReason {
  switch (error.code) {
    case "TOKEN_INVALID":
    case "TOKEN_MISSING":
    case "UNAUTHORIZED":
      // Only for an answer that came back after a token was sent. The local `TOKEN_MISSING`
      // of a guest is made before any request, so it never reaches this function.
      return "revoked";
    case "ACCOUNT_LOCKED":
      return "locked";
    default:
      return undefined;
  }
}
