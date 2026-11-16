// Who may buy a plan (scope #18, api-for-frontend.md 6.27). Pure: no React, no router.

import { can } from "@/lib/session/can";
import type { SessionState } from "@/lib/session/create-session";

type UserSession = Extract<SessionState, { status: "user" }>;

/**
 * True for a signed in landlord who holds `order:create`. An admin is left out on purpose: the
 * backend answers 403 `PERMISSION_DENIED` to an admin even when the permission is granted ("admin
 * không mua gói"), so a button would only lead to a refusal. A renter has no order permission at
 * all. Hiding the button is a convenience: the backend decides every press.
 */
export const canBuyPlans = (session: SessionState): session is UserSession =>
  session.status === "user" &&
  session.user.accountType === "landlord" &&
  can(session, "order:create");
