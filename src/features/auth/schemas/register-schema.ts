import { z } from "zod";
import type { RegisterBody } from "@/lib/api/types";
import { emailField, passwordField, phoneIssue } from "./fields";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.2).

export const ACCOUNT_TYPES = ["landlord", "tenant"] as const;
export type RegisterAccountType = (typeof ACCOUNT_TYPES)[number];

// No type is preselected, so the form holds an empty string until a card is chosen. The
// second step turns the empty string into the "choose a type" message.
const accountTypeField = z
  .enum(["", ...ACCOUNT_TYPES])
  .pipe(z.enum(ACCOUNT_TYPES, "Chọn loại tài khoản."));

export const registerSchema = z
  .object({
    email: emailField,
    password: passwordField,
    name: z.string().trim().max(100, "Tên tối đa 100 ký tự."),
    phone: z.string(),
    accountType: accountTypeField,
  })
  .check((context) => {
    const { phone, accountType } = context.value;
    const message = phoneIssue(phone, accountType === "landlord");
    if (message !== null) {
      context.issues.push({
        code: "custom",
        input: phone,
        path: ["phone"],
        message,
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
