# 0001. Stack and architecture for the web frontend

**Date**: 2026-10-23
**Status**: Accepted

## Summary

The frontend stays on the Next.js 16.4 app you already scaffolded and talks straight to your finished backend. Public pages are built on the server as a guest, so search engines can read them. The browser then adds the personal parts (phone number, hearts, follow state), because only the browser holds the login token. The landlord and admin areas are browser screens behind a gate that checks the session. TanStack Query, React Hook Form with Zod, native fetch, and next/image cover data, forms, and photos. The app runs on port 5173, which your backend already allows.

## Decision

**Chosen option**: Option 1: One Next.js app, guest pages rendered on the server, personal data added in the browser

One Next.js app renders public pages on the server without any token, and every call that needs a login runs in the browser with the access token held in memory (basis: `api-for-frontend.md` section 4, Next.js Cache Components docs).

**Implementation skills**: `next-dev-loop` (`vercel/next.js`, `.claude/skills/next-dev-loop/`) · `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.claude/skills/tanstack-query-best-practices/`) · `react-hook-form` (`pproenca/dot-skills`, `.claude/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.claude/skills/zod/`)

## Proposed stack

| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript 5, strict mode (already set) | Types catch drift from the backend contract. Nothing to change. |
| Framework | Next.js 16.4.2 App Router on React 19.3, with `cacheComponents` and `partialPrefetching` on (already set) | Server rendering for SEO plus a streamed shell for phones. Needs a Node.js runtime, not edge. |
| App shape | One app with four route groups: `(public)`, `(auth)`, `(landlord)`, `(admin)` | Shared auth and API code, but each audience gets its own layout shell. |
| Rendering | Public pages: server renders as a guest, browser overlays personal data. Auth, landlord, and admin screens: browser only | The server never sees the token, so this is the only split that keeps both SEO and the backend contract. |
| Styling | Tailwind 4 (already set) | Kit, tokens, and components are decided in item #4. |
| HTTP client | Native `fetch` with a thin wrapper (built in item #3) | Same call works on server and browser, adds no weight, works with Next.js caching. |
| Browser data | `@tanstack/react-query` 5.104 | Caching, pagination, mutations, and invalidation for about 20 screens. React 19 supported. |
| Forms | `react-hook-form` 7.90, `zod` 4.6, `@hookform/resolvers` 6.0 | Zod does light checks, backend errors map onto fields with `setError`. The backend stays the real validator. |
| Images | `next/image` with the optimizer | The backend serves originals up to 5 MiB with no resizing. The optimizer shrinks them for phones. |
| Session | Access token in memory in the browser. Refresh cookie `rt` is owned by the backend | Matches the backend contract. The token never sits in storage a script can read. Details in item #3. |
| Route protection | Client side gate in the landlord and admin layouts | The Next.js server cannot see `rt` (its path is limited to `/api/v1/auth`). The backend stays the real check. |
| Hosting | Not decided. Develop and demo on localhost. Needs a Node.js host later | See "If hosting changes" below. |
| Observability | Browser console, plus the backend `requestId` shown on error screens | Demo scale. No error tracking service. |
| Package manager | npm | `package-lock.json` already exists. |

Not needed in this app: database, auth service, background jobs, file storage, search. All of them live in the backend.

## Architecture rules

### 1. Two data paths (the core rule)

| | Server path | Browser path |
|---|---|---|
| Runs in | Server Components and `generateMetadata` | Client Components (`'use client'`) |
| Sends a token | Never | Yes, `Authorization: Bearer`. `credentials: 'include'` only on `/auth/*` calls |
| Reads | Public GETs: listings, listing detail, landlord profile and their listings, plans, wards, amenities | Everything that needs a login, plus the personal overlay on public pages: `isFavorite`, `landlord.phone`, `isFollowing` |
| Base address | `API_URL` | `NEXT_PUBLIC_API_URL` |
| Code home | `src/lib/api/server.ts`, which imports `server-only` | `src/lib/api/client.ts` (built in item #3) |

**Overlay pattern.** The server HTML carries guest data (`landlord.phone` is `null`, `isFavorite` is `null`). Once the session is known, a client component repeats the same GET with the token and supplies only the personal fields. Guests trigger no overlay request.

**Merge rule.** The server passes the guest data down as props. A client `useQuery` (enabled only when the session is a logged in user, with the same key and params) returns `isFavorite`, `landlord.phone`, and `isFollowing`. They are merged into the server data by listing `id`. The overlay never replaces the server list wholesale, so cards do not jump if the list changed between the two reads.

**Session states and refresh.** The session has three states: `loading`, `guest`, and `user`. During `loading`, the phone, heart, and follow controls show placeholders, so the Login button does not flicker for someone who has a session. The overlay runs only in `user`. The four optional login reads (`GET /listings`, `GET /listings/:slugCode`, `GET /landlords/:id`, `GET /landlords/:id/listings`) never answer 401 for an expired token. They silently return guest data, so "refresh on 401" never fires for them. The token getter (item #3) therefore stores `expiresAt` (time received plus `expiresIn`) and refreshes first when under about 30 seconds remain (basis: `api-for-frontend.md` sections 4 and 4.1). Reads that need a login keep the usual rule: 401 `TOKEN_EXPIRED`, refresh once, retry.

**Guest view count.** The server read counts as one viewer (the Next.js server IP) per listing per 30 minutes. So on the listing detail page only, when the state is `guest`, the browser repeats `GET /listings/:slugCode` once without a token and ignores the result. The backend then counts the real visitor. Logged in viewers are counted through the overlay call. This costs one extra request per guest detail view.

### 2. Rendering and freshness

| Data | How the server reads it | Why |
|---|---|---|
| Listings list, listing detail, landlord profile, landlord listings | Uncached, inside `<Suspense>`, streamed | A hidden listing, locked landlord, or ended trial must vanish at once (demo steps 8 and 9). Each read in `server.ts` is wrapped in React `cache()`, so `generateMetadata` and the page share one request. That is one API call per read per visit, which is fine at demo scale. |
| Wards, amenities, plans | `use cache` with `cacheLife('hours')`. Wards and amenities are tagged `catalog`. `GET /plans?pageSize=50` is tagged `plans` | They rarely change and every page needs them. Admin edits (items #22 and #23) call a Server Action that runs `updateTag`. |
| `searchParams` and `params` | Awaited inside `<Suspense>` boundaries, never at the top of a layout | Cache Components rule: runtime data behind a boundary keeps the shell static. |

Content behind `<Suspense>` still arrives in the same HTML response, so crawlers that run scripts see the final page. Crawlers that only read `<head>` (link preview bots) need the bot list setting in Follow-up.

### 3. Routes and layouts

| Group | URLs | Shell | Rendering |
|---|---|---|---|
| `(public)` | `/`, `/[slugCode]` (the `/<slug>-<code>` listing page), `/landlords/[id]`, `/pricing` | Mobile first, with SEO | Server as guest + overlay |
| `(public)` | `/favorites`, `/account` | Same shell | Browser only, behind the gate |
| `(auth)` | `/login`, `/register`, `/forgot-password`, `/reset-password` | Minimal | Browser only. `/reset-password` is fixed by the backend email link |
| `(landlord)` | `/landlord/*` | Desktop first | Browser only, behind the gate |
| `(admin)` | `/admin/*` | Desktop first | Browser only, behind the gate |

Static routes win over the root `[slugCode]` segment. Reserved top level names: `login`, `register`, `forgot-password`, `reset-password`, `pricing`, `favorites`, `account`, `landlord`, `landlords`, `admin`.

### 4. Folder layout

```
src/
  app/            routes, layouts, and the providers mount only
  features/<name>/   components/  api/  hooks/  schemas/   (for example listings, favorites)
  components/     shared UI pieces (item #4)
  lib/
    api/          server.ts, client.ts, errors.ts, types.ts   (item #3 fills client and errors; types.ts is copied by hand from contract Appendix B)
    env.ts        public values, written as literal process.env.NEXT_PUBLIC_*, validated with Zod
    env.server.ts server only (imports server-only): API_URL with its fallback
    format.ts     vi-VN money and area, dates in Asia/Ho_Chi_Minh
```

`QueryClientProvider` is mounted once, inside a client `Providers` component used by the root layout.

### 5. Configuration required

| Variable | Used by | Dev value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Browser, and the server when `API_URL` is unset | `http://localhost:3000/api/v1` |
| `API_URL` | Server only | Same as above unless the server reaches the API at another address |
| `NEXT_PUBLIC_SITE_URL` | `metadataBase`, canonical and share URLs | `http://localhost:5173` |

- Scripts use the port: `next dev -p 5173` and `next start -p 5173`. The backend `.env.example` already has `ALLOWED_ORIGINS=http://localhost:5173` and `APP_BASE_URL=http://localhost:5173`, so the backend needs no change.
- `localhost` on both sides, never `127.0.0.1` (the refresh cookie is tied to the host).
- Commit `.env.example`. Keep `.env.local` out of git.
- `NEXT_PUBLIC_*` values are only inlined into browser code when written as the literal `process.env.NEXT_PUBLIC_X`, and `API_URL` must never be imported by a browser module. That is why there are two env modules (section 4). `NEXT_PUBLIC_API_URL` is fixed at build time, so moving to a proxy later needs a rebuild.
- `next build` fetches the cached catalogs, so the API must be running and seeded at `API_URL` during the build. Say so in `.env.example`. A failed catalog fetch must fail the build and never return an empty catalog, because an empty result would stay cached for hours.
- Proof that CORS and cookies work (the scope's done condition): from the `http://localhost:5173` origin, the browser sends `POST /auth/refresh` with `credentials: 'include'` and expects `401 REFRESH_TOKEN_MISSING`. A CORS error or `403 ORIGIN_NOT_ALLOWED` means the setup is wrong.
- `next.config.ts` keeps every existing key (`cacheComponents`, `partialPrefetching`, and the `turbopack.rules` entry for Tailwind), and adds: `images.remotePatterns` built from the API address; `images.dangerouslyAllowLocalIP: true` only when the API host is `localhost` or a private address, decided from the API address and never from `NODE_ENV` (running `next start` on your own computer is also production mode); the headers `Referrer-Policy: strict-origin-when-cross-origin` and `X-Content-Type-Options: nosniff`.

### 6. Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| Server read | API address | `API_URL`, else `NEXT_PUBLIC_API_URL`, read through `src/lib/env.server.ts` |
| Browser read | API address | `NEXT_PUBLIC_API_URL`, read through `src/lib/env.ts` |
| Browser call passes CORS | Allowed origin | The browser origin `http://localhost:5173` must be in backend `ALLOWED_ORIGINS` |
| Listing photo | Full image address | `coverImageUrl` or `images[].url` (paths that already start with `/api/v1`). When `NEXT_PUBLIC_API_URL` is absolute, prefix the origin (scheme, host, port) of that address and allow it in `images.remotePatterns`. In proxy mode (relative `NEXT_PUBLIC_API_URL`) keep the path as is and allow `/api/v1/media/public/**` in `images.localPatterns` |
| Page metadata | Canonical and share URL | `NEXT_PUBLIC_SITE_URL` |
| Money, area, dates on screen | Format and time zone | Fixed `vi-VN` and `Asia/Ho_Chi_Minh` for timestamps (the backend sends UTC ISO strings). Date only values such as `availableFrom` (`YYYY-MM-DD`) are formatted as written, with no time zone conversion, so the day never shifts |
| Response types | Type definitions | `api-for-frontend.md` Appendix B, copied by hand into `src/lib/api/types.ts`. The backend has no OpenAPI file, so there is no code generation |
| Form rules | Client side checks | `api-for-frontend.md` Appendix C, written as Zod schemas in each feature's `schemas/`. The backend stays the real validator |
| Browser error details | `requestId` and wait time after a 429 | `requestId` from the error body. The wait time comes from the `Retry-After` header when readable, else from the "blocked for" column of the rate limit table in contract section 3 (the 429 message has no seconds) |
| Personal overlay | Who is logged in | The in memory access token, restored by `POST /auth/refresh` then `GET /auth/me` (item #3) |
| Role based redirect | Account type and permissions | `GET /auth/me` fields `accountType` and `permissions` |

### 7. Security model

- The access token lives only in memory. Never in `localStorage`, `sessionStorage`, a cookie the app writes, or a URL. A non secret "has session" flag is allowed (a `has_session=1` cookie as the backend suggests, or `localStorage`; item #3 chooses), because it is only a hint and never proof of login.
- Server code never receives or forwards a token. Server Actions exist only to clear caches and carry no data or privilege. The worst misuse is extra API calls.
- Listing text (titles, descriptions) renders as text. No `dangerouslySetInnerHTML`.
- The reset link token is read from `?token=` and removed from the address bar at once. The `Referrer-Policy` header backs this up.
- Hiding a button by permission is a convenience. The backend decides.
- No Content Security Policy in this version. A nonce based policy forces dynamic rendering and fights the static shell. Revisit before a public launch.
- Compliance: no regulated data. Payments are test only.

### 8. Edge cases and limits

- **API down, slow, or rate limited on the server:** `src/lib/api/server.ts` throws a typed `ApiError` carrying `status`, `code`, `requestId`, and `retryAfter` (from `Retry-After`). The page catches it and renders an inline error block that gets those values as props: `requestId` for 500 and 503, "try again in N seconds" for 429. No automatic retry. This must not depend on `error.tsx`, because in production Next.js hands errors from Server Components to `error.tsx` as a generic message plus a `digest` only.
- **Unexpected errors:** each route group has an `error.tsx` as the generic fallback. It shows the `digest` and a retry button.
- **Not found:** `LISTING_NOT_FOUND`, `LANDLORD_NOT_FOUND`, and `INVALID_ID` (for example `/landlords/abc`) call `notFound()`. The root layout and each route group have a `not-found.tsx`. Inside a streamed section the HTTP status stays 200 and Next.js adds `noindex`. Accepted for the demo.
- **Junk paths:** the root `[slugCode]` page would send every unknown path (bot probes, typos) to the API. Before any request, `server.ts` checks the listing code locally with `/(?:^|-)([a-hjkmnp-z2-9]{8})$/` (lowercase letters without `i`, `l`, `o`, plus digits 2 to 9, per `api-for-frontend.md` 6.20). If it fails, call `notFound()` with no request, so junk does not spend the shared 300 per minute.
- **Stale or wrong slug:** the canonical URL in `generateMetadata` is `NEXT_PUBLIC_SITE_URL/<slug>-<code>`, using the `slug` the API returns. The address bar is corrected in the browser, with no server redirect because the read is already streaming. Item #9 picks the mechanism.
- **Shared server IP:** every server read comes from one IP, so `GET /listings` is capped at 300 per minute for all visitors together. Fine for a demo. If it bites, add a short `use cache` rather than ask for a higher limit.
- **Guest view counts:** the backend counts views by IP, so all server reads count as one viewer per listing per 30 minutes. The guest view count rule in section 1 fixes this on the detail page with one extra browser request.
- **Browser errors and headers:** the backend does not yet expose `Retry-After` and `X-Request-Id` to scripts on another origin (no `Access-Control-Expose-Headers`). Browser code takes `requestId` from the error body and the wait time from the rate limit table, as in section 6. Once the backend adds `exposedHeaders: ['Retry-After', 'X-Request-Id']` to `app.enableCors` in `src/app.factory.ts`, read the header first. In proxy mode the headers are readable already. The server path is not affected, because Node reads every header.
- **Phone testing on the home network:** `localhost` does not work from a phone. Use the PC's network address for both the frontend and the API, add that origin to backend `ALLOWED_ORIGINS`, and add the host to `allowedDevOrigins` in `next.config.ts`.
- **Photo returns 404** (listing just hidden): hide the photo block, do not show an error. This needs a small client wrapper around `next/image` that reacts to the load error. The optimizer keeps its own copy for up to about a day and cannot be cleared, so public pages may still show a photo of a just hidden listing. The wrapper matters most on landlord screens, where owners cannot see photos of their own hidden listings (`api-for-frontend.md` 6.28).
- **If hosting changes:** frontend and API on the same site (for example `app.example.com` and `api.example.com`): serve both over HTTPS and set `COOKIE_SECURE=true` on the backend. On two unrelated sites, `SameSite=Strict` stops the refresh cookie, so proxy the API through Next.js `rewrites`, set `NEXT_PUBLIC_API_URL` to `/api/v1` and `API_URL` to the absolute address, and set `TRUST_PROXY_HOPS=1` on the backend so rate limits still count real visitors.

### 9. Handed to other items

- **#2**: lint, format, and test tools, and the `AGENTS.md` rules.
- **#3**: the fetch wrapper, session restore with the three states, the proactive refresh before the four optional login reads, the single shared refresh, 429 handling with the header caveat, and the guest hint flag.
- **#4**: UI kit, tokens, fonts, and the three shells.
- **#8 and #9**: search URL state, page metadata, JSON-LD, sitemap, robots, and share cards.
- **#26 and #29**: charts and the map library.

## Consequences

**Positive**:
- SEO works with no server side auth code. Public pages are real HTML for crawlers.
- No backend change is needed to run. Ports and origins already match. One optional backend line (`exposedHeaders`, see Follow-up) makes error handling cleaner.
- Only the browser holds a token, so a bug in server code cannot leak one.
- `NEXT_PUBLIC_API_URL` is a single seam, so a proxy can be added later at low cost.

**Negative / tradeoffs**:
- Logged in users see phone numbers and hearts appear a moment after the page loads, and the list is fetched twice for them.
- Landlord and admin screens show a skeleton while the session restores.
- Uncached reads hit the API on every visit, and the shared 300 per minute limit caps a busy public demo.
- Each guest detail view costs one extra request, to count the view.
- A clean `next build` needs the API running and seeded, because cached catalogs are fetched at build time.
- Under Cache Components, an uncached fetch outside `<Suspense>` fails the build. Everyone must learn to push `await` down the tree.
- Needs a Node.js host. No static export.

**Neutral**:
- The docs in `node_modules/next/dist/docs` are the source of truth for Next.js 16.4. Community skills may describe older patterns, so the docs win when they disagree.
- Library versions above are the current majors on 2026-10-23. `package.json` pins them at install.

## Follow-up

- [ ] Root `AGENTS.md` `## Rules` does not yet hold conventions for TanStack Query, React Hook Form, Zod, or `next-dev-loop`. They apply to every file and belong at root level.
- [ ] `AGENTS.md` needs an `## Agent skills` bullet for each installed skill and an `MCP servers:` line (`/audit` and `/sync` own that file).
- [ ] Connect `next-devtools-mcp` yourself: `npx add-mcp next-devtools-mcp@latest`, or add it to `.mcp.json` at the project root. It reads errors, routes, and logs from the running dev server.
- [ ] On Windows, `npx skills add vercel/next.js` fails with "Filename too long" unless git long paths are on. The install here used a one process setting. For later runs: `git config --global core.longpaths true`.
- [ ] Backend, one line (recommended): add `exposedHeaders: ['Retry-After', 'X-Request-Id']` to `app.enableCors` in `src/app.factory.ts`, so the browser can read both headers across origins. The backend doc says it will update sections 2 and 3 when this is done.
- [ ] Item #3: decide how guests avoid a useless `POST /auth/refresh` on every page load (refresh allows 60 per minute per IP). A non secret "has session" flag, set at login and cleared at logout or on a refresh 401, is the simple route. The backend suggests a `has_session=1` cookie on the frontend domain (contract section 4.1, step 5). The refresh cookie stays the real proof.
- [ ] Items #8 and #9: Next.js streams metadata to crawlers that are not on its default bot list (Google render bots, Bingbot, Twitterbot, Slackbot). Check that Zalo and Facebook link preview crawlers get tags in `<head>`. `htmlLimitedBots` in `next.config.ts` fixes it, but setting it replaces the default list, so include the defaults you want to keep.
- [ ] Item #4: the scaffold loads only the `latin` subset of Geist. Pick a font that covers Vietnamese. Also change the scaffold's `lang="en"` and English title to Vietnamese.
- [ ] Hosting: choose before any online demo. The rules are in section 8, "If hosting changes".
- [ ] Revisit a Content Security Policy before a public launch.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
