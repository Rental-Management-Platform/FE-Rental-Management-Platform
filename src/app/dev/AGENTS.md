# src/app/dev

Pages for developers only. Everything under `/dev` answers 404 in a production build: `layout.tsx` here calls `notFound()` when `NODE_ENV` is `production`. Check it with `npm run build` then `npm run start`.

## What is here

- `ui/`: `/dev/ui`, the living design system page. It shows every component state, the type scale, the colors with their contrast tables, the shared states, a demo form fed with fake `ApiError` objects, and links to the shell previews in `ui/shells/`.
- `ui/screens/`: an index and seven sample screens (listing list, listing detail, pricing, sign in, my listings, post listing, admin users). They follow [spec 0003](../../../docs/specs/0003-design-system-and-ui-foundation/index.md) and [spec 0004](../../../docs/specs/0004-type-and-layout-refinement/index.md).
- `session/`: `/dev/session`, a temporary lab for the session layer ([spec 0002](../../../docs/specs/0002-api-client-and-session-layer/index.md)). Item #5 (sign up and sign in) deletes it.

## Rules

- Sample screens make no network call and show no photos (`coverImageUrl` is `null`). Rows are fixed objects in `ui/screens/sample-data.ts`, typed with `src/lib/api/types.ts`, so a wrong field fails `npm run typecheck`.
- Money, area and dates on the sample screens use `ui/screens/sample-format.ts` (`vi-VN`, `Asia/Ho_Chi_Minh`) until a feature puts the same in `src/lib/format.ts`.
- Nothing outside `/dev` imports from here. A real feature lifts the markup of a sample screen into its own folder.
- Everything here is built from the tokens and the shared components, so it also works as a check that the design system holds together.

_Drafted by /sync from the introducing change, worth a quick human pass._
