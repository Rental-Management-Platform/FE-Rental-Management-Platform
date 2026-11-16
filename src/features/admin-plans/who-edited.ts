// Turns the `updatedBy` of a setting into the words for "who changed it last" (scope #22). The API
// gives only an id (api-for-frontend.md, 6.24), so the name is looked up in the list of admins.
// Pure: no React, no router.

import type { Uuid } from "@/lib/api/types";
import { SOMEONE, YOU } from "./admin-plans-text";
import type { AdminName } from "./api/settings";

/**
 * "bạn" when the admin who is reading is the one who saved, else the name (or the email when the
 * admin has no name) found in the list, else "một quản trị viên". The last one is also the answer
 * when the id is `null` (the admin who saved was deleted since) or the list has not loaded, failed,
 * or does not hold this id (more than 50 admins).
 */
export function whoEdited(
  updatedBy: Uuid | null,
  me: Uuid | null,
  admins: readonly AdminName[] | undefined,
): string {
  if (updatedBy === null) return SOMEONE;
  if (updatedBy === me) return YOU;
  const found = admins?.find((admin) => admin.id === updatedBy);
  if (found === undefined) return SOMEONE;
  const name = found.name?.trim();
  return name ? name : found.email;
}
