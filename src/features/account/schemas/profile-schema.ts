import { z } from "zod";
import { phoneIssue } from "@/features/auth/schemas/fields";
import type { AccountType } from "@/lib/api/types";

// Light checks only: the backend is the real validator (api-for-frontend.md, 6.35). The limits are
// the ones of sign up: a name up to 100 characters, and a Vietnamese mobile number that only a
// landlord must have.
const profileShape = z.object({
  name: z.string().trim().max(100, "Tên tối đa 100 ký tự."),
  phone: z.string(),
});

/** The schema depends on the account type: a landlord cannot remove the number. */
export const profileSchema = (accountType: AccountType) =>
  profileShape.check((context) => {
    const { phone } = context.value;
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

export type ProfileInput = z.input<typeof profileShape>;
export type ProfileFormValues = z.output<typeof profileShape>;
