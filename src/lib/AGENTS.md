# src/lib

Shared code that has no UI: the API client, the session, form helpers, env and small formatters. Contract with the backend: [api-for-frontend.md](../../api-for-frontend.md). Design: [spec 0002](../../docs/specs/0002-api-client-and-session-layer/index.md).

## Where things live

- `api/`: `createApiClient` (`client.ts`), pure request helpers (`http.ts`: `buildUrl`, `parseResponse`, `readRetryAfter`), the one error shape (`errors.ts`: `ApiError`, `isApiError`, `describeError`), wait times after a 429 (`rate-limits.ts`) and the query retry default (`query-retry.ts`). `server.ts` holds `serverGet`, the public read for Server Components, and `abort.ts` holds the abort signal helpers. Types of the API answers are in `types.ts`.
- `session/`: `createSession` holds the access token, `AuthProvider` and the hooks `useSession`, `useApi` and `useSessionActions`, `can(state, permission)`, and the end of session reasons.
- `forms/`: `applyFieldErrors` and `useFormFailure` turn a failed submit into field messages, a form level message and a 429 countdown.
- `env.ts` (browser) and `env.server.ts` (server only): the only places that read environment variables, both validated with Zod.
- `next-path.ts` (`safeNextPath`, `homePathOf`, `afterAuthPath`: the page a person lands on after sign in, by account type), `format.ts` (`formatMoney`, `formatCount`, `formatArea`, `formatDateTime`, `formatDateOnly`, `formatPhone`, `formatWait`, `formatRating`, and for the fees of a property `feeKindLabel`, `feeUnitLabel` ("mỗi kWh"), `formatFeePrice` ("3.800 ₫" or "Miễn phí") and `formatFee`), `use-countdown.ts`, `use-return-focus.ts` (focus back to the opener for a dialog or sheet that has no trigger), `focus-ring.ts`, `site.ts` (site name and description), `utils.ts` (`cn`).
- `media.ts` (`mediaUrl`: the address of a photo from the path the API returned, or `null` when it is not a public photo path) and `listing-path.ts` (`parseListingPath`, `listingPath`: the `/<slug>-<code>` address of a listing, where only the code is sent to the API). `is-uuid.ts` (`isUuid`) says whether an address segment has the shape of an id, so a page can show not found, or skip the call, instead of spending a read on a 400 `INVALID_ID`.

## Rules

- Every call goes through the one client, with an auth mode: `none` (public routes, login, refresh), `optional` (token when there is one) or `required` (a guest fails on the machine with `TOKEN_MISSING`). Inside a `queryFn`, always pass the `signal` TanStack gives you.
- The access token lives only in a variable inside `createSession`. It is never in React state, a hook result, an `ApiError`, storage or a URL. A path passed to `buildUrl` must start with `/`, so a token can only go to the API address.
- A failed call throws an `ApiError`. Narrow it with `isApiError`, and show it with `describeError`. The support code (`requestId`) is for a 5xx answer only.
- A new error code from the backend must be added to `ERROR_CODES` in `api/types.ts` in the same change that handles it. `http.ts` turns any code that is not in that list into `HTTP_ERROR`, so code that checks for the new one would never see it.
- Only a server answer can end a session. A network error, a 5xx or a 429 never does.
- Queries retry once, and only when a retry can help. Mutations never retry.
- `can()` checks a permission only. Hiding a control is a convenience, and the backend decides.
- Money, count, area and date formatting live in `format.ts` (`vi-VN`, `Asia/Ho_Chi_Minh`). Real features use it; only the sample screens keep their own helper in `src/app/dev/ui/screens/`.
- The server reads public data as a guest and never holds a token. A Server Component reads through `serverGet` in `src/lib/api/server.ts`: no `Authorization` header, no cookie, never cached, a 10 second limit, and every failure is an `ApiError`.

_Drafted by /sync from the introducing change, worth a quick human pass._
