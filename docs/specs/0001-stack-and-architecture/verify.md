# Verify: Stack & architecture · spec 0001 · updated 2026-10-23
_Steps derived from the scope "Done when" for foundation #1 and from the spec's Value sourcing table. Spec 0001 has no numbered acceptance criteria, so each step is tagged with the condition it covers (D1 to D4). `/check verify` runs these; `/test` locks the durable ones._

Conditions from the scope:
- D1: the decision is recorded in the spec.
- D2: `next dev` runs on the port that matches the backend `ALLOWED_ORIGINS`.
- D3: the browser can call the API without a CORS block.
- D4: the build is clean.

The backend must be running at `http://localhost:3000/api/v1` for every step below.

## UI / manual
- [ ] Open `http://localhost:5173`, run `fetch("http://localhost:3000/api/v1/auth/refresh", { method: "POST", credentials: "include" })` in the console → status 401, body code `REFRESH_TOKEN_MISSING`, no CORS error      → D3
- [ ] In the console, `fetch("http://localhost:3000/api/v1/plans?pageSize=50")` → status 200 with `items`, `total`, `page`, `pageSize`      → D3
- [ ] In the console, `fetch("http://localhost:3000/api/v1/listings?pageSize=1", { headers: { Authorization: "Bearer x" } })` → status 200 (the preflight for the `Authorization` header passes)      → D3
- [ ] Open the site as `http://127.0.0.1:5173` and repeat the refresh call → blocked, `403 ORIGIN_NOT_ALLOWED` (only `localhost` is allowed on both sides)      → D3
- [ ] Open the Network tab on `/` (or run `curl -I http://localhost:5173/`) → the response headers include `Referrer-Policy: strict-origin-when-cross-origin` and `X-Content-Type-Options: nosniff`      → Value sourcing: security headers

## Commands
- [ ] `npm run dev` → banner shows `Local: http://localhost:5173` and `Ready`      → D2
- [ ] `npm run lint` → exits 0 with no warnings      → D4
- [ ] `npm run build` (API running) → exits 0, routes `/` and `/_not-found` listed, "Cache Components enabled" and "Partial Prefetching enabled" in the banner      → D4
- [ ] `curl -i -X OPTIONS http://localhost:3000/api/v1/auth/refresh -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST"` → `204`, `Access-Control-Allow-Origin: http://localhost:5173`, `Access-Control-Allow-Credentials: true`      → D3
- [ ] With the dev server up, `curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/_next/image?url=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fv1%2Fmedia%2Fpublic%2Fx.jpg&w=640&q=75"` → `404` ("upstream response is invalid", so the pattern and the local address were accepted)      → Value sourcing: listing photo
- [ ] Same request with `url=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fv1%2Fplans` → `400` ("url parameter is not allowed")      → Value sourcing: listing photo
- [ ] Set `API_URL=http://localhost:3999/api/v1` in `.env.local`, restart `npm run dev`, load a server rendered page that reads the API (once one exists) → the server calls port 3999 while the browser still calls 3000. Remove the line afterwards      → Value sourcing: server read
- [ ] Change `NEXT_PUBLIC_API_URL`, run `npm run build`, grep `.next/static` for the new address → the browser bundle carries the new value, not the old one      → Value sourcing: browser read
- [ ] Change `NEXT_PUBLIC_SITE_URL`, reload `/` → `<link rel="canonical">` or `og:url` and `metadataBase` use the new origin      → Value sourcing: page metadata
- [ ] Remove `NEXT_PUBLIC_API_URL` from `.env.local`, run `npm run dev` → startup fails with "NEXT_PUBLIC_API_URL is not set" instead of running with a broken address      → D4

## Not checkable yet
- Money, area, and date formatting (`vi-VN`, `Asia/Ho_Chi_Minh`): `src/lib/format.ts` does not exist. Check it in the first feature that shows a price or date.
- Response types and form rules: `src/lib/api/types.ts` and the Zod schemas come with items #3 and #5. Check them there.
- A clean build that fetches the cached catalogs (wards, amenities, plans): no page reads them yet. Check it in the first feature that adds a `use cache` read, with the backend stopped, to confirm the build fails instead of caching an empty list.

## Acceptance-criteria coverage
- D1 (decision recorded) … covered by the existence of `index.md` and `rationale.md` in this folder; `/check verify` confirms the Status line reads `In Progress` or `Accepted`.
- D2 (port) … covered by the `npm run dev` step.
- D3 (CORS) … covered by the first four UI steps and the `OPTIONS` curl step.
- D4 (clean build) … covered by the `lint` and `build` steps and the missing env variable step.
