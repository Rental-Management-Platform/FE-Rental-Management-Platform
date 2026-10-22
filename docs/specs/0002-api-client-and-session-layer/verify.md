# Verify: API client & session layer · spec 0002 · updated 2026-10-23

_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. M1 steps are below; each later milestone appends its own._

## UI / manual

- [ ] Backend running, `npm run dev`, open `/dev/session`, press "Call GET /plans" → the page shows `total: 3` (seeded plans) → AC-1
- [ ] Stop the backend, press "Call GET /plans" again → the alert shows `NETWORK_ERROR (status 0)` with "Không kết nối được tới máy chủ..." → AC-10
- [ ] Network tab on the "Call GET /plans" request → the URL is `NEXT_PUBLIC_API_URL` plus `/plans`, with no `Authorization` header and no cookies sent (value sourcing: Full URL, Credentials) → AC-1, AC-2

**M2: login thread** (a reload shows `loading` until M3 adds the restore)

- [ ] As a guest, press "Call GET /auth/me" → the alert shows `TOKEN_MISSING (status 401)`, and the Network tab shows no request to `/auth/me` → AC-1
- [ ] Register a tenant (email, password, leave the rest) → the session panel reads `user: <email> · tenant · N permissions` (N comes from `/auth/me`, not from the account type), and the two forms disappear (value sourcing: Who is logged in, Permission check) → AC-3
- [ ] Right after, in the browser console: `localStorage`, `sessionStorage` hold no token, `document.cookie` is exactly `has_session=1`, and the address bar has no token → AC-3
- [ ] Application tab, Cookies: `has_session` has Path `/`, SameSite `Lax`, not HttpOnly, about 30 days (value sourcing: Hint cookie); `rt` is HttpOnly and was set by the API → AC-3
- [ ] Press "Call GET /auth/me" as the user → the output shows the email and permission count; the request URL is `NEXT_PUBLIC_API_URL` plus `/auth/me`, with `Authorization: Bearer ...` (value sourcing: Full URL, Authorization header) → AC-1
- [ ] Vary the account: sign in with a seeded landlord from `api-for-frontend.md` section 2 → the panel shows `landlord` and a different permission count than the tenant (the list comes from `/auth/me`, never inferred from `accountType`) → AC-3
- [ ] Sign in with a wrong password → the form shows `INVALID_CREDENTIALS (status 401)`, the state stays `loading` (no `endedReason`), and no `has_session` cookie is written → AC-3
- [ ] Sign in with email `abc` → the form shows `VALIDATION_FAILED (status 400)` as a form level message (the per field mapping arrives in M4) → AC-10
- [ ] Submit both forms empty → "Required" under each input and no request in the Network tab → AC-3
- [ ] Reload the page after signing in → the state is `loading`, `has_session=1` is still set, and no `POST /auth/refresh` is sent (restore arrives in M3) → AC-4 (expected gap until M3)

**M3: stay logged in** (backend with `ACCESS_TTL_SECONDS=60`; the debug panel on `/dev/session` shows the seconds left)

- [ ] As a guest with no `has_session` cookie, open `/dev/session` → the state is `guest (endedReason: none)`, the forms show, and the Network tab has no request to `/auth/refresh` (value sourcing: Restore on page load, whether to try) → AC-4
- [ ] Sign in, then hard reload → the panel goes `loading` then `user`, no login form shows in between, and the Network tab has exactly one `POST /auth/refresh` and one `GET /auth/me`, even in `next dev` where React StrictMode runs effects twice. This replaces the M2 reload step above → AC-4, AC-5
- [ ] The debug panel counts the token down from about 60 s (value sourcing: `expiresAt` comes from `expiresIn`, never a fixed 900) → AC-5
- [ ] With under 30 s left, press "Call GET /auth/me five times" → "5 of 5 succeeded", one `POST /auth/refresh` before the five `GET /auth/me`, and "refreshes sent" goes up by one (value sourcing: Early refresh margin, 30 s) → AC-5
- [ ] With under 30 s left, press "Call GET /listings" → the Network tab shows a refresh first, then `GET /listings` with the token, and the panel reads `first isFavorite: false`, not null → AC-7
- [ ] Vary the input: with under 30 s left, block `/auth/refresh` in DevTools and press "Call GET /listings" → the read still goes out with the old token and the session stays `user` (an optional read never fails because of a refresh) → AC-7
- [ ] Tick "Early refresh margin 0", wait until the panel says "expired", press "Call GET /auth/me" → the Network tab shows `GET /auth/me` 401, then `POST /auth/refresh`, then `GET /auth/me` 200, and "refreshes sent" goes up by one → AC-6
- [ ] Stop the backend (or block `/auth/refresh`) and reload while signed in → the state is `guest (endedReason: unavailable)`, `has_session=1` is still set, the "Check session again" button shows, and the console has a warning, not an error. Start the backend (or unblock) and press the button → `user` → AC-4
- [ ] In the Application tab delete the `rt` cookie but keep `has_session`, then reload → the state is `guest (endedReason: none)`, `has_session` is gone, and no error shows (a stale hint ends quietly) → AC-4

## Commands

- [ ] `NEXT_PUBLIC_API_URL=http://localhost:3999/api/v1 npm run build`, then `grep -rho "http://localhost:3999/api/v1" .next/static` → found, and `grep -rho "http://localhost:3000/api/v1" .next/static` → nothing; rebuild without the override afterwards → AC-2
- [ ] `npm run build && npm run start`, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/dev/session` → `404` → AC-14
- [ ] `npm run check` → exit 0 → AC-14
- [ ] Add a temporary Server Component that imports `@/lib/api/client`, run `npm run build` → fails with "You're importing a component that imports client-only"; delete the file → AC-13 (the `auth-provider.tsx` half arrives with M2)
- [ ] Same experiment with a temporary Server Component that imports `@/lib/session/create-session` → `npm run build` fails with the same client-only error, and the import trace names `create-session.ts`; delete the file → AC-13
- [ ] `npm run build` on the clean tree, with the root layout importing `AuthProvider` through `providers.tsx` → compiles, no "current time" prerender error → AC-13, AC-14
- [ ] `npm ci --dry-run` → exit 0 (lockfile in sync after adding `react-hook-form` and `@hookform/resolvers`) → AC-14
- [ ] M3: `npm run build` compiles with no "current time" prerender error (the debug panel reads the clock only in an interval), then `npm run start` and `/dev/session` is still `404`. In `.next/static/chunks`, the chunk that holds `/auth/refresh` ends the session object with `debug:void 0` and contains none of `getInfo`, `setEarlyRefreshMs`, `refreshCount` (the dev hook is gone in production) → AC-14

## Acceptance-criteria coverage

- AC-1 … covered by the first manual step and the Network tab step (modes `none`, `required` as guest, `optional` as guest were also run through a scratch script against the real backend; the lab buttons for `required` and `optional` arrive with M2 and M3) · AC-2 … covered by the first command and the Network tab step · AC-10 … covered by the second manual step (the other error shapes were run through the scratch script, `/test` can lock them with a fake `fetch`)
- AC-13 … covered by the fourth and fifth commands (both halves) · AC-14 … covered by the second, third, sixth and seventh commands
- M2 added: AC-1 `required` as guest and as user (the first, fifth and ninth M2 manual steps) · AC-3 (the M2 register, storage, cookie, landlord, wrong password and empty form steps) · AC-10 server 400 reaching the form (the M2 `abc` step). All of these except the seeded landlord step were also run once through a headless browser script against the real backend (27 of 27 checks passed)
- Not yet testable (later milestones): the `epoch` abort and cache clearing of AC-12 (M5, only the code for the epoch exists), AC-4 to AC-7 (M3), AC-8, AC-9 countdown, and the query retry rule of AC-10 (M4), AC-11 (M5)
- M3 added: AC-4 (guest, reload, outage and stale hint steps) · AC-5 (reload and the five parallel calls) · AC-6 (margin 0 step) · AC-7 (the two optional steps) · AC-14 (the M3 command). All of these were also run once as scratch scripts against the real backend with `ACCESS_TTL_SECONDS=60`: 63 checks in Node on the real `createSession` and client (restore and every end reason, outage and 429 block, five calls with one cancelled sharing one refresh, three expired calls sharing one refresh, a resend that fails again ending the session as `expired`, optional reads with the refresh down) and 27 checks in headless Edge on `next dev` (all passed). `/test` can lock the Node ones with a fake `fetch`
- Still not testable after M3: AC-8 and the AC-9 countdown, the query retry rule of AC-10 (M4); AC-11 and the cache clearing of AC-12 (M5, the end of session path exists but has no lab button yet). The end of session rules for a refresh while logged in (`REFRESH_TOKEN_MISSING` gives `revoked`) were checked in the Node run only
