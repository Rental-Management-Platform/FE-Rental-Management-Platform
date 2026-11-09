import type { LandlordProfile } from "@/lib/api/types";
import { can } from "@/lib/session/can";
import type { SessionState } from "@/lib/session/create-session";

/** What the follow control shows. One value, so the control is easy to draw and to preview. */
export type FollowView =
  /** The session is loading, or a signed in person's read of `isFollowing` is still coming. */
  | { kind: "checking" }
  /** A guest: the button stays and leads to sign in. */
  | { kind: "guest" }
  /** No button: an admin, a landlord without `follow:create`, or the landlord's own profile. */
  | { kind: "hidden" }
  | {
      kind: "ready";
      following: boolean;
      /** False when the person follows but has no `follow:delete`: the button cannot undo it. */
      canChange: boolean;
    }
  | {
      kind: "failed";
      /** `gone` is a 404: the landlord is not there any more. */
      reason: "gone" | "error";
      error: unknown;
    };

/** The part of a TanStack query result the control reads. */
export type FollowQuery = {
  isError: boolean;
  isFetching: boolean;
  data: Pick<LandlordProfile, "isFollowing"> | undefined;
  error: unknown;
};

const isNotFound = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "status" in error &&
  error.status === 404;

/**
 * The rule of the follow button (api-for-frontend.md, 6.32), in this order:
 * 1. The session is `loading`: checking, so a person who has a session never sees the sign in
 *    button flash.
 * 2. A guest keeps the button, and it leads to sign in.
 * 3. No button for an admin (the backend answers 403 even with the permission), for a person
 *    without `follow:create` (a landlord), or on one's own profile.
 * 4. Anyone else reads `isFollowing` with the token. It is `null` until that read has come back.
 *    A read that failed shows its failure with a retry, and a read that is being tried again
 *    shows checking.
 */
export function toFollowView(
  session: SessionState,
  landlordId: string,
  query: FollowQuery,
): FollowView {
  if (session.status === "loading") return { kind: "checking" };
  if (session.status === "guest") return { kind: "guest" };

  const { user } = session;
  if (
    user.accountType === "admin" ||
    user.id === landlordId ||
    !can(session, "follow:create")
  ) {
    return { kind: "hidden" };
  }

  const following = query.data?.isFollowing ?? null;
  if (following !== null) {
    return {
      kind: "ready",
      following,
      canChange: !following || can(session, "follow:delete"),
    };
  }

  if (query.isError && !query.isFetching) {
    return {
      kind: "failed",
      reason: isNotFound(query.error) ? "gone" : "error",
      error: query.error,
    };
  }
  return { kind: "checking" };
}
