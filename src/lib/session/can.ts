import type { PermissionKey } from "@/lib/api/types";
import type { SessionState } from "./create-session";

// A permission check only. Account type rules such as "an admin never saves listings" stay
// in the feature. Hiding a control is a convenience: the backend decides.
export function can(state: SessionState, key: PermissionKey): boolean {
  return state.status === "user" && state.permissions.includes(key);
}
