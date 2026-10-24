import { z } from "zod";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.2). Messages are
// the Vietnamese sentences of spec 0005, "Copy".

const EMAIL_MAX = 254;

// One `@` with text on both sides and a dot in the domain. Nothing stricter on purpose.
const LOOSE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Trimmed before the check and before sending, never lowercased (the backend does that), so
 * what the person typed is what is sent.
 */
export const emailField = z
  .string()
  .trim()
  .min(1, "Nhập email của bạn.")
  .max(EMAIL_MAX, `Email tối đa ${EMAIL_MAX} ký tự.`)
  .regex(LOOSE_EMAIL, "Email không đúng định dạng.");
