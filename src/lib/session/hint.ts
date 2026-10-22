import "client-only";

// A cookie on this site, not the API's. It only says "this browser had a login", so a guest
// does not spend one of the API's 60 refreshes per minute per IP finding out. It holds no
// secret and is never proof of a login. The refresh cookie `rt` is HttpOnly and not ours.
const HINT_NAME = "has_session";

// Equal to the backend default REFRESH_TTL_DAYS and to contract section 4.1 step 5. Raise it
// if the backend sets a larger value, otherwise a valid session would look like a guest.
export const HINT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function readHint(): boolean {
  return document.cookie.split("; ").some((pair) => pair === `${HINT_NAME}=1`);
}

// Written at login and register only. A refresh does not extend it, because the refresh
// cookie does not extend either.
export function writeHint(): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${HINT_NAME}=1; Max-Age=${HINT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

export function clearHint(): void {
  document.cookie = `${HINT_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}
