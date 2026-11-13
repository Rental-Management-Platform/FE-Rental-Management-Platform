import type { ApiClient } from "@/lib/api/client";
import type { MessageResponse, ResetPasswordBody } from "@/lib/api/types";

/**
 * `POST /auth/forgot-password` (api-for-frontend.md, 6.7): a public call that answers 202 with
 * the same sentence for every email, so the page can say nothing about whether the email has an
 * account. No token and no session are involved (`auth: "none"`).
 */
export const requestPasswordReset = (api: ApiClient, email: string) =>
  api.post<MessageResponse>(
    "/auth/forgot-password",
    { email },
    { auth: "none" },
  );

/**
 * `POST /auth/reset-password` (6.8): answers 204, sets the new password and ends every session of
 * the account. A `VALIDATION_FAILED` answer leaves the link unused, so the person can try again.
 */
export const resetPassword = (api: ApiClient, body: ResetPasswordBody) =>
  api.post<void>("/auth/reset-password", body, { auth: "none" });
