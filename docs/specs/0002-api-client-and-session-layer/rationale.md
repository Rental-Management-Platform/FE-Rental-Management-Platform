# 0002. Rationale: API client and session layer

Build spec: [index.md](index.md)

## Context

The backend is finished and its contract is `api-for-frontend.md`. The frontend has no code that talks to it yet: `src/lib/` holds only the two env files, and `providers.tsx` mounts TanStack Query and nothing else. Item #3 is the FE equivalent of a data model, because every later screen (about 25 of them) depends on how calls, tokens, and errors work.

The forces that shape the choice:

- **The token has no safe place except memory.** The contract forbids storage. The refresh cookie `rt` is `HttpOnly` and limited to `/api/v1/auth`, so only the browser can restore a session, and only by calling `POST /auth/refresh`.
- **Tokens expire quietly in one place.** Four public reads accept an optional token and never answer 401 when it has expired. They just return guest data. A client that only reacts to 401 would make a logged in person lose a phone number or a heart with no error.
- **Many callers, one refresh.** Screens fire several requests at once, and React StrictMode runs effects twice in development. The backend punishes a reused refresh cookie outside a 10 second grace by killing the whole session, and refresh is limited to 60 per minute per IP.
- **Browser and server are different worlds.** Under Next.js 16 with Cache Components, Client Components are also prerendered on the server. Anything that reads the clock or `document` during render, or keeps a token in a module variable, behaves differently on the two sides. A module variable on the server would be shared by every visitor.
- **Errors are part of the product.** The contract gives a precise error shape and a long code table. Forms need messages per field, and 429 needs a wait the browser often cannot read, because the backend does not expose `Retry-After` across origins yet.
- **Project rules.** `AGENTS.md` asks for a functional style, no mutable module state, `ApiError` as a typed value, and no `any`. Spec 0001 already fixed `fetch`, TanStack Query, and the file names.
- **A demo with a deadline.** Time is short and the scope uses the Alpha level. No screen of the real app exists yet to prove the work.

If this is not decided, each feature invents its own token handling, and the first race between two refreshes costs someone their session.

## Options considered

### Option 1: Session built by a factory (closure state), mounted in `AuthProvider`; one browser client over a pure shared core

`createSession` returns an object of functions whose state lives in a closure. `AuthProvider` creates one with `useState` and shares it through context. `createApiClient` takes the session's token functions as arguments. The pure parts (`http.ts`, `errors.ts`, `rate-limits.ts`) have no React and no browser API, so the later `server.ts` reuses them.

**Pros**:
- Matches the "no mutable module state" rule. A server render builds its own throwaway object, so no token can cross visitors.
- Easy to test later: `fetch` and the clock are arguments.
- Session state, token, and refresh live together, so they cannot disagree.

**Cons**:
- Code outside React must be given the client.
- A little more wiring than a global.
- Fast Refresh on the session file resets the token in development.

### Option 2: Module singleton in `session-store.ts`

A file with `let token`, `getAccessToken()`, and `setAccessToken()`, as contract section 4.1 sketches ("biến module").

**Pros**:
- Smallest code, callable from anywhere, including plain functions.

**Cons**:
- Breaks the project rule on mutable module state.
- If it is ever imported on the server, one visitor's token is visible to the next. `client-only` can block that, but the design relies on a guard instead of making the mistake impossible.
- Session state still needs a second store for React, so token and state can drift apart.

### Option 3: An HTTP library with interceptors (axios or ky) for the client

Let the library queue requests and retry on 401.

**Pros**:
- Interceptors give a ready place for the retry on 401.

**Cons**:
- Spec 0001 chose native `fetch` for server and browser parity and Next.js caching, so this reverses a decided item.
- The shared refresh, the early refresh for optional reads, the session state, and the error shape are still hand written.
- Adds weight and a dependency for a code size that is about the same.

An auth framework (for example Auth.js) was not weighed as an option: the backend owns login, refresh, and cookies, so a framework would have to be bent around them.

## Rationale

Option 1 is the only one that satisfies the project rule and the server safety concern by construction instead of by discipline. Under Cache Components the same module can run on both sides, and a closure created per mount cannot be shared by two visitors. That matters more than the extra wiring, which is a few hooks.

The early refresh and the shared refresh live inside the session, not inside the client, because both depend on the token's clock and on whether a restore is in progress. Keeping them in one closure removes the chance that a screen sees a token the refresh has already replaced. The client stays thin: it asks "give me a token for this call" and "refresh once", and applies the retry rule.

The pure core is split out now because the first server read (item #8) needs the same URL building, error parsing, and rate limit table, and parsing errors differently on the two sides would produce two `ApiError` shapes.

### Smaller decisions and their runners up

| Decision | Pick | Why | Runner up |
|---|---|---|---|
| Hint for "has a session" | Cookie `has_session=1`, 30 days | Contract's own suggestion (section 4.1 step 5) and what you chose; expires by itself and matches the default refresh lifetime. A first draft used 90 days; the cross check pointed out that this contradicted both the contract and your choice, so it went back to 30 days as a named constant. If the backend raises `REFRESH_TTL_DAYS`, raise the constant too | `localStorage`: syncs across tabs but needs its own expiry logic |
| Where `user` and `permissions` live | In the session state | One source of truth with the token. Gates read it synchronously | TanStack Query cache: refetches on focus, but two sources of truth |
| Response checking | TypeScript types only | Backend is finished and its owners update the contract with every change. About 40 schemas is too much for a deadline | Zod on `TokenResponse` and `MeResponse`: catches drift where it hurts most |
| How a call says it needs a token | `auth` option, default `required` | About 60 of 69 endpoints need login, so the default is the short form, and a guest fails locally instead of sending a doomed request | Three method families: clearer to read, triple the surface |
| Forms on the lab page | Install RHF now, build `applyFieldErrors` | "400 shown per field" is a done condition, and this is the mapping `AGENTS.md` prescribes. The lab form is the first real form | Plain state and defer: no new package, but the mapping stays unproven until #5 |
| Several tabs | No messaging | Contract describes this behavior and accepts it. Saves about 30 lines and an extra edge case | `BroadcastChannel`: instant logout in other tabs |
| Level of checking | Alpha | Manual proof is possible with `ACCESS_TTL_SECONDS=60` | Beta with Vitest: sturdier, adds a test runner for the whole project |
| Server wrapper `server.ts` | Item #8 | It cannot be proven before a page reads the API on the server | Build now: code with nothing to run it |
| Route gate | Item #5 | Needs the login page path and the `?next=` rule | Build now: guesses both |

### Decisions I made myself (RECOMMEND items)

| Decision | Pick | Why | Runner up |
|---|---|---|---|
| `ApiError` form | A plain `Error` made by a factory with an `isApiError` guard | The functional rule in `AGENTS.md`; still an `Error`, so stack traces and Next.js error handling work | `class ApiError extends Error`: familiar, but a class |
| Where session actions live | `src/lib/session/`, not `features/auth` | They change the token, so they must sit with it. `features/auth` keeps forms and schemas | `features/auth/api`: matches the folder rule but splits the token from its writers |
| Request timeout | 20 seconds | Longer than a normal API answer, shorter than a person waits | None: any number is a guess; one constant |
| Wait for restore in required calls | Yes | Stops a call sent too early from failing with `TOKEN_MISSING` when a session is about to be restored | Fail fast: simpler but flaky at page load |
| Refresh failure meaning | Only the proven end of a session ends it | A 5xx or a 429 on refresh is not a logout; signing someone out for a server hiccup is the worst outcome | End on any failure: simpler |
| Query retry | Once, only for network errors and 502 to 504 | Contract says never retry a 429, and a retry does not help a 4xx or a 500 | Library default of 3: wastes the rate limit |
| Header `X-Request-Id` | Not sent | An extra header on a cross origin call can fail the CORS preflight. The id comes from the error body | Send it: tidier logs, with a CORS risk |
| `ApiError` global registration in TanStack | Not registered | A query can throw things that are not `ApiError` | Register: typed `error` everywhere, sometimes wrong |
| Cache on session end | `cancelQueries` then `clear()`; `invalidateQueries` on guest to user | A phone number or heart from the last person must not stay in memory | Invalidate only: leaves old data visible until it refetches |
| Permissions after refresh | Not refetched | One fewer request every 15 minutes; `reload()` exists | Refetch `/auth/me` after each refresh |
| Lab page location | `src/app/dev/session`, 404 in production | Easy to delete, never shipped. `dev` becomes a reserved name | A route in `(public)`: mixes a throwaway with real routes |

### Decisions added after an independent cross check

An Opus read of the first draft found gaps. You chose to apply the recommended fixes. The ones that changed the design:

| Decision | Pick | Why | Runner up |
|---|---|---|---|
| Session's own `/auth/me` calls | An internal path in mode `none` with the header passed by hand, and a separate `restoring` promise | Otherwise the restore waits for itself and the page hangs forever | Skip the wait for required calls: removes the page load `TOKEN_MISSING` flake protection |
| Late results after sign out | An `epoch` counter plus an abort controller per epoch; old results dropped, in flight authed requests aborted | The main race in a token layer: a slow refresh or login must not revive a signed out session or mix two accounts. It also closes the hole where a mutation's `onSuccess` writes the old person's data back | Check `useSession().status` in every callback: relies on each feature remembering |
| Waiters when a refresh fails | Required waiters get the refresh's `ApiError`; optional waiters never throw and use the old token if still valid | A phone number read must not fail because a background refresh did | Everyone rejects: breaks the "optional never fails for auth" promise |
| Refresh blocked by 429 | Remember `refreshBlockedUntil`, reject locally until then | Refresh is limited per IP, so a local block is safe, and a retry only lengthens the block. Login is limited per email, so it is not blocked locally | No local block: every later call re-hits the limiter |
| `REFRESH_TOKEN_MISSING` while logged in | Ends the session as `revoked`; silent `guest(null)` at page load | Logout in another tab deletes the shared cookie, and contract section 4 step 3 lists it as ending the session | Treat as transient: a signed out tab would never notice |
| Transient failure at restore | New `endedReason: 'unavailable'` and `restore()` can run again | A valid session must not turn into a guest for the life of the page because the API blinked. This extends the model you approved by one value | Reload the page by hand |
| Sign in while logged in | Sign out first | Otherwise the old server session stays alive and counts toward the 10 session cap | Just overwrite the token |
| `signOutAll` failure | Reject and keep the session | The other devices are still logged in; hiding that would be a false "done" | Clear locally anyway |
| Order on session end | `epoch`, token, hint, `onSessionEnd` (cache), state, notify | The cache is empty before any component sees the new state | State first, cache after |
| Dev only `debug` hook and a lab that uses `useQuery` | Show seconds left, refresh count, and cache size; margin switch | AC-6, AC-7, AC-12 cannot be observed by hand without them | A fake `fetch` test: needs a test runner (Beta) |
| `ApiError` name clash | Appendix B copy renamed `ApiErrorBody`; unknown backend codes become `HTTP_ERROR` | One `ApiError` in the code base | Keep both names |

Kept as designed: the wait for the restore in required calls (it prevents the `TOKEN_MISSING` flake at page load), and no `endedReason` for a failed login with `ACCOUNT_LOCKED`.

## Context for later readers

- The contract's own sample code uses a module variable and a `has_session` cookie. This spec keeps the cookie and replaces the variable, for the reasons above.
- `format.ts` is created here with `formatWait` only, because the 429 wait is a done condition. Money, area, and dates join it later.
