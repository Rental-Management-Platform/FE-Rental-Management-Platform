import type { AccountType, PermissionKey } from "@/lib/api/types";
import { can } from "@/lib/session/can";
import type { SessionState } from "@/lib/session/create-session";

// Hiding an item is a convenience: the backend still decides what a person may do. An item with a
// permission shows to anyone who has it. An item with an `accountType` also needs that type, for a
// page that is closed to the other types even when an admin hands them the permission (an admin
// has every permission and still gets 403 on the saved listings).
export function visibleNavItems<
  T extends { permission?: PermissionKey; accountType?: AccountType },
>(items: readonly T[], state: SessionState): T[] {
  return items.filter(
    (item) =>
      (item.permission === undefined || can(state, item.permission)) &&
      (item.accountType === undefined ||
        (state.status === "user" &&
          state.user.accountType === item.accountType)),
  );
}
