// Where a person goes after signing in or signing up, and how the `next` value is carried
// between the auth pages (spec 0005, AC-7 and AC-13). Pure: no window, no router.
//
// `next` comes from the address bar, so anyone can write anything into it. It is trusted only
// after `safeNextPath` has accepted it, and no redirect may leave the site.

import type { User } from "@/lib/api/types";

const MAX_LENGTH = 2000;
const AUTH_PAGES = ["/login", "/register"] as const;
export type AuthPage = (typeof AUTH_PAGES)[number];

// Any origin works. The last check only proves that the path stays on the origin it is
// resolved against, which is what "relative to this site" means.
const BASE = "https://site.invalid";

const hasControlChar = (value: string) =>
  Array.from(value).some((char) => {
    const code = char.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });

const decode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

// `/login`, anything under it, and the same spelled with a different case or with
// percent-encoded letters, which the router would send to the same page.
const isAuthPath = (pathname: string) => {
  const path = decode(pathname).toLowerCase();
  return AUTH_PAGES.some(
    (page) => path === page || path.startsWith(`${page}/`),
  );
};

/**
 * The path with its query and hash when `raw` is a relative path of this site, else `null`.
 * Accepted: one leading `/`, at most 2000 characters, no `//`, no backslash, no control
 * character, not `/login` or `/register` or anything under them (a person who just signed in
 * must not land on a sign in form).
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > MAX_LENGTH) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.includes("\\") || hasControlChar(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return null;
  }
  if (url.origin !== BASE) return null;
  // Checked on the parsed path, so `/a/../login` is caught too.
  if (isAuthPath(url.pathname)) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * The page to open once a person is signed in: `next` when it is safe, else the home page.
 * It takes the user so that a later feature can send a landlord or an admin to their own area
 * by editing this one function.
 */
export function afterAuthPath(
  next: string | null | undefined,
  user: Pick<User, "accountType">,
): string {
  void user.accountType;
  return safeNextPath(next) ?? "/";
}

/**
 * The address of an auth page, carrying `next` along only when it is safe. Built with
 * `URLSearchParams`, so the value is encoded exactly once.
 */
export function authHref(
  page: AuthPage,
  next: string | null | undefined,
): string {
  const safe = safeNextPath(next);
  return safe === null
    ? page
    : `${page}?${new URLSearchParams({ next: safe })}`;
}
