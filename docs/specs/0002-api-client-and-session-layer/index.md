# 0002. API client and session layer for the web frontend

**Date**: 2026-10-23
**Status**: In Progress

## Summary

Every call from the browser to your backend goes through one small client, and one session object decides who is logged in. The access token (the short lived key to the API) lives only in memory, inside a closure (a private variable that no other file can touch), and each page render on the server gets its own copy, so a token can never leak between visitors. The session restores itself on page load, refreshes the token once even when many requests fail together, ignores answers that arrive after the person has signed out, and turns every failure into one typed error shape, with field errors for forms and a wait time for rate limits. A temporary page, `/dev/session`, proves all of this by hand until the real login screen arrives in item #5.

## Requirements

Seeded from the scope row for #3 and the contract `api-for-frontend.md` (sections 2, 3, 4, 4.1, 5). Refined after an independent cross check of the first draft.

**User stories**:
- As a visitor, I want public pages and logged in screens to call the API the same way, so that errors and sessions behave the same everywhere.
- As a logged in user, I want to stay logged in after a reload and while my token expires, so that I am not thrown back to the login page.
- As someone filling a form, I want each server error shown under the right input, so that I know what to fix.
- As someone who called the API too fast, I want to see how long to wait, so that I do not make the block longer by retrying.
- As the developer of a later feature, I want one typed client and session hooks, so that I never solve tokens, refresh, or error parsing a second time.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: One client, three modes. Through the same client a screen calls a public API (`GET /plans`, mode `none`), an API that needs login (`GET /auth/me`, mode `required`), and an optional login read (`GET /listings?pageSize=1`, mode `optional`). Once any restore has finished, a `required` call made by a guest fails on the machine with a 401 `TOKEN_MISSING` error and sends no request.
- **AC-2**: The API address comes from `NEXT_PUBLIC_API_URL`. After changing it and running `npm run build`, the browser bundle in `.next/static` contains the new address and not the old one (the check carried over from spec 0001).
- **AC-3**: Login and register keep the token in memory only. After `signIn` or `signUp` the state is `user` with `user` and `permissions` from `GET /auth/me`. The token appears nowhere in `localStorage`, `sessionStorage`, `document.cookie` (apart from the hint `has_session=1`), or the address bar.
- **AC-4**: Restore on reload. With the hint cookie, a hard reload ends in `user` without showing a login form, going `loading` then `user`. Without the hint, the state goes to `guest` and no `POST /auth/refresh` is sent. A refresh that answers 401 clears the hint. A failure that is only temporary (network, 5xx, 429) ends in `guest('unavailable')` with the hint kept, and calling `restore()` again recovers the session.
- **AC-5**: One shared refresh. With an expired access token, five required calls started together send exactly one `POST /auth/refresh`, and all five succeed with the new token. Cancelling one of the five (as TanStack Query does when it cancels a query) does not cancel the refresh the other four wait for. In `next dev` (React StrictMode runs effects twice) the restore on page load still sends one refresh.
- **AC-6**: Retry exactly once. A required call that answers 401 `TOKEN_EXPIRED` triggers one refresh and one resend. If another call has already replaced the token, the resend uses that token with no second refresh. If the resend also fails with 401, the session ends and the call throws. There is never a third attempt.
- **AC-7**: Early refresh for optional reads. With under 30 seconds left on the token, an `optional` call refreshes first, so `landlord.phone` and `isFavorite` keep their real values instead of silently turning into `null`.
- **AC-8**: Field errors. A 400 `VALIDATION_FAILED` shows each message under its own input in the lab forms, using the first message of each `field`. A nested field such as `fees.0.price` maps to the same path in the form. Codes that point at one input (`EMAIL_TAKEN`, `PHONE_TAKEN`, `CURRENT_PASSWORD_WRONG`) show under that input, and a message with no matching input shows as a form level message.
- **AC-9**: Rate limit wait. A 429 shows the Vietnamese `message` and a wait time that counts down, with the submit button disabled until it ends. A second 429 with the same number of seconds restarts the countdown. Nothing retries by itself. The seconds come from `Retry-After` when the browser can read it, otherwise from the contract table (section 3, column "Bị chặn trong"), and the text says "khoảng" (about) only when the number came from the table.
- **AC-10**: One error shape. Every failure throws an `ApiError`: backend errors keep `status`, `code`, `message`, `errors`, `requestId`. A network failure gives `NETWORK_ERROR` (status 0), a timeout gives `TIMEOUT`, a body that is not JSON gives `HTTP_ERROR` or `INVALID_RESPONSE`, and a backend code the client does not know becomes `HTTP_ERROR` with the backend `message` kept. A call aborted by the caller or by the end of a session is not wrapped. Queries retry once, only for `NETWORK_ERROR`, 502, 503, or 504, and never for a 4xx, a 429, `TIMEOUT`, a 500, or an error that is not an `ApiError`. Mutations never retry.
- **AC-11**: Ending a session. `signOut` clears the token, the hint, and the TanStack cache first, then calls `POST /auth/logout`, even if that call fails. A server answer that proves the session is over ends it with a reason: on refresh `SESSION_EXPIRED`, `SESSION_REVOKED`, `REFRESH_TOKEN_MISSING` (while logged in), or 403 `ACCOUNT_LOCKED`; on a token call `TOKEN_INVALID`, `TOKEN_MISSING`, `UNAUTHORIZED`, 403 `ACCOUNT_LOCKED`, or `TOKEN_EXPIRED` that fails again after the one retry. The local `TOKEN_MISSING` of a guest never ends anything. A network error, a 5xx, or a 429 on refresh does not end the session: the error reaches the caller and the hint stays. `signOutAll` that fails by network or 5xx keeps the session. A failed login sets no `endedReason`.
- **AC-12**: No data from the previous person. After logout, a lost session, or a login as a different account, the TanStack cache holds nothing from the previous account. Requests still in flight when the session ends are aborted, so their results never reach the cache or a mutation callback.
- **AC-13**: Browser only. A Server Component that directly imports `create-session.ts`, `client.ts`, or `hint.ts` fails the build (`auth-provider.tsx` is a Client Component, so the root layout may import it). The server never reads, sends, or stores a token.
- **AC-14**: Clean build. `npm run check` and `npm run build` pass, with no hydration warning and no "current time" prerender error. `/dev/session` answers 404 in a production build.

## Decision

**Chosen option**: Option 1: a session built by a factory function (closure state) and mounted once in `AuthProvider`, with one browser client that shares its refresh logic

A factory `createSession` owns the token, the single shared refresh, and the session state; `AuthProvider` creates one instance per mount and exposes it through hooks; the client `createApiClient` sits on a pure shared core (`http.ts`) that the future `server.ts` will reuse.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

## Feature design

### Scope of this spec

| In #3 | Left to another item |
|---|---|
| Shared pure core (`http.ts`), `ApiError`, rate limit table, `types.ts` (all of contract Appendix B) | `src/lib/api/server.ts` (server reads, `cache()`, `notFound()`, junk path check): item #8, the first page that reads the API on the server |
| Browser client with three auth modes | The route gate for `/landlord/*` and `/admin/*` with `?next=` return: item #5 |
| Session: restore, `signIn`, `signUp`, `signOut`, `signOutAll`, `reload`, hint cookie | Real login and register screens, and what to show for `guest('unavailable')`: item #5 |
| `AuthProvider`, `useSession`, `useApi`, `useSessionActions`, `can` | `forgot-password`, `reset-password`, `change-password`, profile: items #27 and #28 |
| `fieldErrors`, `applyFieldErrors`, `describeError`, `formatWait`, `useCountdown` | Money, area, and date formatting in `format.ts`: the first feature that shows a price |
| TanStack Query retry policy and cache clearing on session end | Per feature query keys and `queryOptions` |
| Temporary page `/dev/session` (RHF forms, call buttons, dev only debug panel) | Deleting that page: when item #5 ships a real login |

### Module map

```
src/lib/api/
  types.ts           contract Appendix B copied by hand (header: source file and date);
                     its ApiError interface is renamed ApiErrorBody to avoid a clash with errors.ts
  errors.ts          ErrorCode, ApiError, createApiError, isApiError, fieldErrors, describeError
  rate-limits.ts     RATE_LIMIT_RULES and blockSecondsFor(method, path)
  http.ts            pure helpers shared with the later server.ts: buildUrl, parseResponse, readRetryAfter
  client.ts          createApiClient(deps)   (imports client-only)
  query-retry.ts     shouldRetryQuery for the QueryClient defaults
src/lib/session/
  hint.ts            readHint, writeHint, clearHint for the has_session cookie   (imports client-only)
  create-session.ts  createSession(config)                                       (imports client-only)
  auth-provider.tsx  AuthProvider, useSession, useApi, useSessionActions          ('use client')
  can.ts             can(state, permission)
src/lib/forms/
  apply-field-errors.ts   applyFieldErrors(setError, error)
src/lib/
  format.ts          formatWait(seconds)   (money, area, dates are added later)
  use-countdown.ts   useCountdown(error)
src/app/providers.tsx           mounts AuthProvider inside QueryClientProvider, sets retry defaults
src/app/dev/session/            page.tsx (404 in production) and session-lab.tsx ('use client')
```

### Data model

There is no database. This is what the client holds in memory and what it throws.

**`SessionState`** (what `useSession()` returns; the token is not part of it):

| Status | Fields | Meaning |
|---|---|---|
| `loading` | none | Session is being restored. Also the state of every server render and the first client render |
| `guest` | `endedReason: 'expired' \| 'revoked' \| 'locked' \| 'unavailable' \| null` | `null` is a plain guest or a person who signed out. `expired`, `revoked`, `locked` mean a session was lost, so the login page can say why. `unavailable` means the session could not be checked right now (network, 5xx, 429, wrong origin) and may still be valid, so `restore()` can be run again |
| `user` | `user: User`, `permissions: PermissionKey[]` | From `GET /auth/me`. Types `User` and `PermissionKey` are in Appendix B |

`getState()` returns the same object until a transition happens (a new object only on a change), because `useSyncExternalStore` loops forever on an unstable snapshot.

**Private inside the closure** (never returned by a hook, never logged):
- `token: { accessToken: string; expiresAt: number } | null`. `expiresAt` is `Date.now()` when the response arrived plus `expiresIn * 1000`, so the browser clock is the only clock involved.
- `refreshing: Promise<TokenRecord> | null`. The one `POST /auth/refresh` in progress. It has its own timeout and ignores the abort signal of whoever started it.
- `restoring: Promise<void> | null`. The restore on page load, kept apart from `refreshing` so that the session's own calls never wait on themselves.
- `epoch: number` and `sessionAbort: AbortController`. Every state changing action (sign in, sign out, session end) increments `epoch` and replaces the controller. A refresh, login, or `/auth/me` result that finishes under an old `epoch` is dropped and its token is never stored. Authed requests listen to the controller of their `epoch`, so ending a session aborts them.
- `refreshBlockedUntil: number | null`. Set from a 429 on refresh.
- `refreshCount: number`, used only by the dev debug panel.

**`ApiError`** (a plain `Error` created by a factory, no class; `name` is `'ApiError'`; `isApiError(e)` is the guard):

| Field | Type | Source |
|---|---|---|
| `status` | number, `0` when no response arrived | HTTP status |
| `code` | backend `ErrorCode`, plus client codes `NETWORK_ERROR`, `TIMEOUT`, `INVALID_RESPONSE`. A backend code not in the list becomes `HTTP_ERROR` | Error body `code` |
| `message` | Vietnamese string | Error body `message`; for client codes a fixed Vietnamese sentence in `errors.ts` |
| `errors` | `FieldError[]`, empty when none | Error body `errors` |
| `requestId` | string or `null` | Error body `requestId` |
| `retryAfterSeconds` | number or `null`, set only on 429 | `Retry-After` header, else `RATE_LIMIT_RULES`, else 60 |
| `retryAfterExact` | boolean | `true` only when the seconds were read from the header |

**Other shapes**:
- `FieldErrors = Record<string, string>`: the first message of each `field`.
- `RequestOptions`: `method` (default `GET`), `path` (starts with `/`), `query?`, `body?` (JSON value or `FormData`), `auth?` (`'required' | 'optional' | 'none'`, default `'required'`), `signal?`.
- `RateLimitRule`: `{ method, pattern, blockSeconds }`, written from the table in contract section 3.

**Relationships**: `AuthProvider` creates one session and one client inside `useState`, and passes the session two callbacks that touch the TanStack cache: `onSessionEnd` (cancel queries, then clear the cache) and `onUserChange` (invalidate queries). The client asks the session for a token and for a refresh. The session uses the same client for `login`, `register`, `refresh`, `logout`, and `logout-all`, and an internal path (below) for its own `/auth/me` calls.

### Session states

| From | Trigger | To | Side effects |
|---|---|---|---|
| start | Server render and first client render | `loading` | none. `getServerSnapshot` returns `loading` |
| `loading` | `restore()` finds no hint | `guest(null)` | no request |
| `loading` | Refresh then `GET /auth/me` succeed | `user` | token set |
| `loading` | Refresh answers `SESSION_EXPIRED` | `guest('expired')` | hint cleared |
| `loading` | Refresh answers `SESSION_REVOKED` | `guest('revoked')` | hint cleared |
| `loading` | Refresh answers `REFRESH_TOKEN_MISSING` | `guest(null)` | hint cleared. Silent, because the person never saw a session this time |
| `loading` | Refresh answers 403 `ACCOUNT_LOCKED` | `guest('locked')` | hint cleared |
| `loading` | Refresh fails by network, 429, 5xx, or 403 `ORIGIN_NOT_ALLOWED`; or `GET /auth/me` fails the same way | `guest('unavailable')` | hint kept, token dropped, `console.warn` (and `console.error` for `ORIGIN_NOT_ALLOWED`, naming `ALLOWED_ORIGINS`) |
| `guest('unavailable')` | `restore()` called again | `loading`, then as above | |
| `guest` | `signIn` or `signUp` succeeds | `user` | hint written, token set, cache invalidated |
| `user` | `signIn` or `signUp` as another account | `user` | runs `signOut` first, then signs in |
| `user` | `signOut`, or `signOutAll` succeeds | `guest(null)` | see Session actions |
| `user` | A server answer proves the session is over | `guest(reason)` | token, hint, cache cleared |
| `user` | `reload()` | `user` | new `user` and `permissions` |

Reasons while logged in: refresh `SESSION_EXPIRED` gives `expired`; refresh `SESSION_REVOKED` or `REFRESH_TOKEN_MISSING` gives `revoked` (logout in another tab deletes the shared `rt` cookie, so the other tab sees `REFRESH_TOKEN_MISSING`); 403 `ACCOUNT_LOCKED` from refresh or from any token call gives `locked`; a token call that gets `TOKEN_EXPIRED` again after its one retry gives `expired`; `TOKEN_INVALID`, `TOKEN_MISSING` from the server, and `UNAUTHORIZED` give `revoked`. Only a response from the server can end a session.

### Session actions

- **`restore()`** runs only when the state is `loading` or `guest('unavailable')`. It records itself in `restoring`. With no hint it goes to `guest(null)`. Otherwise it joins the shared refresh, then calls `/auth/me` through the internal path with the new token. After every await it checks `epoch`, and drops its result if the session changed meanwhile.
- **Internal path.** The session's own `/auth/me` calls (restore, `signIn`, `signUp`) use mode `none` with the `Authorization` header passed explicitly. They never wait for `restoring` or `refreshing`, and never retry through a refresh. This is what stops the restore from waiting on itself. After the session is `user`, `reload()` uses the normal `required` path.
- **`signIn(input)` / `signUp(body)`**: if the state is `user`, run `signOut()` first (the old server session would otherwise stay alive and count toward the 10 session limit). Call `POST /auth/login` or `/auth/register`. On success, write the hint right away (the `rt` cookie now exists), then store the token, then call `/auth/me` through the internal path, then set the state to `user`, then call `onUserChange`. If `/auth/me` fails, drop the token, go to `guest(null)`, keep the hint, and reject with the error. The state never shows `loading` during sign in; the form shows its own pending state. A login that answers 403 `ACCOUNT_LOCKED` just rejects and sets no `endedReason`.
- **`signOut()`**: increment `epoch` (this aborts in flight authed requests), clear the token and the hint, call `onSessionEnd`, set `guest(null)`. Then wait for any refresh in flight to settle and ignore its result (so the newest rotated `rt` cookie is the one sent), and call `POST /auth/logout`. A failure of that call is logged, not thrown.
- **`signOutAll()`**: call `POST /auth/logout-all` as a required call. On success clear everything like `signOut` (without a second logout call). On a network error, 5xx, or 429, reject and keep the session, because the other devices are still logged in. A 401 ends the session as usual.
- **`reload()`**: when `user`, call `/auth/me` and replace `user` and `permissions`. Otherwise does nothing.
- **`endSession(reason)`**, used by every path that ends a session, in this order: increment `epoch` and abort, `token = null`, clear the hint, call `onSessionEnd` (which calls `cancelQueries()` without awaiting and then `clear()`), set `guest(reason)`, notify subscribers. This order guarantees the cache is already empty when any component sees the new state. After a `TOKEN_INVALID` or `UNAUTHORIZED` it also sends `POST /auth/logout` as a best effort, not awaited, so a leftover `rt` cookie does not keep a server session alive. On a login, the order is the other way: set the state, then call `onUserChange`.

### Request rules

1. **Address**: `env.NEXT_PUBLIC_API_URL` plus `path`. `path` must start with one `/` and not `//`; the client throws a programming error otherwise, so a token can only ever go to the API address.
2. **Credentials**: `credentials: 'include'` when the path starts with `/auth/`, otherwise left at the default. This also lets login and register store the `rt` cookie across origins.
3. **Headers**: `Accept: application/json`. `Content-Type: application/json` only when the body is JSON (not `FormData`, so item #10 can upload photos). No `X-Request-Id` is sent (an extra header may fail the backend CORS preflight; the id comes from the error body).
4. **Timeout and abort**: each attempt (the first send, the refresh, the resend) gets its own 20 second timeout through `AbortSignal.timeout`, combined by `AbortSignal.any` with the caller's `signal`. For `required` and `optional` calls the signal also includes the controller of the current `epoch`. A timeout becomes `TIMEOUT`. A caller abort or an epoch abort is rethrown as the native `AbortError`, unwrapped.
5. **Mode `none`**: no token, no refresh, never touches the session.
6. **Getting a token** (`required` and `optional`):
   - Wait for `restoring`, if one is running.
   - If a token exists with more than 30 seconds left, use it.
   - Otherwise join the shared refresh, starting it if none runs. The refresh ignores the caller's signal; each waiter races its own signal against the shared promise, so one cancelled query leaves the others alone.
   - If the refresh succeeds, use the new token. If it fails: a `required` call rejects with the refresh's own `ApiError`, except that when the old token is still valid (`expiresAt` is in the future) it goes ahead with the old token. An `optional` call never throws because of a refresh failure: it goes ahead with the old token if still valid, with no token otherwise.
   - No token at all: `required` throws a local 401 `TOKEN_MISSING` (which never ends a session); `optional` sends without `Authorization`.
7. **`required` response handling**: remember which token the attempt sent. On 401 `TOKEN_EXPIRED`: if the current token is a different one (another call refreshed already), resend once with the current token and no new refresh; otherwise join the shared refresh and resend once. A second 401 `TOKEN_EXPIRED` ends the session with `expired`. Other session ending answers are listed in AC-11.
8. **`optional` response handling**: none for 401, because the four optional routes never answer it.
9. **The shared refresh** is `POST /auth/refresh` in mode `none`, at most one at a time. Its result is dropped if `epoch` moved on while it ran. On a 429 it sets `refreshBlockedUntil` to now plus `retryAfterSeconds`, and any later attempt before that time rejects at once with the same 429 `ApiError`, because the contract says a retry only lengthens the block (this limit counts per IP, so blocking locally is safe; login is limited per email, so login is not blocked locally).
10. **Response**: 204 gives `undefined`. A 2xx with a body that is not valid JSON gives `INVALID_RESPONSE`. An error body with string `code` and `message` becomes the `ApiError`. Any other error body gives `HTTP_ERROR` with a fixed Vietnamese sentence.
11. **Query string**: values that are `undefined`, `null`, or `''` are dropped; booleans become `true` or `false`; an array repeats the key. Item #13 revisits arrays when the contract defines a filter that needs them.
12. **No automatic retry** of a 429 or any mutation. Queries retry through `shouldRetryQuery` only (below).

### Interface

Backend endpoints this layer calls:

| Endpoint | Method | Mode | Used by | Errors that change behavior |
|---|---|---|---|---|
| `/auth/register` | POST | none | `signUp` | 400 `VALIDATION_FAILED`, 409 `EMAIL_TAKEN`, 409 `PHONE_TAKEN`, 429 |
| `/auth/login` | POST | none | `signIn` | 401 `INVALID_CREDENTIALS`, 403 `ACCOUNT_LOCKED`, 400, 429 |
| `/auth/refresh` | POST | none | refresh, restore | 401 `REFRESH_TOKEN_MISSING`, `SESSION_REVOKED`, `SESSION_EXPIRED`; 403 `ACCOUNT_LOCKED`, `ORIGIN_NOT_ALLOWED`; 429 |
| `/auth/logout` | POST | none | `signOut` | 403 `ORIGIN_NOT_ALLOWED` |
| `/auth/logout-all` | POST | required | `signOutAll` | 401 |
| `/auth/me` | GET | none (internal path) or required | restore, `signIn`, `signUp`; `reload` | 401 `TOKEN_*`, 403 `ACCOUNT_LOCKED` |

Used by the lab page only: `GET /plans` (none) and `GET /listings?pageSize=1` (optional).

What later features import:

| Name | Shape | Notes |
|---|---|---|
| `useApi()` | `ApiClient` with `request`, `get`, `post`, `patch`, `delete` | `get<T>(path, options?)`, `post<T>(path, body?, options?)`. Stable across renders. **Rule:** inside a `queryFn`, always pass the `signal` TanStack gives you; without it `cancelQueries` cancels nothing |
| `useSession()` | `SessionState` | Uses `useSyncExternalStore`. Server snapshot is `{ status: 'loading' }` |
| `useSessionActions()` | `{ signIn, signUp, signOut, signOutAll, reload, restore }` | `signIn({ email, password })`, `signUp(body)` with the register body. They reject with `ApiError`, so a form can map it |
| `can(state, key)` | boolean | `state.status === 'user' && state.permissions.includes(key)`. Permission only; account type rules such as "admin never saves listings" stay in the feature |
| `isApiError(e)` | type guard | Narrow before reading `code` |
| `fieldErrors(error)` | `FieldErrors` | First message per `field` from `errors[]`. Also adds the fixed map `EMAIL_TAKEN` to `email`, `PHONE_TAKEN` to `phone`, `CURRENT_PASSWORD_WRONG` to `currentPassword` |
| `applyFieldErrors(setError, error)` | void | Calls RHF `setError(field, { type: 'server', message })` for each entry of `fieldErrors(error)`. A message whose field is not a registered input goes to `setError('root.server', ...)` |
| `describeError(error)` | `{ message: string; requestId: string \| null }` | `message` is the `ApiError` message, or a generic Vietnamese sentence for any other thrown value. `requestId` is returned only for status 500 or above |
| `formatWait(seconds)` | string | Under 60 gives "N giây", under 3600 gives "N phút" (rounded up), else "N giờ" |
| `useCountdown(error)` | seconds left (number) | Keyed on the identity of the error object, so a second 429 with the same seconds restarts it. Reads the clock only inside an effect or interval, never during render |

`createSession` takes `{ baseUrl, fetch?, now?, onSessionEnd, onUserChange }`. It has no side effect when called (no fetch, no cookie read), because React may call a `useState` initializer twice in development. `restore()` is called from an effect in `AuthProvider`. In development only, the session also exposes `debug`: `getInfo()` returns `{ expiresAt, refreshCount }` and `setEarlyRefreshMs(ms)` changes the 30 second margin. It never returns the token, and it is `undefined` in a production build.

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Any browser call | Full URL | `env.NEXT_PUBLIC_API_URL` (`src/lib/env.ts`) plus `path` |
| Any `/auth/*` call | Credentials mode | The path prefix `/auth/` |
| Required or optional call | `Authorization` header | In memory `accessToken` from the last login, register, or refresh response |
| Token bookkeeping | `expiresAt` | `Date.now()` at response time plus `expiresIn * 1000` (`expiresIn` from the response, never a fixed 900) |
| Early refresh | Margin | Constant 30 seconds, from spec 0001 (changeable only through the dev `debug` hook) |
| Restore on page load | Whether to try | Cookie `has_session` |
| Hint cookie | Lifetime and flags | `Max-Age` 30 days, constant `HINT_MAX_AGE_SECONDS`, equal to the backend default `REFRESH_TTL_DAYS` and to contract section 4.1 step 5; raise it if the backend sets a larger value, otherwise a valid session would look like a guest. `Path=/`, `SameSite=Lax`, `Secure` when the page is on https, value `1`, no `Domain`. Written at login and register only, never extended by a refresh (the refresh cookie does not extend either) |
| Who is logged in | `user`, `permissions` | `GET /auth/me`, never decoded from the JWT |
| Permission check | boolean | `permissions.includes(key)` from `/auth/me`, never inferred from `accountType` |
| Error text | `message` | Backend `message` (Vietnamese). Client made errors use the fixed sentences below |
| Field errors | `field` to message | `errors[]` of the 400 body, first entry per `field`; plus the fixed code map for `EMAIL_TAKEN`, `PHONE_TAKEN`, `CURRENT_PASSWORD_WRONG` |
| Support code on 5xx | `requestId` | Error body (headers are not readable across origins) |
| Wait after 429 | `retryAfterSeconds` | Header `Retry-After` when readable (an integer of 1 or more, anything else is ignored), else `RATE_LIMIT_RULES`, else 60 |
| Whether the wait is exact | `retryAfterExact` | True only for the header |
| Wait text | "N giây", "N phút", "N giờ" | `formatWait` |
| Reason a session ended | `endedReason` | The error code that ended it (mapping under Session states) |
| Request timeout | 20 seconds per attempt | Constant in `client.ts` |
| Response types | TypeScript types | Contract Appendix B in `types.ts` |

Fixed Vietnamese sentences for client made errors: `NETWORK_ERROR` "Không kết nối được tới máy chủ. Hãy kiểm tra mạng rồi thử lại."; `TIMEOUT` "Máy chủ phản hồi quá chậm. Vui lòng thử lại."; `INVALID_RESPONSE` "Máy chủ trả về dữ liệu không đọc được. Vui lòng thử lại sau."; local `TOKEN_MISSING` "Bạn cần đăng nhập để tiếp tục."; `HTTP_ERROR` without a usable body "Đã có lỗi xảy ra. Vui lòng thử lại sau."

Rate limit table to write into `rate-limits.ts` (seconds blocked, from contract section 3). Matching rule: compare the method and the path without its query string, whole segments only, each `:name` matching exactly one segment, so `GET /landlords/:id` does not match `GET /landlords/:id/listings`:

| Method and path | Seconds |
|---|---|
| `POST /auth/register`, `/auth/forgot-password`, `/auth/reset-password` | 3600 |
| `POST /auth/login`, `/auth/change-password` | 900 |
| `POST /auth/refresh` | 60 |
| `POST /properties`; `PATCH`, `DELETE /properties/:id` | 3600 |
| `POST /properties/:id/listings`; `PATCH`, `DELETE /listings/:id`; `POST /listings/:id/hide`, `/listings/:id/show`; `POST /listings/:id/images` | 3600 |
| `POST /orders`, `/orders/:id/pay`, `/orders/:id/cancel` | 3600 |
| `POST`, `DELETE /landlords/:id/follow`; `POST`, `DELETE /listings/:id/favorite`; `PATCH /me/profile` | 3600 |
| `GET /listings`, `/listings/:slugCode`, `/plans`, `/landlords/:id`, `/landlords/:id/listings`, `/me/favorites` | 60 |
| anything else | 60 |

### Key invariants

- The access token exists in exactly one place: the closure of one `createSession` call. It is not in React state, context, a hook result, an `ApiError`, a log line, storage, or a URL.
- At most one `POST /auth/refresh` is in flight at a time per session.
- A request is resent at most once after a refresh, and never with a second refresh for the same attempt.
- Only a server answer that proves the session is over ends it. A transient failure, a local `TOKEN_MISSING`, or a failed login never does.
- A result that finishes under an old `epoch` is dropped, and its token is never stored.
- When no sign in, register, or restore is running, a state other than `user` means `token` is `null`.
- Whenever the session leaves `user`, `onSessionEnd` has already emptied the TanStack cache before any subscriber is told.
- `createSession` and `createApiClient` take every dependency (`baseUrl`, `fetch`, clock) as an argument with a default, so they run without React.

### Edge cases and failure handling

| Case | Handling |
|---|---|
| Two tabs reload together | Both refresh with the same shared cookie; the backend's 10 second grace covers it |
| Logout in tab A | Tab B keeps working until its token expires; at its next refresh the shared `rt` cookie is gone, the answer is `REFRESH_TOKEN_MISSING`, and tab B ends as `guest('revoked')`. No tab to tab messaging (see "Several tabs" in `rationale.md`) |
| StrictMode runs effects twice | `restore()` sees a restore already running and returns the same promise |
| A required call starts while `loading` | It waits for the restore, then runs with the token or fails locally with `TOKEN_MISSING` |
| The restore itself needs `/auth/me` | It uses the internal path, which never waits, so the restore cannot block on itself |
| Refresh answers 429 (60 per minute per IP) | The 429 `ApiError` goes to every waiting caller, later attempts are rejected locally until `refreshBlockedUntil`. The session and the hint stay |
| Early refresh fails by network or 5xx | If the old token is still valid the call goes ahead with it; a `required` call fails only when the token has really expired |
| Retry after refresh fails again with 401 | Session ends with `expired` and the call throws |
| Another call already refreshed when a 401 arrives | The resend uses the new token with no extra refresh |
| One waiter on a refresh is cancelled | Only that waiter leaves; the refresh and the others continue |
| Session ends while a refresh or login is in flight | The result carries an old `epoch` and is dropped; no token is stored |
| Response arrives after logout | The request was aborted when the `epoch` changed, so no result reaches a cache or an `onSuccess`. A mutation sees an `AbortError` in `onError` |
| `/auth/me` fails temporarily during restore | `guest('unavailable')`, hint kept, `restore()` can be called again |
| `ORIGIN_NOT_ALLOWED` on refresh | Treated as a setup mistake: `guest('unavailable')`, hint kept, `console.error` telling you to add the origin to `ALLOWED_ORIGINS` |
| Logout request fails (network) | Local state is already cleared. The server session lingers until it expires. Accepted for the demo |
| Error body is not JSON (proxy 502 page) | `HTTP_ERROR` with the fixed sentence and `requestId: null` |
| 429 wait comes from the table | `retryAfterExact` is false and the text says "khoảng N". A readable header is exact |
| Permissions changed by an admin | The session keeps the permissions from the last `/auth/me`. `reload()` or a page load refreshes them. A stale button ends in a 403 `PERMISSION_DENIED` that the feature shows |
| Fast Refresh edits `create-session.ts` in `next dev` | The in memory token is lost; reload the page and the hint restores the session |
| Route hidden by `<Activity>` | The lab stays mounted while hidden; it holds no timers that matter |
| Browser clock jumps | A required call recovers through the 401 path; an optional read may show guest data until the next refresh |
| Proxy mode (`NEXT_PUBLIC_API_URL` is a path) | Same code. Headers become readable, so `Retry-After` is exact |

### Query client defaults

`shouldRetryQuery(failureCount, error)`: retry once, only when `isApiError(error)` and the code is `NETWORK_ERROR` or the status is 502, 503, or 504. Never for 4xx, 429, `TIMEOUT`, 500, or an error that is not an `ApiError`. Mutations never retry (TanStack default, stated in `providers.tsx`). `ApiError` is not registered as the global error type, because a query can also throw a plain error; features narrow with `isApiError`.

### Lab page `/dev/session`

`page.tsx` calls `notFound()` when `process.env.NODE_ENV === 'production'` and otherwise renders `session-lab.tsx`. The lab shows:
- The current `SessionState` (status, email, account type, permission count, `endedReason`).
- A debug panel read from `session.debug`: seconds left on the token, the refresh count, a switch that sets the early refresh margin to 0 (to reach the 401 retry path by hand), and the size of the TanStack query cache.
- A login form and a register form (React Hook Form with Zod checks that only require non empty fields, so the server can return real 400s).
- Buttons that run through `useQuery` or `useMutation`, so the cache really fills: `GET /plans` (none), `GET /auth/me` (required), `GET /listings?pageSize=1` (optional, shows the first `isFavorite`), five parallel `GET /auth/me`, and twelve wrong logins in a row (shows the 429 countdown; leaves a 15 minute block on that email, and restarting the backend clears it).
- Sign out, sign out of all devices, reload profile, and a "check session again" button for `guest('unavailable')`.
- A result list with status, `code`, and `requestId` per call.

Inputs have labels, errors use `role="alert"`, the countdown uses `aria-live="polite"`. No design kit is used (item #4). The name `dev` joins the reserved top level names of spec 0001 section 3.

### Security model

- Token in memory only, inside a closure. Never in `localStorage`, `sessionStorage`, a cookie the app writes (except the non secret hint), or a URL. Never logged. Never copied into an `ApiError`. The dev `debug` hook never returns it and does not exist in production.
- `create-session.ts`, `client.ts`, `hint.ts` import `client-only`, so a Server Component that imports them fails the build. Each server render builds its own session object that never receives a token, so nothing can pass between visitors.
- The client only sends requests to `NEXT_PUBLIC_API_URL`, because `path` cannot hold a host.
- Ending a session aborts requests that carry the old token and drops any late result, so the previous person's data cannot come back into the cache.
- The refresh cookie `rt` stays `HttpOnly` and untouched; the hint cookie holds only `1` and is never proof of login.
- Hiding a button by permission is a convenience. The backend decides.
- Message text from the API is rendered as text only.
- No regulated data. Email and phone are ordinary personal data, kept in memory only and cleared with the session.

### Configuration required

- No new environment variable. The address is `NEXT_PUBLIC_API_URL`, read through `src/lib/env.ts`.
- New dependencies: `react-hook-form`, `@hookform/resolvers` (versions per spec 0001, pinned at install), and `client-only` (it exists in `node_modules` through Next.js but is not a direct dependency yet, unlike `server-only`).
- For manual checks the backend must run with `ACCESS_TTL_SECONDS=60` (its minimum) so a token expires in a minute.

### Critical test scenarios

- Happy path: open `/dev/session`, call `GET /plans`, log in, call `GET /auth/me`, reload the page and see the session come back, verifies **AC-1**, **AC-3**, **AC-4**.
- Concurrency: with `ACCESS_TTL_SECONDS=60`, wait until the debug panel shows under 30 seconds, press "five parallel calls"; the Network tab shows one `POST /auth/refresh`, the refresh count goes up by one, and all five succeed, verifies **AC-5**.
- Retry once: switch the early refresh margin to 0, wait past 60 seconds, press `GET /auth/me`; the first attempt answers 401 `TOKEN_EXPIRED`, one refresh follows, the resend succeeds, the refresh count goes up by one, verifies **AC-6**.
- Optional read: wait until the panel shows under 30 seconds, call `GET /listings?pageSize=1` with a logged in tenant; one refresh happens first and `isFavorite` is `false`, not `null`, verifies **AC-7**.
- Failure case: log in with email `abc`; the 400 appears under the email input, verifies **AC-8**. Register with an email that exists; `EMAIL_TAKEN` appears under the email input, verifies **AC-8**. Press "twelve wrong logins"; a countdown appears and the button stays disabled, verifies **AC-9**.
- Temporary outage: stop the backend, reload with a session; the state is `guest('unavailable')` and the hint is still set. Start the backend and press "check session again"; the state becomes `user`, verifies **AC-4**.
- Session loss: sign out in tab A; in tab B press a required call after the token expires; tab B ends as `guest('revoked')`, verifies **AC-11**.
- Isolation: log in as user A, run the buttons (the debug panel shows a non empty cache), sign out (cache size 0), log in as user B; nothing from A appears, verifies **AC-12**.
- Permission: a guest pressing a required call gets 401 `TOKEN_MISSING` with no request in the Network tab, verifies **AC-1**.
- Build: import `create-session.ts` from a temporary Server Component; the build fails, verifies **AC-13**. Then `npm run build` on the clean tree and open `/dev/session` on `next start` for a 404, verifies **AC-14**. Change `NEXT_PUBLIC_API_URL`, rebuild, grep `.next/static`, verifies **AC-2**.

## Build plan

Tracer Bullet (your project default): five thin threads, each one runs end to end through the lab page before the next thickens it. Each milestone is one `/develop` pass.

**M1. Public call thread**: one real request through every layer
1. Install `client-only`. Copy contract Appendix B into `src/lib/api/types.ts` with a header naming the source file and date, renaming its `ApiError` interface to `ApiErrorBody`, satisfies **AC-10**
2. Write `errors.ts`, `rate-limits.ts` (with the whole segment matching rule), and `http.ts` (pure, no React, no `client-only`), satisfies **AC-9**, **AC-10**
3. Write `client.ts` with mode `none`, query string, JSON and `FormData` bodies, per attempt timeout, abort handling, and response parsing, satisfies **AC-1**, **AC-2**, **AC-10**
4. Add `src/app/dev/session/page.tsx` (404 in production) and a first `session-lab.tsx` that calls `GET /plans` and prints `total`, satisfies **AC-1**, **AC-14**

**M2. Login thread**: a real session
1. Install `react-hook-form` and `@hookform/resolvers` for the lab forms, satisfies **AC-3**
2. Write `hint.ts` and `create-session.ts` with the token closure, `epoch` and its abort controller, the internal path for `/auth/me`, `signIn` and `signUp` in the order fixed above, a stable `getState`, and `subscribe`, satisfies **AC-3**, **AC-12**
3. Add mode `required` to `client.ts` (attach token, local `TOKEN_MISSING` that never ends a session, listen to the epoch controller), satisfies **AC-1**, **AC-12**
4. Write `auth-provider.tsx` with `useSession`, `useApi`, `useSessionActions`, `can`, wiring `onSessionEnd` and `onUserChange` to the query client; mount it in `providers.tsx`. Initial state `loading` on server and client; no `Date.now()` or `document` during render, satisfies **AC-3**, **AC-13**, **AC-14**
5. Extend the lab: login and register forms, session panel, a button for `GET /auth/me`, satisfies **AC-1**, **AC-3**

**M3. Stay logged in**
1. Add the shared refresh (`refreshing`) with its own timeout, waiters that race their own signal, the token comparison before a second refresh, the fallback to a still valid old token, `refreshBlockedUntil`, and the one retry on `TOKEN_EXPIRED`, satisfies **AC-5**, **AC-6**
2. Add `restore()` using the hint, with `guest('unavailable')` and a second call allowed, called from the `AuthProvider` effect and safe under StrictMode, satisfies **AC-4**, **AC-5**
3. Add mode `optional` with the early refresh and its never throws rule, satisfies **AC-7**
4. Add the dev only `session.debug` and the lab's debug panel, margin switch, five parallel calls, `GET /listings?pageSize=1`, and the "check session again" button, satisfies **AC-4**, **AC-5**, **AC-6**, **AC-7**

**M4. Errors people can see**
1. Write `fieldErrors` (with the fixed code map), `applyFieldErrors` (with `root.server`), and `describeError`, satisfies **AC-8**
2. Add 429 handling: `retryAfterSeconds` and `retryAfterExact` from header or table; `formatWait` and `useCountdown(error)`, satisfies **AC-9**
3. Write `query-retry.ts` and set the `QueryClient` defaults in `providers.tsx`, satisfies **AC-10**
4. Extend the lab: field errors under inputs, countdown, "twelve wrong logins" button, buttons running through `useQuery`, satisfies **AC-8**, **AC-9**

**M5. Ending a session cleanly**
1. Add `endSession(reason)` in the fixed order, used by every path, and `signOut`, `signOutAll`, `reload`, with `signIn` from `user` signing out first, satisfies **AC-11**, **AC-12**
2. Wire the terminal and transient rules for refresh and token calls, including `REFRESH_TOKEN_MISSING` while logged in and the best effort logout after `TOKEN_INVALID`, satisfies **AC-11**
3. Finish the lab (sign out buttons, `endedReason` shown, cache size shown), run `npm run check` and `npm run build`, satisfies **AC-11**, **AC-12**, **AC-14**

Every AC appears in at least one task and every task names an AC. **AC-2** and **AC-13** are checked by experiment (bundle grep, temporary import), not by code.

## Consequences

**Positive**:
- Later features get tokens, refresh, error parsing, and permission checks for free through `useApi()` and `useSession()`.
- No mutable module variable and no token on the server, in line with `AGENTS.md`.
- The races a cross check found (the restore waiting on itself, late results reviving a signed out session, one cancelled query killing a shared refresh) are designed out and checked by hand.
- The pure core (`http.ts`, `errors.ts`, `rate-limits.ts`) is already shaped for `server.ts` in item #8.

**Negative / tradeoffs**:
- The session has more moving parts than a plain token holder (`epoch`, abort controller, two promises, a refresh block). It is the price of the races above, and it is the part most worth testing later.
- Code outside React cannot reach the client without being handed it. Features use hooks, or receive `api` as a parameter.
- Pages on a slow API show placeholders for the phone, heart, and follow controls until the restore ends, because the state starts as `loading`.
- `guest('unavailable')` is a state every login page has to handle (a retry button), or a person with a valid session may think they were logged out.
- Logout lasts only as long as one call: if the network fails, the server session lingers until it expires.
- Without tab to tab messaging, a logout in one tab reaches the others only at their next refresh or 401.
- The 429 wait read from the table can be longer than the true wait until the backend exposes `Retry-After`.
- Permissions shown can be stale until `reload()` or a page load.
- The dev only `debug` hook is extra surface that must stay out of production.
- You must run the backend with `ACCESS_TTL_SECONDS=60` to prove the refresh criteria by hand.

**Neutral**:
- `react-hook-form` and `@hookform/resolvers` arrive in this item instead of #5. They were already chosen in spec 0001.
- `/dev/session` is code that exists to be deleted. It adds the reserved name `dev`.
- Response types are trusted, not parsed at runtime. A drift from the contract shows up when you try the screen.

## Follow-up

- [ ] Delete `src/app/dev/session/` when item #5 ships a real login, and remove `dev` from the reserved names.
- [ ] Spec 0001 section 3: add `dev` to the reserved top level names (one line, update in place).
- [ ] Spec 0001 `verify.md`: the waiting step "(feature 3, API client)" moves into this spec's `verify.md` as the AC-2 check.
- [ ] Item #5: the route gate (`?next=`), reading `endedReason` to explain a lost session, a retry for `guest('unavailable')`, and the real forms using `applyFieldErrors`.
- [ ] Item #8: `server.ts` built on `http.ts`, plus the `API_URL` check still waiting in spec 0001's `verify.md`.
- [ ] Backend, one line (already in spec 0001): `exposedHeaders: ['Retry-After', 'X-Request-Id']`. After that, `readRetryAfter` reads the header first with no code change.
- [ ] Optional later: `/test` can lock the shared refresh, retry once, the epoch drop, and the rate limit table with a fake `fetch`, because `createSession` and `createApiClient` take `fetch` and the clock as arguments.
- [ ] Optional later: refresh the profile after each token refresh so permissions never go stale for a whole session.
- [ ] `AGENTS.md` `## Rules` could name the session hooks, the "token only in the session closure" rule, and the "always pass `signal`" rule (`/sync` owns that file).

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
