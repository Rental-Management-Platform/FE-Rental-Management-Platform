import { can } from "@/lib/session/can";
import type { SessionState } from "@/lib/session/create-session";
import { mayFavorite } from "./access";

/** What one heart shows. One value, so the control is easy to draw and to preview. */
export type HeartView =
  /** The session is loading, or the read of the flags of a signed in person is still coming. */
  | { kind: "checking" }
  /** A guest: the heart stays and leads to sign in. */
  | { kind: "guest" }
  /** No heart: an admin, or a person without `favorite:create`. */
  | { kind: "hidden" }
  | {
      kind: "ready";
      saved: boolean;
      /** False when the listing is saved but the person has no `favorite:delete`. */
      canChange: boolean;
    }
  /** The read of the flag failed or answered `null`. Pressing the heart reads it again. */
  | { kind: "failed" };

/**
 * What a place knows about the flag of one listing: `undefined` while the read is still coming,
 * `null` when it failed or the answer was the guest one, else the flag.
 */
export type HeartFlag = boolean | null | undefined;

/**
 * The rule of the heart (api-for-frontend.md, 6.33), in this order:
 * 1. The session is `loading`: checking, so a person who has a session never sees the sign in
 *    heart flash.
 * 2. A guest keeps the heart, and it leads to sign in.
 * 3. No heart for an admin, or for a person without `favorite:create`.
 * 4. Anyone else needs the flag from the read made with the token. A flag that has not come back
 *    is checking, and a flag that failed or came back `null` (a read that went out as a guest)
 *    is failed, never a guess.
 */
export function toHeartView(session: SessionState, flag: HeartFlag): HeartView {
  if (session.status === "loading") return { kind: "checking" };
  if (session.status === "guest") return { kind: "guest" };
  if (!mayFavorite(session)) return { kind: "hidden" };

  if (flag === undefined) return { kind: "checking" };
  if (flag === null) return { kind: "failed" };
  return {
    kind: "ready",
    saved: flag,
    canChange: !flag || can(session, "favorite:delete"),
  };
}
