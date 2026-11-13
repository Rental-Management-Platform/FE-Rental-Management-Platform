// Where the account page is, and what an account type is called there (scope #28,
// api-for-frontend.md 6.35). Pure: no React, no router.

import type { AccountType } from "@/lib/api/types";

/** The account page, shared by every signed in person (spec 0001, spec 0005). */
export const ACCOUNT_PATH = "/account";

/** The words for an account type, the same ones the sign up cards use. */
export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  tenant: "Người tìm trọ",
  landlord: "Người đăng bài",
  admin: "Quản trị viên",
};
