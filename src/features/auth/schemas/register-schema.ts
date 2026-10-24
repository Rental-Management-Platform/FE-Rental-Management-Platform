import { z } from "zod";
import type { RegisterBody } from "@/lib/api/types";
import { emailField } from "./fields";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.2).

export const ACCOUNT_TYPES = ["landlord", "tenant"] as const;
export type RegisterAccountType = (typeof ACCOUNT_TYPES)[number];

const PASSWORD_MESSAGE = "Mật khẩu cần từ 8 đến 128 ký tự.";
const PHONE_REQUIRED = "Người đăng bài cần có số điện thoại.";
const PHONE_FORMAT =
  "Số điện thoại di động Việt Nam gồm 10 số, ví dụ 0912 345 678.";

/**
 * A Vietnamese mobile number: after dropping spaces, dots and dashes and turning a leading
 * `+84` or `84` into `0`, it is `0`, one of `3 5 7 8 9`, then 8 digits. The change is for this
 * check only. What is sent is what the person typed, and the backend normalizes it.
 */
export function isVietnamMobile(phone: string): boolean {
  const compact = phone.replace(/[\s.-]/g, "").replace(/^(\+84|84)/, "0");
  return /^0[35789]\d{8}$/.test(compact);
}

// No type is preselected, so the form holds an empty string until a card is chosen. The
// second step turns the empty string into the "choose a type" message.
const accountTypeField = z
  .enum(["", ...ACCOUNT_TYPES])
  .pipe(z.enum(ACCOUNT_TYPES, "Chọn loại tài khoản."));

export const registerSchema = z
  .object({
    email: emailField,
    // Spaces are kept as typed: the backend keeps them too.
    password: z.string().min(8, PASSWORD_MESSAGE).max(128, PASSWORD_MESSAGE),
    name: z.string().trim().max(100, "Tên tối đa 100 ký tự."),
    phone: z.string(),
    accountType: accountTypeField,
  })
  .check((context) => {
    const { phone, accountType } = context.value;
    // Blank means nothing was typed (`trim() === ''`): only a landlord must have a number,
    // and anyone who typed one gets the format check.
    if (phone.trim() === "") {
      if (accountType === "landlord") {
        context.issues.push({
          code: "custom",
          input: phone,
          path: ["phone"],
          message: PHONE_REQUIRED,
        });
      }
    } else if (!isVietnamMobile(phone)) {
      context.issues.push({
        code: "custom",
        input: phone,
        path: ["phone"],
        message: PHONE_FORMAT,
      });
    }
  });

// What the form holds while the person types, and what the submit handler gets after the
// schema has trimmed the email and the name and required a type.
export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterValues = z.output<typeof registerSchema>;

/**
 * The request body. A blank name or phone is left out, the name goes trimmed (the schema did
 * that), and the phone goes exactly as typed.
 */
export function toRegisterBody({
  email,
  password,
  name,
  phone,
  accountType,
}: RegisterValues): RegisterBody {
  return {
    email,
    password,
    accountType,
    ...(name !== "" && { name }),
    ...(phone.trim() !== "" && { phone }),
  };
}
