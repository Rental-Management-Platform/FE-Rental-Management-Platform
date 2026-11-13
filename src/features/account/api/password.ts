import type { ApiClient } from "@/lib/api/client";
import type { ChangePasswordBody } from "@/lib/api/types";

/**
 * `POST /auth/change-password` (api-for-frontend.md, 6.9): answers 204. Every other session of the
 * account ends, and the one in use stays, so the person is not signed out. A wrong current
 * password is 400 `CURRENT_PASSWORD_WRONG` and counts toward the limit of 10 in 15 minutes.
 */
export const changePassword = (api: ApiClient, body: ChangePasswordBody) =>
  api.post<void>("/auth/change-password", body);
