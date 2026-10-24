import { z } from "zod";
import { emailField } from "./fields";

// Sign in checks only that the password is not empty. A length check here would tell a
// stranger something about the rule, and the backend decides anyway.
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Nhập mật khẩu."),
});

// What the form holds while the person types. The schema changes no type, so this is also
// what the submit handler receives.
export type LoginValues = z.input<typeof loginSchema>;
