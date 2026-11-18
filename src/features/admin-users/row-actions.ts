// Which buttons a row of the users table offers, as one rule (scope #20, spec 0023, AC-5). Pure:
// no React, no session.

import type { AdminUserListItem } from "@/lib/api/types";

/** What one row offers to the person looking at it. */
export interface RowActions {
  /** The row is the viewer's own account: no button, only the words "Tài khoản của bạn". */
  mine: boolean;
  /** "Khóa", `user:lock`: an active account of another person. */
  lock: boolean;
  /** "Mở khóa", `user:lock`: a locked account. */
  unlock: boolean;
  /** "Thu hồi phiên", `user:revoke`: an active account of another person. */
  revoke: boolean;
}

/**
 * One rule for every row:
 * - the viewer's own row has no button (the API refuses a lock of yourself, `CANNOT_LOCK_SELF`,
 *   and cutting your own sessions would only sign you out, which the sign out button already does);
 * - an active account of another person offers "Khóa" and "Thu hồi phiên";
 * - a locked account offers only "Mở khóa", because a lock already ended every session.
 * Each button needs its permission. Hiding a button is a convenience: the backend decides.
 */
export function rowActions(
  user: Pick<AdminUserListItem, "id" | "status">,
  viewerId: string | null,
  permissions: { lock: boolean; revoke: boolean },
): RowActions {
  const mine = viewerId !== null && user.id === viewerId;
  const others = !mine;
  return {
    mine,
    lock: others && user.status === "active" && permissions.lock,
    unlock: others && user.status === "locked" && permissions.lock,
    revoke: others && user.status === "active" && permissions.revoke,
  };
}
