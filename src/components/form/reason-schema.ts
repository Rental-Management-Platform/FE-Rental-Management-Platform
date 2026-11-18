import { z } from "zod";

/**
 * The most characters a reason can have (api-for-frontend.md: lock and unlock a user, hide and
 * unhide a listing, hide and unhide a review all take a `reason` of 1 to 500 characters).
 */
export const REASON_MAX = 500;

/**
 * The reason of a moderation or lock action: trimmed, 1 to `REASON_MAX` characters. The messages
 * are the ones shown under the field. The backend is the real validator; this stops the empty and
 * the too long reason in the browser, so no request is spent on them.
 */
export const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Nhập lý do.")
    .max(REASON_MAX, `Lý do tối đa ${REASON_MAX} ký tự.`),
});

export type ReasonValues = z.input<typeof reasonSchema>;
