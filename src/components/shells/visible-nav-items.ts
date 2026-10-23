import type { PermissionKey } from "@/lib/api/types";
import { can } from "@/lib/session/can";
import type { SessionState } from "@/lib/session/create-session";

// Hiding an item is a convenience: the backend still decides what a person may do.
export function visibleNavItems<T extends { permission?: PermissionKey }>(
  items: readonly T[],
  state: SessionState,
): T[] {
  return items.filter(
    (item) => item.permission === undefined || can(state, item.permission),
  );
}
