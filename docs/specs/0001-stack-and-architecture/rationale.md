# 0001. Rationale: stack and architecture for the web frontend

The build spec is in [index.md](index.md). This file holds the reasoning that `/develop` does not need.

## Context

> ⚠️ Premise note: The login cookie is `SameSite=Strict`, and hosting is still undecided. On `localhost` it works across ports. If the frontend and the API are later hosted on two unrelated sites, the browser stops sending the cookie, and users look logged out after every page reload with no clear error. Treat hosting as a decision to take before any online demo. This spec keeps one switch (`NEXT_PUBLIC_API_URL`) so the fix stays cheap.

**What exists.** A `create-next-app` scaffold (Next.js 16.4.2, React 19.3, Tailwind 4, TypeScript, ESLint) with `cacheComponents` and `partialPrefetching` already turned on. The backend is finished, and its contract is `api-for-frontend.md`. The repo is a single app, not a monorepo, and holds no specs yet.

**Forces from the product.** Three audiences: guests and tenants (phone first, SEO needed), landlords and admins (desktop first, no SEO). Vietnamese only. Accessibility target WCAG AA. A demo or thesis with a deadline, run at Alpha level (verify after build).

**Forces from the backend contract.**
- The access token lives 15 minutes and must stay in browser memory.
- The refresh cookie `rt` is `HttpOnly`, `SameSite=Strict`, and limited to `Path=/api/v1/auth`. So the Next.js server can never see who is logged in.
- `GET /listings` and `GET /listings/:slugCode` are public, accept an optional token, and answer `Cache-Control: private, no-store`. A token adds `isFavorite` and the landlord phone.
- Rate limits count per IP, and reads such as `GET /listings` allow 300 per minute.
- The API's default port is 3000, the same as `next dev`. The backend allows origin `http://localhost:5173` by default, and `localhost` must be used on both sides.
- Photos are original uploads up to 5 MiB, served from the API with no resizing.

**Forces from Next.js 16.4.** Data is fetched fresh by default. With Cache Components, any uncached fetch or runtime read (`params`, `searchParams`, `cookies`) must sit behind `<Suspense>` or the build fails. The image optimizer refuses `localhost` sources unless told otherwise. Cache Components needs the Node.js runtime.

**If nothing is decided.** Each of the other 28 items would invent its own way to fetch data and keep the session, and the SEO pages and the personal features would pull in opposite directions.

## Options considered

### Option 1: One Next.js app, guest HTML on the server, personal data in the browser (chosen)

The server fetches public data with no token and streams the page. The browser restores the session and repeats the same reads with the token to fill in `phone`, `isFavorite`, and `isFollowing`. Landlord, admin, and auth screens are browser only. The browser calls the API directly.

**Pros**:
- Fits the backend contract exactly (token in memory, cookie untouched by the server).
- Real HTML for SEO with almost no auth code on the server.
- No backend change is needed to run (one optional line, see the contract revision note below).

**Cons**:
- Logged in users see a short delay before personal parts appear, and pay a second API call.
- Server reads share one IP and one rate limit.
- Under Cache Components the team must keep `await` inside `<Suspense>` boundaries.

### Option 2: Next.js as a middleman (BFF)

Login and refresh go through Next.js route handlers, which keep their own HttpOnly session cookie. Server Components then read that cookie and fetch with the token, so the server can render personal pages.

**Pros**:
- The phone number and hearts can be in the first HTML.
- The browser never handles a token.

**Cons**:
- Rebuilds token refresh, rotation, and the 10 second reuse grace on the server, and drifts from `api-for-frontend.md`, which says the token lives in browser memory (basis: backend `0002-authentication-tokens.md`).
- Every API call that needs a login becomes a proxy hop, including photo uploads.
- Personal pages cannot be cached or shared, so the static shell gains little.
- The whole team must test a second auth path for a demo deadline.

### Option 3: Browser only app (no server rendering)

All pages render in the browser from API calls.

**Pros**:
- The simplest data flow. One fetch path.

**Cons**:
- Public pages lose SEO and link previews, which the scope requires.
- Slower first paint on phones.

### Option 4: Two apps (a Next.js public site plus a separate single page app for landlords and admins)

**Pros**:
- Clean split between SEO pages and portals. Each can deploy alone.

**Cons**:
- Two projects to set up, lint, deploy, and keep in sync, with a duplicated API client and session code.
- Doubles the hosting question and the CORS and cookie setup. Too much for the team and the deadline.

### Smaller choices

| Choice | Picked | Runner up | Why |
|---|---|---|---|
| HTTP client | Native `fetch` wrapper | Axios | Runs on server and browser and works with Next.js caching. Axios adds weight and does not join Next.js caching. `ky` auto retry would fight the rule that 429 is never retried. |
| Browser data | TanStack Query 5 | SWR 2 | Mutations, invalidation, and pagination are used on most admin and landlord screens. SWR is smaller (about 4 KB against 13 KB) but weaker there. |
| Forms | React Hook Form + Zod | RHF alone | Zod gives shared schemas and typed errors for the nested property form (`fees.0.price`). Server Actions do not fit, because the token is not on the server. |
| Images | `next/image` with the optimizer | `next/image` with `unoptimized` | Phones should not download 5 MiB originals on a listing grid. |
| Freshness | Uncached and streamed for listings, detail, landlord pages | One minute cache | Hidden or locked listings must disappear at once in a live demo. Catalogs are cached because they rarely change. |
| Routes | Route groups with prefixed areas | One `/dashboard` that switches by role | Separates the mobile first and desktop first shells and keeps permission checks simple. |
| Route guard | Client side gate | `proxy.ts` with a hint cookie | The server cannot see `rt`. A hint cookie adds a moving part to keep in sync and can be faked. |
| Folders | By feature | By layer | 29 items over three audiences. One feature stays in one folder. |

## Rationale

Option 1 is the only one that satisfies both hard constraints at once: public pages must be real HTML for SEO, and the access token must stay in browser memory and the refresh cookie must stay unseen by the server. Option 2 satisfies the first constraint by breaking the second, and moves the work of the backend's session rules into a layer the team would have to build and test again. Option 3 fails the SEO requirement. Option 4 solves nothing Option 1 does not, at twice the setup cost.

The extra cost of Option 1 is small for this product. The personal parts are three small fields (phone, heart, follow), so a short overlay delay is acceptable. Guests, who are the SEO audience, never wait for an overlay. The uncached freshness choice follows the demo script directly: steps 8 and 9 hide a listing and lock a landlord, and guests must see it vanish. At the expected demo traffic, one API call per read per visit (metadata and page share it through React `cache()`) is far below the 300 per minute limit, and a short `use cache` is the ready fix if it ever matters.

Port 5173 and `localhost` on both sides come straight from the backend defaults. They satisfy the scope's done condition (the browser calls the API with no CORS block) with no backend change.

Guests also get one extra browser request on the detail page. The server read counts as a single viewer, and the demo script shows view numbers on the landlord profile, so under counted views would look like a bug. Runner up: accept the under count (the first version of this spec did).

No engineer preference conflicted with the recommendation. Every pick matched the recommended option.

**Decisions made while writing (pick, runner up, why):**
- Overlay refetches the same URL with a token: runner up, a dedicated "personal fields" endpoint. The backend has none, and none is needed.
- Catalog cache profile `hours`: runner up `days`. Hours keeps admin edits visible soon even if the Server Action is missed.
- Cache clearing by Server Action with `updateTag`: runner up, wait for the cache to expire. The action carries no data and no privilege.
- Two env modules, `src/lib/env.ts` (public values, validated) and `src/lib/env.server.ts` (server only): runner up, one file. `NEXT_PUBLIC_*` must be written as literal references to be inlined, and `API_URL` must never reach browser code. Validation makes a wrong address fail loudly at startup.
- Local check of the listing code before any API call: runner up, let the API answer 404. The local check keeps junk paths from spending the shared rate limit.
- Overlay merges personal fields by listing `id` instead of replacing the list: runner up, swap the whole list once the token read finishes. Replacing can make cards jump when the list changed between the two reads.
- `error.tsx` per route group with `requestId` shown: runner up, one global error page. Per group lets the landlord and admin shells keep their navigation.
- No error tracking service and no CSP: runner up, a hosted tracker. Not worth it at demo scale. CSP fights the static shell.
- Native `Intl` with `vi-VN` and `Asia/Ho_Chi_Minh`, Vietnamese text written inline, no i18n or date library: runner up, `date-fns` or `next-intl`. The scope fixes one language. Date picker needs belong to item #4.
- npm stays: the lockfile exists and nothing in the stack needs another manager.
- Image base is the origin of `NEXT_PUBLIC_API_URL`, not the full URL: the media paths already begin with `/api/v1`.

## Landscape check (2026-10-23)

Versions read from the npm registry on the date above. All support React 19.

| Package | Latest | React range |
|---|---|---|
| `@tanstack/react-query` | 5.104.5 | `^18 \|\| ^19` |
| `react-hook-form` | 7.90.0 | `^16.8.0 \|\| ^17 \|\| ^18 \|\| ^19` |
| `zod` | 4.6.7 | not applicable |
| `@hookform/resolvers` | 6.0.0 | peer `zod ^3.25.0 \|\| ^4.0.0`, `react-hook-form ^7.55.0` |
| `swr` (runner up) | 2.5.1 | `^16.11.0 \|\| ^17 \|\| ^18 \|\| ^19` |

Agent skills found by `npx skills find` and installed on request: `next-dev-loop`, `tanstack-query-best-practices`, `react-hook-form`, `zod`. The forms skill first picked, `jezweb/claude-skills@react-hook-form-zod`, no longer exists in its repo, so the two `pproenca/dot-skills` skills replaced it. The registry search results are not always current.

## Cross check (2026-10-23)

A read only reviewer on a different model (Opus) read the spec against the backend contract, the scaffold, and the bundled Next.js 16.4 docs. Verdict: the architecture is sound, and nothing simpler satisfies both SEO and the in memory token.

- **Corrected by the author (no choice involved):** production error handling (Server Component errors reach `error.tsx` only as a generic message plus `digest`), the image local IP setting (decided from the API host, not `NODE_ENV`), image sourcing in proxy mode, the config keys `next.config.ts` keeps, and the photo cache note.
- **Gaps applied as recommended, on the engineer's pick:** not found handling, local code check, canonical slug, build needs the API, React `cache()` sharing, the env module split, the overlay merge rule, and the CORS proof.

## Contract revision (2026-10-23)

The backend team revised `api-for-frontend.md` the same day (2146 to 2693 lines, no API change). It added section 4.1 for Next.js, which describes the same two layer model as this spec: a guest version rendered on the server with no token, and the personal fields added in the browser. It also confirmed that `rt` never reaches the Next.js server. What the revision changed in this spec:

- **Proactive refresh.** The four optional login reads never answer 401 for an expired token, so "refresh on 401" cannot protect them. The token getter refreshes first when under about 30 seconds remain.
- **Three session states** (`loading`, `guest`, `user`) so the overlay and the placeholders behave.
- **Hidden headers.** `Retry-After` and `X-Request-Id` cannot be read by scripts across origins. Browser code uses the error body and the rate limit table until the backend exposes them. The engineer chose to ask for the backend line (`exposedHeaders`).
- **Guest view count** via one extra browser request on the detail page, chosen by the engineer on the recommendation above.
- **Date only values** (`availableFrom`) skip time zone conversion. Appendix B (TypeScript types) and C (input rules) became the source for `types.ts` and the Zod schemas.
- **Hint flag wording.** The backend suggests a `has_session=1` cookie, so the security rule now allows a non secret flag but never the token.

Not changed: the backend suggests caching the guest version for about 60 seconds to protect the 300 per minute limit. The spec keeps reads uncached, as the engineer chose, so a hidden listing vanishes at once. A short `use cache` stays the ready fix.

## References

**Project sources**:
- `api-for-frontend.md` (revision of 2026-10-23): sections 2 (conventions, ports, `localhost`, hidden headers), 3 (rate limits), 4 and 4.1 (tokens, session, Next.js), 6.19 and 6.20 (public reads), 6.28 (photos), 8.1 (principles), 9 (known limits), Appendix B (types) and C (input rules)
- `docs/scope/foundations.md` item 1, and `docs/scope/index.md` (decisions already taken)
- `next.config.ts` and `src/app/layout.tsx` (the scaffold as it stands)
- Next.js docs bundled with 16.4.2, under `node_modules/next/dist/docs/01-app/`: `01-getting-started/08-caching.md`, `02-guides/authentication-with-cache-components.md`, `02-guides/incremental-static-regeneration-cache-components.md`, `02-guides/mcp.md`, `02-guides/ai-agents.md`, `03-api-reference/02-components/image.md`, and under `05-config/01-next-config-js/`: `cacheComponents.md`, `partialPrefetching.md`, `htmlLimitedBots.md`
- Backend spec `../BE-Rental-Management-Platform/docs/specs/0001-backend-foundation/0002-authentication-tokens.md` (cookie attributes and rotation)
- Installed community skills: `next-dev-loop`, `tanstack-query-best-practices`, `react-hook-form`, `zod`

**Practices & standards**:
- Keep tokens out of script readable storage: short lived access token in memory, refresh token in an `HttpOnly` cookie (OWASP session management guidance)
- Backend for frontend (BFF) pattern, weighed and rejected in Option 2
- Push dynamic access down the tree so the static shell stays large (Next.js streaming guidance)
- Boring technology first: current majors of widely used libraries

**Links** (web verified 2026-10-23 against the npm registry):
- TanStack Query: https://registry.npmjs.org/@tanstack/react-query/latest
- React Hook Form: https://registry.npmjs.org/react-hook-form/latest
- Zod: https://registry.npmjs.org/zod/latest
- Hookform resolvers: https://registry.npmjs.org/@hookform/resolvers/latest
- SWR: https://registry.npmjs.org/swr/latest
