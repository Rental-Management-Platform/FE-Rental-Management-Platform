// Who sees what in the reviews zone (spec 0013, AC-2). Pure: no React, no router.

import { can } from "@/lib/session/can";
import type { SessionState } from "@/lib/session/create-session";

/**
 * - `loading`: the session is still restoring, so nothing that depends on the person runs yet.
 * - `guest`: reads the list, and sees a row that leads to sign in.
 * - `writer`: a signed in renter who may read their own review. Only this role calls
 *   `GET /landlords/:id/review`.
 * - `reader`: any other signed in person (a landlord, an admin, a renter without `review:read`).
 *   They read the list and see no write block.
 */
export type ReviewRole = "loading" | "guest" | "writer" | "reader";

/**
 * The role of the viewer in the reviews zone. An admin never writes: the backend answers 403 to an
 * admin on the four calls of `/review` even when the permission is granted, so an admin is a
 * reader. A landlord on their own profile is a reader too. Hiding a control is a convenience, and
 * the backend decides (spec 0002).
 */
export function reviewRole(session: SessionState): ReviewRole {
  switch (session.status) {
    case "loading":
      return "loading";
    case "guest":
      return "guest";
    case "user":
      return session.user.accountType === "tenant" &&
        can(session, "review:read")
        ? "writer"
        : "reader";
  }
}
