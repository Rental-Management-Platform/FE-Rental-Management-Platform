// What the admin users page reads from its address, and how it writes one back (scope #20, spec
// 0023, AC-3). Pure: no React, no router.

import type { AccountType, UserStatus } from "@/lib/api/types";
import { ADMIN_USERS_PATH } from "./admin-users-path";

/** `all` sends no `accountType`. The other three are the values of `GET /users`. */
export type AccountTypeFilter = AccountType | "all";

/** `all` sends no `status`. The other two are the values of `GET /users`. */
export type StatusFilter = UserStatus | "all";

/**
 * Every filter of `GET /users` (api-for-frontend.md, 6.34). `all` and the empty text mean "not
 * sent". The address is the only owner of this state.
 */
export interface UserFilters {
  accountType: AccountTypeFilter;
  status: StatusFilter;
  /** Trimmed, at most `MAX_QUERY_LENGTH` characters. "" means no search. */
  q: string;
}

/** What the page shows with a clean address. */
export const NO_USER_FILTERS: UserFilters = {
  accountType: "all",
  status: "all",
  q: "",
};

/** The API refuses a longer `q` (6.34), and the page never sends one. */
export const MAX_QUERY_LENGTH = 254;

const ACCOUNT_TYPES: readonly AccountType[] = ["admin", "landlord", "tenant"];
const STATUSES: readonly UserStatus[] = ["active", "locked"];

/**
 * The one rule for a search text: trimmed, at most 254 characters, trimmed again after the cut.
 * The address parser and the search box both use it, so a typed text and the same text read back
 * from the address are always the same. The cut counts UTF-16 units, as the API does, and never
 * leaves half of an emoji at the end.
 */
export function cleanQuery(text: string): string {
  const trimmed = text.trim();
  const cut = trimmed.slice(0, MAX_QUERY_LENGTH);
  const last = cut.charCodeAt(cut.length - 1);
  const whole = last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
  return whole.trim();
}

/**
 * The filters an address asks for. A value the API would refuse (an unknown type or status) is
 * treated as if it were not there, so it is never sent.
 */
export function parseUserFilters(
  read: (name: string) => string | null,
): UserFilters {
  const accountType = ACCOUNT_TYPES.find(
    (type) => type === read("accountType"),
  );
  const status = STATUSES.find((value) => value === read("status"));
  return {
    accountType: accountType ?? "all",
    status: status ?? "all",
    q: cleanQuery(read("q") ?? ""),
  };
}

export const sameFilters = (a: UserFilters, b: UserFilters): boolean =>
  a.accountType === b.accountType && a.status === b.status && a.q === b.q;

/** True when anything is filtered or searched. */
export const hasFilters = (filters: UserFilters): boolean =>
  !sameFilters(filters, NO_USER_FILTERS);

/**
 * The address of one page of one set of filters. Only what is set is written, and page 1 leaves
 * its parameter out, so the clean address is the one a person shares.
 */
export function adminUsersHref(filters: UserFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.accountType !== "all") {
    params.set("accountType", filters.accountType);
  }
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.q !== "") params.set("q", filters.q);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query === "" ? ADMIN_USERS_PATH : `${ADMIN_USERS_PATH}?${query}`;
}
