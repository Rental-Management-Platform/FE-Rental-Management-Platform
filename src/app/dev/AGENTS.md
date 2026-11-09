# src/app/dev

Pages for developers only. Everything under `/dev` answers 404 in a production build: `layout.tsx` here calls `notFound()` when `NODE_ENV` is `production`. Check it with `npm run build` then `npm run start`.

## What is here

- `ui/`: `/dev/ui`, the living design system page. It shows every component state, the type scale, the colors with their contrast tables, the shared states, a demo form fed with fake `ApiError` objects, and links to the shell previews in `ui/shells/`.
- `ui/screens/`: an index and seven sample screens (listing list, listing detail, pricing, sign in, my listings, post listing, admin users). They follow [spec 0003](../../../docs/specs/0003-design-system-and-ui-foundation/index.md) and [spec 0004](../../../docs/specs/0004-type-and-layout-refinement/index.md).

## Rules

- Sample screens make no network call and show no photos (`coverImageUrl` is `null`). Rows are fixed objects in `ui/screens/sample-data.ts`, typed with `src/lib/api/types.ts`, so a wrong field fails `npm run typecheck`.
- Money, area and dates on the sample screens use `ui/screens/sample-format.ts` (`vi-VN`, `Asia/Ho_Chi_Minh`). Real features use `src/lib/format.ts`.
- Nothing outside `/dev` imports from here. A real feature lifts the markup of a sample screen into its own folder.
- A feature that ships a page also adds a section to `ui/` that shows its states, as `listing-cards.tsx`, `listing-detail.tsx`, `dashboard-cards.tsx` and `photos.tsx` do ([spec 0008](../../../docs/specs/0008-landlord-and-admin-dashboards/index.md)).
- A section that needs fake API data keeps it in a `<name>-sample.ts` beside it (`chat-sample.ts`, `reviews-sample.ts`): fixed objects typed with the API types, no network call, no randomness, and a fixed clock where a time shows, so the page reads the same on every load.
- Everything here is built from the tokens and the shared components, so it also works as a check that the design system holds together.

_Drafted by /sync from the introducing change, worth a quick human pass._
