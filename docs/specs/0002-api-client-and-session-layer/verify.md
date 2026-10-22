# Verify: API client & session layer · spec 0002 · updated 2026-10-23

_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. M1 steps are below; each later milestone appends its own._

## UI / manual

- [ ] Backend running, `npm run dev`, open `/dev/session`, press "Call GET /plans" → the page shows `total: 3` (seeded plans) → AC-1
- [ ] Stop the backend, press "Call GET /plans" again → the alert shows `NETWORK_ERROR (status 0)` with "Không kết nối được tới máy chủ..." → AC-10
- [ ] Network tab on the "Call GET /plans" request → the URL is `NEXT_PUBLIC_API_URL` plus `/plans`, with no `Authorization` header and no cookies sent (value sourcing: Full URL, Credentials) → AC-1, AC-2

## Commands

- [ ] `NEXT_PUBLIC_API_URL=http://localhost:3999/api/v1 npm run build`, then `grep -rho "http://localhost:3999/api/v1" .next/static` → found, and `grep -rho "http://localhost:3000/api/v1" .next/static` → nothing; rebuild without the override afterwards → AC-2
- [ ] `npm run build && npm run start`, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/dev/session` → `404` → AC-14
- [ ] `npm run check` → exit 0 → AC-14
- [ ] Add a temporary Server Component that imports `@/lib/api/client`, run `npm run build` → fails with "You're importing a component that imports client-only"; delete the file → AC-13 (the `auth-provider.tsx` half arrives with M2)

## Acceptance-criteria coverage

- AC-1 … covered by the first manual step and the Network tab step (modes `none`, `required` as guest, `optional` as guest were also run through a scratch script against the real backend; the lab buttons for `required` and `optional` arrive with M2 and M3) · AC-2 … covered by the first command and the Network tab step · AC-10 … covered by the second manual step (the other error shapes were run through the scratch script, `/test` can lock them with a fake `fetch`)
- AC-13 … covered by the fourth command (first half) · AC-14 … covered by the second and third commands
- Not yet testable (later milestones): AC-3 and AC-12 (M2), AC-4 to AC-7 (M3), AC-8, AC-9 countdown, and the query retry rule of AC-10 (M4), AC-11 and the rest of AC-12 (M5)
