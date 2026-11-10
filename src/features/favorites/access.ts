// Who may save listings, and where the saved page is (scope #14, api-for-frontend.md 6.33).
// Pure: no React, no router.

import { can } from "@/lib/session/can";
import type { SessionState } from "@/lib/session/create-session";

/** The page of saved listings of a renter (spec 0001, spec 0005). */
export const FAVORITES_PATH = "/favorites";

type UserSession = Extract<SessionState, { status: "user" }>;

/**
 * True for a signed in person who gets a heart: not an admin (the backend answers 403 to an admin
 * even when the permission is granted) and with `favorite:create`, which a landlord does not have
 * unless an admin grants it. When this is false no favorite read is made and no heart is drawn.
 * Hiding a heart is a convenience: the backend decides.
 */
export const mayFavorite = (session: SessionState): session is UserSession =>
  session.status === "user" &&
  session.user.accountType !== "admin" &&
  can(session, "favorite:create");
