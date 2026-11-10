# 0008. Landlord and admin dashboards in the web frontend

**Date**: 2026-11-02
**Status**: Accepted

## Summary

This feature gives each work area a real home page: `/landlord` for landlords and `/admin` for admins. Each page lists every management tool of the area as a card, including the tools that are not built yet. A card for a built tool opens its page, a card for an unbuilt tool is dimmed, says "Sắp có" in words, and cannot be opened. Cards can carry a small number read from an API that already exists (property count, listings showing, users, test revenue). One list of tools drives both the cards and the side menu, so a finished feature turns its card and its menu item on with one edit. After sign in, a landlord lands on `/landlord` and an admin on `/admin`. It adds no package, table, endpoint or environment variable.

## Requirements

Seeded from scope item #31 and refined with the engineer. Contract with the backend: `api-for-frontend.md` sections 2 (pagination), 5, 6.25, 6.29, 6.34, 6.38 and 7 ("Hiển thị theo quyền"). Patterns to follow: spec 0003 (shells, nav configs), spec 0004 (zones and item cards), spec 0005 (the gate and the sign in redirect), spec 0006 (`src/features/<name>` layout, `queryOptions` factories).

**User stories**:
- As a landlord, I want a home page that lists every tool of my area, so that I click into a tool instead of typing its address.
- As a landlord with no property yet, I want to be pointed to the first step, so that I do not guess where to start.
- As a landlord, I want to see how many listings are showing, how many I can still post, and which plan I am on, without opening another page.
- As an admin, I want to see the number of accounts, hidden listings and test revenue at a glance.
- As the person demoing the product, I want to see the whole planned picture, and to see a card turn on when its feature ships.
- As someone using a screen reader or a keyboard, I want to hear which tools are not available yet, and not tab through dead cards.
- As a landlord on a phone, I want the same page to work at a narrow width.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: Pages and gate. `src/app/(landlord)/landlord/page.tsx` serves `/landlord` and `src/app/(admin)/admin/page.tsx` serves `/admin`, inside the existing layouts, so the route gate and the workspace shell apply unchanged (spec 0005). Each page has a `PageHeader` whose `h1` is "Tổng quan" and a one line description, a tab title ("Tổng quan khu chủ trọ", "Tổng quan quản trị"), `robots` set to no index and no follow, and `export const instant = false` (the same pattern as the other pages behind the gate). A guest is sent to sign in and a person of the other account type sees the forbidden state, as today.
- **AC-2**: The tool list and the groups. Both pages are drawn from the tool lists in `src/components/shells/workspace-tools.ts` (`LANDLORD_TOOLS`, `ADMIN_TOOLS`). Each group is a `section` with an `h2` that sits on the canvas (the same style as the results heading row in spec 0004), then a list of cards. Group order and card order are the array order. The groups and tools are those in the two tables of the Feature design section, and each card shows its icon, its label (an `h3`) and one line of description, all in Vietnamese. A card is an item card that sits directly on the canvas, never inside a zone (spec 0004).
- **AC-3**: A ready card opens its page. A tool with `status: "ready"` draws as a link: the whole card is clickable (the label is the link text and a stretched link covers the card), the label is the accessible name, keyboard focus draws the focus ring around the whole card (`FOCUS_RING`), and hover may raise the shadow (spec 0004). Today two cards are ready, "Thêm nhà trọ" (`/landlord/properties/new`) and "Đăng tin" (`/landlord/listings/new`). No admin card is ready yet. A person reaches each tool by clicking, with no typed address.
- **AC-4**: A soon card is plain text. A tool with `status: "soon"` is not a link and not a tab stop. It has a dashed border, muted text, a visible badge "Sắp có" and hidden text "(chưa dùng được)" right after the label, so a screen reader reads the label, the description and the state together. The state is never carried by colour or opacity alone, and the badge and text pass the AA contrast pairs. A soon card has no `href` and no `aria-disabled`.
- **AC-5**: One edit turns a tool on. The `Tool` type is a union: a `ready` tool must have an `href` and a `soon` tool cannot have one (a mix does not compile). The side menu is built from the same list. Changing one entry from `soon` to `ready` with its `href` turns on the card and adds the menu item at the same place in the same order, with no second file to edit. `LANDLORD_NAV` and `ADMIN_NAV` in `nav-config.ts` are `[overview item, ...navItemsOf(tools)]`, where `navItemsOf` is a pure function that keeps only ready tools.
- **AC-6**: Permissions. A tool that has a `permission` is drawn only when `can(state, permission)` is true. A missing permission hides the card, even when the tool is soon (hidden wins over dimmed). A group with no visible tool has no heading. When no tool at all is visible, the page shows an empty state: "Tài khoản của bạn chưa có quyền dùng công cụ nào. Hãy liên hệ quản trị viên." The same rule filters the menu items (the existing `visibleNavItems`). Hiding is a convenience: the backend decides.
- **AC-7**: Numbers, in general. A tool with a `stat` shows its number lines under the description, as the Value sourcing table says, also when the card is dimmed. Each number source is one request made in the browser through `useApi` and TanStack Query, with the query key `["dashboard", name]`. A number is requested only when the person holds the permission its API needs (the Value sourcing table), and two cards that need the same source share one request. A card with two sources (`myListings` and `users`) shows the lines of the sources the person may read and has no slot when it may read none. A list call uses `pageSize=1` and the query function returns only the number it needs, so the cache never holds another person's email or phone. Nothing is computed in the browser beyond joining text and formatting: counts and money use `vi-VN` (`formatMoney` in `src/lib/format.ts`). While loading, the slot is a `Skeleton` with hidden text "Đang tải số liệu". A visit fetches again (the default stale time), and a window focus does too.
- **AC-8**: Landlord numbers. The text rules are in the Value sourcing table: `propertyCount` on "Thêm nhà trọ" and "Nhà trọ của tôi", `quota` on "Đăng tin", `myListings` on "Tin của tôi" (membership plus the count of listings hidden by admin, with the admin line shown only when above 0), and `plan` on "Gói và đơn của tôi". The membership request is made once for all three cards that use it.
- **AC-9**: Admin numbers. `hiddenListings` on "Kiểm duyệt tin", `users` on "Người dùng" (total and locked, two requests), and `paidOrders` and `revenue` on the two money cards (one request to `GET /orders/revenue` with no dates). Every money figure carries the words "thanh toán thử". The revenue figure covers every paid order, with no date range.
- **AC-10**: A number that fails. The failure stays inside that slot: the card still opens if it is ready, and every other card keeps working. A network error, a 5xx or a 429 shows "Không tải được số liệu" and a "Thử lại" button that fetches the failed sources again (a 5xx adds the support code, as `describeError` does for a 5xx only). For a 429 the button is disabled until the wait from the answer ends, using the countdown the way `RateLimitNotice` does. When a card has two sources and one fails, the slot shows the error and no lines. A 403 `PERMISSION_DENIED` hides the slot and does not retry. A 401 or a 403 `ACCOUNT_LOCKED` is handled by the session layer, as everywhere else. The button is above the stretched link, so it is not a button inside a link.
- **AC-11**: First steps. When the property count is 0 and "Thêm nhà trọ" is ready and visible, that card shows a badge "Bắt đầu từ đây" and a primary tinted look made from existing tokens. It needs no extra request. A dimmed card never highlights, and a failed count shows no highlight.
- **AC-12**: The menu. "Tổng quan" is the first item of `LANDLORD_NAV` (to `/landlord`) and of `ADMIN_NAV` (to `/admin`), with the `LayoutDashboard` icon and no permission. It is the current item only on that exact address, never on a page below it (the edit listing page and the `dev-check` pages must not mark it). `currentHrefOf(pathname, hrefs, exactHrefs = [])` gets an optional third argument, and its two other callers (the public bar and the public sheet) are unchanged. The longest match still wins for every other item, and the sheet below `lg` still closes on choosing an item.
- **AC-13**: After sign in. `afterAuthPath(next, user)` returns `next` when `safeNextPath` accepts it, else `homePathOf(user.accountType)`: `/landlord` for a landlord, `/admin` for an admin, `/` for a renter (`tenant`). `homePathOf` is a pure function in `src/lib/next-path.ts`. Sign in, sign up, and a signed in person who opens `/login` all go through `useAuthRedirect`, so all three behave the same. The `next` safety rules of spec 0005 do not change. This amends spec 0005 AC-7.
- **AC-14**: Way back from public pages. `ACCOUNT_LINKS.landlord` gets "Khu chủ trọ" (`/landlord`) and `ACCOUNT_LINKS.admin` gets "Quản trị" (`/admin`), shown in the account menu bar and in the sheet list. `ACCOUNT_LINKS.tenant` stays empty.
- **AC-15**: Layout and accessibility (WCAG AA). Desktop first and fine at 320 px with no sideways scroll: one card column below `sm`, two from `sm`, three from `xl`, cards in one row have equal height. The heading order is `h1`, group `h2`, card `h3`. Each group is a list. Icons are hidden from the screen reader (`aria-hidden`). Controls follow the control heights of `AGENTS.md`, and focus rings come from `FOCUS_RING`. Only semantic tokens are used, and any new text or control colour pair is added to `PAIRS` in `scripts/check-contrast.mjs` in the same change.
- **AC-16**: Reference and clean build. `/dev/ui` shows the card in each state on fake data with no network call: ready, ready with the first steps badge, soon, with a number, loading, error, error with a 429 wait. `npm run check` and `npm run build` pass, with no hydration warning and no console error on both pages, no `any`, and no link to a page that does not exist.

## Decision

**Chosen option**: Option 1: One shared tool list that feeds the dashboard cards and the side menu, with numbers read per card in the browser

Add `workspace-tools.ts` as the single list of tools per area, draw each dashboard from it, build the menu from its ready entries, and read each card's number with its own small query so one failure never spreads.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`). Read the page on `instant` and the page on `Link` prefetching (the app uses `partialPrefetching`) before writing the pages. No new skill or MCP server was searched for, because no new tool is chosen.

## Feature design

**Data model sketch**: no table, no stored data, nothing in the browser storage. The only model is the tool list, which lives in code:

```ts
// src/components/shells/workspace-tools.ts (shared code, so a shell never imports a feature)
export type StatKey =
  | "propertyCount" | "quota" | "myListings" | "plan"            // landlord
  | "hiddenListings" | "users" | "paidOrders" | "revenue";       // admin

export type Tool = {
  id: string;            // "property.create"
  group: string;         // heading: "Nhà trọ"
  label: string;         // "Thêm nhà trọ"
  description: string;   // one line
  icon: LucideIcon;
  permission?: PermissionKey; // hidden when the person lacks it
  stat?: StatKey;        // one number slot per card
} & (
  | { status: "soon" }                 // dimmed, no address
  | { status: "ready"; href: string }  // opens
);
```

The array order is the order of groups (by first appearance) and of cards. Pure helpers in the same file: `visibleTools(tools, state)` (applies `can`), `groupTools(tools)` (keeps order), and `navItemsOf(tools)` (ready tools to `NavItem`). `NavItem` is unchanged. `StatKey` is only a name here; the number itself is read by the dashboard feature.

**Tools of the landlord area** (`LANDLORD_TOOLS`; the descriptions are drafts the engineer may reword in review, and the owning feature may rename its tool when it turns it on):

| Group | Id | Label | Status now | Address when ready | Permission | Number |
|---|---|---|---|---|---|---|
| Nhà trọ | `property.create` | Thêm nhà trọ | ready | `/landlord/properties/new` | `property:create` | `propertyCount` |
| Nhà trọ | `property.mine` | Nhà trọ của tôi | soon (#12) | set by #12 | `property:read` | `propertyCount` |
| Tin đăng | `listing.create` | Đăng tin | ready | `/landlord/listings/new` | `listing:create` | `quota` |
| Tin đăng | `listing.mine` | Tin của tôi | soon (#12) | set by #12 | `listing:read` | `myListings` |
| Gói và đơn | `billing.mine` | Gói và đơn của tôi | soon (#19) | set by #19 | `order:read` | `plan` |
| Tài khoản | `profile` | Hồ sơ và mật khẩu | soon (#28) | set by #28 | `profile:read` | none |

Scope items #10 (photos) and #17 (plan and quota strip) have no card, because neither has a page of its own: photos live on the edit listing page, reached through "Tin của tôi", and the quota strip sits at the top of that page. Their numbers are shown on "Tin của tôi" and "Gói và đơn của tôi".

**Tools of the admin area** (`ADMIN_TOOLS`; every tool is soon today, because #20 to #26 and #28 are planned):

| Group | Id | Label | Status now | Permission | Number |
|---|---|---|---|---|---|
| Cần xem thường xuyên | `moderation` | Kiểm duyệt tin | soon (#21) | `listing:moderate` | `hiddenListings` |
| Cần xem thường xuyên | `users` | Người dùng | soon (#20) | `user:read` | `users` |
| Tiền (thanh toán thử) | `orders.all` | Đơn của mọi chủ trọ | soon (#25) | `order:report` | `paidOrders` |
| Tiền (thanh toán thử) | `revenue` | Doanh thu | soon (#26) | `order:report` | `revenue` |
| Cài đặt hệ thống | `plans` | Gói và dùng thử | soon (#22) | `plan:read` | none |
| Cài đặt hệ thống | `catalog` | Danh mục | soon (#23) | `catalog:read` | none |
| Cài đặt hệ thống | `permissions` | Phân quyền | soon (#24) | `account_type:read` | none |
| Tài khoản của tôi | `profile` | Hồ sơ | soon (#28) | `profile:read` | none |

An admin holds every permission, so today no admin card hides. The field keeps the rule the same for both areas and survives a change in the contract.

**Card copy** (draft descriptions, one line each): Thêm nhà trọ "Nhập tên, địa chỉ và phường hoặc xã của nhà trọ." · Nhà trọ của tôi "Xem, sửa và xóa các nhà trọ bạn đã tạo." · Đăng tin "Đăng tin kèm 1 đến 5 ảnh. Tin hiện ngay, không cần duyệt." · Tin của tôi "Ẩn, hiện, sửa tin và quản lý ảnh của từng tin." · Gói và đơn của tôi "Xem gói đang dùng, mua gói và xem lịch sử đơn. Thanh toán là thanh toán thử." · Hồ sơ và mật khẩu "Sửa tên, số điện thoại và đổi mật khẩu." · Kiểm duyệt tin "Tìm tin của mọi chủ trọ, ẩn hoặc gỡ ẩn kèm lý do." · Người dùng "Tìm tài khoản, khóa, mở khóa và thu hồi phiên đăng nhập." · Đơn của mọi chủ trọ "Xem đơn mua gói, lọc theo trạng thái, chủ trọ, gói và ngày." · Doanh thu "Doanh thu theo gói và theo thời gian." · Gói và dùng thử "Tạo, sửa, tắt gói và đổi số ngày, số tin dùng thử." · Danh mục "Quản lý phường, xã, đặc khu và tiện ích." · Phân quyền "Chọn hành động mỗi loại tài khoản được làm." · Hồ sơ "Sửa tên, số điện thoại và đổi mật khẩu."

Page copy: landlord description "Mọi công cụ quản lý nhà trọ và tin đăng của bạn ở một chỗ."; admin description "Mọi công cụ quản trị của hệ thống ở một chỗ. Số tiền là của thanh toán thử."

**State transitions**:
- Tool: `soon` to `ready`, done by hand by the feature that ships the page (one edit). It never goes back.
- Number slot of one card: `loading` to `ready` (shows lines) or `error`; `error` to `loading` on "Thử lại"; a 403 `PERMISSION_DENIED` goes to `hidden` and stays there. A new visit or a window focus starts `loading` again, and the old lines stay on screen until the new answer arrives.

**API surface** (all calls are reads, made in the browser with the access token in memory, through `useApi`):

| Endpoint | Method | Key inputs | Key outputs used | Auth | Key errors |
|---|---|---|---|---|---|
| `/properties` | GET | `page=1`, `pageSize=1` | `total` | bearer, `property:read` | 403 `PERMISSION_DENIED`, 429 |
| `/me/membership` | GET | none | `state`, `listingLimit`, `visibleCount`, `remaining`, `overLimitCount`, `trialDaysLeft`, `subscription.planName`, `subscription.daysLeft` | bearer, `subscription:read` | 403 `PERMISSION_DENIED`, 429 |
| `/me/listings` | GET | `status=hidden_by_admin`, `page=1`, `pageSize=1` | `total` | bearer, `listing:read` | 403 `PERMISSION_DENIED`, 429 |
| `/users` | GET | `page=1`, `pageSize=1`; second call adds `status=locked` | `total` | bearer, `user:read` | 403 `PERMISSION_DENIED`, 403 `ACCOUNT_LOCKED`, 401, 429 |
| `/moderation/listings` | GET | `status=hidden_by_admin`, `page=1`, `pageSize=1` | `total` | bearer, `listing:moderate` | as above |
| `/orders/revenue` | GET | none (every paid order; no `page`, `pageSize` or `status`, which the API rejects) | `paidCount`, `paidAmount` | bearer, `order:report` | as above |

No new type is needed except small helpers: `Page<T>` and `Membership` already exist in `src/lib/api/types.ts`; the revenue answer needs a minimal `Revenue` type (`paidCount`, `paidAmount`) added there.

**Value sourcing** (every number a card shows names its source and its text rule; the wording of the lines is a draft, the rules are the contract):

| Card (number) | Value displayed | Source | Text rule |
|---|---|---|---|
| Thêm nhà trọ, Nhà trọ của tôi (`propertyCount`) | N properties | `GET /properties` `total` | N above 0: "Đã có N nhà trọ". N is 0: "Chưa có nhà trọ nào" |
| Đăng tin (`quota`) | listings left | `GET /me/membership` | `state` is `expired`: "Hết dùng thử, cần mua gói để đăng tin". `remaining` above 0: "Còn đăng được R tin". Else: "Đã dùng hết hạn mức L tin" (R is `remaining`, L is `listingLimit`) |
| Tin của tôi (`myListings`) | listings showing, alerts | `GET /me/membership` and `GET /me/listings?status=hidden_by_admin` `total` (H) | Line 1: `state` is `expired`: "Hết dùng thử"; else "Đang hiện V trên L tin" (V is `visibleCount`). Then, only when above 0: "O tin đang bị ẩn bớt vì vượt hạn mức" (O is `overLimitCount`) and "H tin bị quản trị viên ẩn" |
| Gói và đơn của tôi (`plan`) | plan or trial state | `GET /me/membership` | `plan`: "Gói NAME, còn D ngày" (`subscription.planName`, `subscription.daysLeft`). `trial`: "Dùng thử, còn D ngày" (`trialDaysLeft`). `expired`: "Hết dùng thử, chưa có gói" |
| Kiểm duyệt tin (`hiddenListings`) | listings hidden by admin | `GET /moderation/listings?status=hidden_by_admin` `total` | above 0: "N tin đang bị ẩn". 0: "Không có tin nào đang bị ẩn" |
| Người dùng (`users`) | accounts, locked accounts | `GET /users` `total` (T) and `GET /users?status=locked` `total` (L) | "T tài khoản", then "L đang bị khóa" when L is above 0, else "Không có tài khoản bị khóa" |
| Đơn của mọi chủ trọ (`paidOrders`) | paid orders | `GET /orders/revenue` `paidCount` | "N đơn đã trả (thanh toán thử)" |
| Doanh thu (`revenue`) | paid amount | `GET /orders/revenue` `paidAmount` | "`formatMoney(paidAmount)` (thanh toán thử)" |
| The ready tools (first steps) | the highlight | `propertyCount` is 0 | the badge "Bắt đầu từ đây" on "Thêm nhà trọ" only (AC-11) |
| Every card | whether it is shown | `can(state, tool.permission)` from the session | hidden when false (AC-6) |
| Every number | whether it is requested | `can(state, permission of its API)` from the session (`property:read`, `subscription:read`, `listing:read`, `user:read`, `listing:moderate`, `order:report`) | no request and no slot when false |

**Key invariants**:
- A `ready` tool always has an `href`, and a `soon` tool never has one (enforced by the type).
- The menu is exactly "Tổng quan" plus the ready tools in list order, filtered by permission. It cannot disagree with the cards.
- A card hidden by permission is never drawn as dimmed.
- A number never blocks a link: a ready card opens whatever its number is doing.
- Every money figure on these pages is labelled "thanh toán thử".
- No number is computed from other numbers. Each is a field or a `total` the backend returned.
- The access token stays in memory; the pages are noindex.

**Security model**: the layouts already gate by account type (spec 0005): `/landlord` is for landlords and `/admin` for admins. Hiding a card or a number by permission is a convenience, and every API enforces its own permission. The cache holds only the numbers (the query functions drop the rest of a list answer), so another person's email or phone is never kept. An admin sees the user count and test revenue, which their role allows. No regulated data beyond the account data the role already reads.

**Configuration required**: none. No new environment variable, package, shadcn component or credential.

**Where the code goes** (names are binding for the shared parts, free for the rest):

| Path | What |
|---|---|
| `src/components/shells/workspace-tools.ts` | `Tool`, `StatKey`, `LANDLORD_TOOLS`, `ADMIN_TOOLS`, `visibleTools`, `groupTools`, `navItemsOf` |
| `src/components/shells/nav-config.ts` | `LANDLORD_NAV` and `ADMIN_NAV` built from the tools with "Tổng quan" first; `ACCOUNT_LINKS.landlord` and `.admin`; the comment block is updated |
| `src/components/shells/nav-current.ts`, `workspace-shell.tsx` | optional `exactHrefs`; the shell passes the exact hrefs of the visible items |
| `src/lib/next-path.ts` | `homePathOf`, and `afterAuthPath` uses it |
| `src/features/dashboard/api/stats.ts` | one `queryOptions` factory per number source, query keys `["dashboard", name]`, query functions that return only the number |
| `src/features/dashboard/schemas` or `stat-text.ts` | the pure text rules of the Value sourcing table (`describeStat`), so they can be read and tested without React |
| `src/features/dashboard/components/` | `tool-grid.tsx`, `tool-card.tsx`, `stat-slot.tsx`, `landlord-dashboard.tsx`, `admin-dashboard.tsx` (client components; the two pages stay thin server components with `PageHeader`) |
| `src/app/(landlord)/landlord/page.tsx`, `src/app/(admin)/admin/page.tsx` | the two pages |
| `src/app/dev/ui/dashboard-cards.tsx` | the card states on fake data (AC-16) |
| `src/lib/api/types.ts` | the minimal `Revenue` type |

**Critical test scenarios** (each maps to an acceptance criterion):
- Happy path: a landlord signs in and lands on `/landlord`, sees the four groups, clicks "Đăng tin" and the post page opens, verifies **AC-1**, **AC-3**, **AC-13**.
- Happy path: an admin signs in and lands on `/admin`, sees all eight cards dimmed with their numbers, none focusable, verifies **AC-4**, **AC-9**, **AC-13**.
- Turning a tool on: set `property.mine` to ready with an address, the card links and the menu gains "Nhà trọ của tôi" in the same place, verifies **AC-5**.
- Failure case: stop the API, or make `GET /me/membership` answer 500: only the cards that use it show "Không tải được số liệu", and "Đăng tin" still opens. A 429 shows the wait and disables the button until it ends, verifies **AC-10**.
- First steps: a new landlord with zero properties sees the badge on "Thêm nhà trọ"; after creating one it is gone on the next visit, verifies **AC-11**.
- Menu: on `/landlord/listings/123/edit` and `/landlord/dev-check` "Tổng quan" is not current, on `/landlord` it is, verifies **AC-12**.
- Auth/permission: a renter who opens `/landlord` sees the forbidden state. A landlord with `property:create` removed by an admin no longer sees "Thêm nhà trọ" after the permissions refresh, and a landlord with no permission for any tool sees the empty state, verifies **AC-1**, **AC-6**.
- Redirect: with `?next=/landlord/listings/new` a landlord returns to that page, with `?next=//evil.example` or none they land on `/landlord`, verifies **AC-13**.

## Build plan

Tracer Bullet (the project default, `AGENTS.md`): one thin real thread through every layer first (route, gate, tool list, card, one real number, menu, redirect) on the landlord side, then the rest of the numbers, then the admin side, then polish. Each milestone runs end to end.

1. **M1, the thin thread (landlord)**: `workspace-tools.ts` with the type, `LANDLORD_TOOLS` and the three helpers; `nav-config.ts` builds `LANDLORD_NAV` from it with "Tổng quan" first; `exactHrefs` in `nav-current.ts` and the shell. Satisfies **AC-2**, **AC-5**, **AC-12**.
2. **M1**: the `/landlord` page with `PageHeader`, groups, ready and soon cards, the permission filter and the empty state. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-6**.
3. **M1**: `homePathOf` and `afterAuthPath`; the "Khu chủ trọ" account menu link. Satisfies **AC-13**, **AC-14**.
4. **M1**: one real number end to end, the property count on "Thêm nhà trọ" (query factory, slot with skeleton and a plain error line). Satisfies **AC-7**, **AC-8** (property count).
5. **M2, every landlord number**: the membership source and the hidden by admin source; `describeStat` text rules for `quota`, `myListings` and `plan`; the error slot with "Thử lại", the 429 wait and the 403 hide; the first steps highlight. Satisfies **AC-7**, **AC-8**, **AC-10**, **AC-11**.
6. **M3, the admin side**: `ADMIN_TOOLS`, `ADMIN_NAV` with "Tổng quan", the `/admin` page, the four admin sources (users total and locked, moderation, revenue), the "Quản trị" account link, the admin branch of `homePathOf`, the `Revenue` type. Satisfies **AC-1**, **AC-2**, **AC-9**, **AC-12**, **AC-13**, **AC-14**.
7. **M4, polish and reference**: check 320, 390, 1280 and 1440 px, the heading order and the focus ring on the stretched link, the `/dev/ui` section with the card states, any new contrast pairs, short amendment notes in specs 0003 and 0005, `npm run check` and `npm run build`. Satisfies **AC-15**, **AC-16**.

## Consequences

**Positive**:
- Every tool of both areas is reached by clicking, and the whole planned picture is visible from day one.
- One list drives cards and menu, so they cannot disagree, and a later feature turns its tool on with one edit.
- The admin dashboard has real numbers before any admin page exists, and the number code runs end to end now.
- A failing number never takes the page or a link down with it.
- A landlord or an admin lands in their own area after sign in, and can get back from public pages.

**Negative / tradeoffs**:
- The tool list is hand edited. A feature that forgets to flip its tool leaves a dimmed card, which is visible and safe, but wrong.
- A landlord dashboard load makes up to 3 requests and an admin one up to 4, and each visit and window focus fetches them again. Counts can be a little stale between fetches.
- A dimmed card can show a number for something that cannot be opened yet, which may look odd on first sight.
- Labels, groups and descriptions of tools that do not exist yet are guesses. The owning feature may rename its tool when it turns it on.
- "Khu chủ trọ" in the account menu repeats "Tổng quan" when the person is already inside the workspace shell.
- Scope item #10 and #17 have no card of their own, which departs from the item list in the scope text.

**Neutral**:
- Specs 0003 (nav configs are built from the tool list, `ACCOUNT_LINKS` gets two links) and 0005 (AC-7, the destination after sign in) are amended. The build adds a short note to each.
- `src/components/AGENTS.md` should mention `workspace-tools.ts` after this ships (the job of `/sync`).
- The two `dev-check` pages stay as they are.

## Follow-up

- [ ] Scope rows #12 and #20 say they are the first page or the shell of their area. The shell (spec 0003) and the dashboard (this spec) already give each area a frame, so those rows should be reworded by `/scope`: #12 and #20 add pages under the shell and turn their tools on, and do not build a frame.
- [ ] Scope row #31 lists #10 and #17 as tools. This spec folds them into "Đăng tin", "Tin của tôi" and "Gói và đơn của tôi". `/scope` or `/sync` should note it on the row.
- [ ] Each later feature turns its tool on in the same change as its page: #12 (two tools), #19, #28 (both areas), #20, #21, #22, #23, #24, #25 and #26. It also confirms or changes the label and description, and sets the address.
- [ ] #28 (profile) decides where the profile page lives, since both areas and the renter need it. Its `href` is not guessed here.
- [ ] The `dev-check` pages (`/landlord/dev-check`, `/admin/dev-check`) stay until #12 and #20 remove them, as their own comments say. Specs 0005 and 0006 still point at them.
- [ ] `ForbiddenState` could offer a link to the person's own dashboard. Not in this feature.
- [ ] #26 may add date ranges to revenue. The dashboard figure then stays "every paid order" unless #26 decides otherwise.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
