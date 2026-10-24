# src/lib

Shared code that has no UI: the API client, the session, form helpers, env and small formatters. Contract with the backend: [api-for-frontend.md](../../api-for-frontend.md). Design: [spec 0002](../../docs/specs/0002-api-client-and-session-layer/index.md).

## Where things live

- `api/`: `createApiClient` (`client.ts`), pure request helpers (`http.ts`: `buildUrl`, `parseResponse`, `readRetryAfter`), the one error shape (`errors.ts`: `ApiError`, `isApiError`, `describeError`), wait times after a 429 (`rate-limits.ts`) and the query retry default (`query-retry.ts`). Types of the API answers are in `types.ts`.
- `session/`: `createSession` holds the access token, `AuthProvider` and the hooks `useSession`, `useApi` and `useSessionActions`, `can(state, permission)`, and the end of session reasons.
- `forms/`: `applyFieldErrors` and `useFormFailure` turn a failed submit into field messages, a form level message and a 429 countdown.
- `env.ts` (browser) and `env.server.ts` (server only): the only places that read environment variables, both validated with Zod.
- `format.ts` (`formatWait`), `use-countdown.ts`, `focus-ring.ts`, `site.ts` (site name and description), `utils.ts` (`cn`).

## Rules

- Every call goes through the one client, with an auth mode: `none` (public routes, login, refresh), `optional` (token when there is one) or `required` (a guest fails on the machine with `TOKEN_MISSING`). Inside a `queryFn`, always pass the `signal` TanStack gives you.
- The access token lives only in a variable inside `createSession`. It is never in React state, a hook result, an `ApiError`, storage or a URL. A path passed to `buildUrl` must start with `/`, so a token can only go to the API address.
- A failed call throws an `ApiError`. Narrow it with `isApiError`, and show it with `describeError`. The support code (`requestId`) is for a 5xx answer only.
- Only a server answer can end a session. A network error, a 5xx or a 429 never does.
- Queries retry once, and only when a retry can help. Mutations never retry.
- `can()` checks a permission only. Hiding a control is a convenience, and the backend decides.
- Money, area and date formatting joins `format.ts` with the first feature that shows a price. Until then the sample screens use their own helper in `src/app/dev/ui/screens/`.
- The server reads public data as a guest and never holds a token. The server reader (`src/lib/api/server.ts`) is not built yet.

_Drafted by /sync from the introducing change, worth a quick human pass._
