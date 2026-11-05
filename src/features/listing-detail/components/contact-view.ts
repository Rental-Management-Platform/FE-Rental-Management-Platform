import { isApiError } from "@/lib/api/errors";
import type { SessionState } from "@/lib/session/create-session";

/** What the contact card shows. One value, so the card is easy to draw and to preview. */
export type ContactView =
  /** The session is loading, or a signed in person's phone read is pending. */
  | { kind: "checking" }
  /** A guest, including a failed session restore (`endedReason: "unavailable"`). */
  | { kind: "guest" }
  /** The viewer is the landlord of this listing: no phone read is made. */
  | { kind: "own" }
  | { kind: "ready"; phone: string }
  | {
      kind: "failed";
      reason: "no-phone" | "gone" | "error";
      /** The thrown error, for `reason: "error"`. A 429 shows the countdown. */
      error?: unknown;
    };

/** The part of a TanStack query result the card reads. */
export type ContactQuery = {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  data: { landlord: { phone: string | null } } | undefined;
  error: unknown;
};

/**
 * The rule of spec 0010 (AC-8, AC-9), in this order:
 * 1. The session is `loading`: checking, so a person who has a session never sees the sign in
 *    button flash.
 * 2. A guest: the sign in card.
 * 3. A signed in person who is the landlord of this listing: their own card, and the read stays
 *    off.
 * 4. Anyone else signed in reads the listing. Pending is checking. TanStack keeps
 *    `status: "error"` while a retry runs, so a failed answer that is being read again is also
 *    checking. A phone is ready. `phone: null` is a failure (a token that did not count), a 404
 *    means the listing is gone, any other error is a general failure.
 */
export function toContactView(
  session: SessionState,
  landlordId: string,
  query: ContactQuery,
): ContactView {
  if (session.status === "loading") return { kind: "checking" };
  if (session.status === "guest") return { kind: "guest" };
  if (session.user.id === landlordId) return { kind: "own" };

  if (query.isPending) return { kind: "checking" };

  const settled = settledView(query);
  // A failed card that is being read again shows the checking state, not the old failure.
  if (settled.kind === "failed" && query.isFetching) {
    return { kind: "checking" };
  }
  return settled;
}

function settledView(query: ContactQuery): ContactView {
  if (query.isError) {
    return isApiError(query.error) && query.error.status === 404
      ? { kind: "failed", reason: "gone" }
      : { kind: "failed", reason: "error", error: query.error };
  }
  const phone = query.data?.landlord.phone ?? null;
  return phone === null
    ? { kind: "failed", reason: "no-phone" }
    : { kind: "ready", phone };
}
