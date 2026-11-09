// Who uses chat and where each side finds it (spec 0012, AC-2). Pure: no React, no router.

import type { AccountType } from "@/lib/api/types";
import { can } from "@/lib/session/can";
import type { SessionState } from "@/lib/session/create-session";

/** The inbox of a renter, inside the public frame. */
export const TENANT_CHAT_BASE = "/tin-nhan";
/** The inbox of a landlord, inside the landlord area (the side menu stays). */
export const LANDLORD_CHAT_BASE = "/landlord/tin-nhan";

/**
 * The address of the inbox of an account type, and the root of its conversation pages
 * (`<base>/<id>`). An admin has no chat, so `null`. Every chat link is built from this, so the
 * two sets of addresses never drift apart.
 */
export function chatBasePath(accountType: AccountType): string | null {
  switch (accountType) {
    case "tenant":
      return TENANT_CHAT_BASE;
    case "landlord":
      return LANDLORD_CHAT_BASE;
    case "admin":
      return null;
  }
}

type UserSession = Extract<SessionState, { status: "user" }>;

/**
 * True for a signed in renter or landlord who may read conversations. An admin gets 403 from all
 * seven chat calls even when granted the permission, so an admin never counts. When this is
 * false no chat request is made and no indicator is drawn.
 */
export const canUseChat = (session: SessionState): session is UserSession =>
  session.status === "user" &&
  chatBasePath(session.user.accountType) !== null &&
  can(session, "conversation:read");
