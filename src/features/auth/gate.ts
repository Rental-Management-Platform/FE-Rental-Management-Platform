// The decisions of the route gate, kept apart from React so they can be read and tested as
// plain functions (spec 0005, AC-9 and AC-10).

import type { AccountType } from "@/lib/api/types";
import type { SessionState } from "@/lib/session/create-session";

export type SessionStatus = SessionState["status"];

/** Where the gate sends the person, or `null` when it stays. */
export type GateRedirect = "login" | "home" | null;

/**
 * What the gate does when the session changes from `previous` to `state`:
 *  - A guest who was never signed in, or whose session ended with a reason (it expired, was
 *    closed elsewhere, or the account was locked): to sign in, whether the state arrived from
 *    `user` or from `loading` (a reload after the session ended).
 *  - A guest right after `user` with no reason: the person signed out on purpose, so to the
 *    home page. Sending them to sign in would be the opposite of what they just did.
 *  - `unavailable` stays: the session may still be valid, and the gate offers a retry.
 */
export function gateRedirect(
  previous: SessionStatus,
  state: SessionState,
): GateRedirect {
  if (state.status !== "guest") return null;
  if (state.endedReason === "unavailable") return null;
  if (state.endedReason === null && previous === "user") return "home";
  return "login";
}

export type GateView = "loading" | "unavailable" | "forbidden" | "content";

/**
 * What the gate draws. A guest sees the loading state while the redirect happens, so nothing of
 * the page is shown to them. A signed in person of another account type is told so.
 */
export function gateView(
  state: SessionState,
  accountType: AccountType | undefined,
): GateView {
  if (state.status === "loading") return "loading";
  if (state.status === "guest") {
    return state.endedReason === "unavailable" ? "unavailable" : "loading";
  }
  if (accountType !== undefined && state.user.accountType !== accountType) {
    return "forbidden";
  }
  return "content";
}
