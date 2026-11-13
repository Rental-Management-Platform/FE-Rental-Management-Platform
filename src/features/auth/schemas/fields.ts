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

const PHONE_REQUIRED = "Người đăng bài cần có số điện thoại.";
const PHONE_FORMAT =
  "Số điện thoại di động Việt Nam gồm 10 số, ví dụ 0912 345 678.";

/**
 * What a Vietnamese mobile number looks like to this check: spaces, dots and dashes dropped, and
 * a leading `+84` or `84` turned into `0`. The change is for comparing and checking only. What is
 * sent is what the person typed, and the backend normalizes it.
 */
export const compactPhone = (phone: string) =>
  phone.replace(/[\s.-]/g, "").replace(/^(\+84|84)/, "0");

/** A Vietnamese mobile number: `0`, one of `3 5 7 8 9`, then 8 digits. */
export const isVietnamMobile = (phone: string) =>
  /^0[35789]\d{8}$/.test(compactPhone(phone));

/**
 * The message for a phone box that does not pass, or `null` when it does. Blank means nothing was
 * typed (`trim() === ''`): only a landlord must have a number, and anyone who typed one gets the
 * format check. Sign up and the account page share this one rule.
 */
export function phoneIssue(phone: string, required: boolean): string | null {
  if (phone.trim() === "") return required ? PHONE_REQUIRED : null;
  return isVietnamMobile(phone) ? null : PHONE_FORMAT;
}

export const PASSWORD_MESSAGE = "Mật khẩu cần từ 8 đến 128 ký tự.";

/**
 * A new password: 8 to 128 characters. Spaces are kept as typed, because the backend keeps them
 * too. Sign up, password reset and (later) change password all use this one rule.
 */
export const passwordField = z
  .string()
  .min(8, PASSWORD_MESSAGE)
  .max(128, PASSWORD_MESSAGE);
