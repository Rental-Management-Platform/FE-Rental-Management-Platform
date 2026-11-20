# 0023. Admin users and the shared reason dialog

**Date**: 2026-11-18
**Status**: Accepted

## Summary

This spec adds the admin page `/admin/users`. An admin can find an account, lock it or unlock it with a written reason, and cut every login session of a person, all with confirmation. It also builds the one reason dialog (a pop up that asks for a required text of 1 to 500 characters) that listing moderation (#21) and review moderation (#36) will reuse. Today the "Người dùng" card on the admin dashboard is dimmed and no page exists behind it.

> **Amended 2026-11-20 by [0025](../0025-admin-overview-statistics/index.md)**: a lock or an unlock (and the hide and unhide of listings and reviews that use the same dialog) marks `adminStatsKey` (`["admin-stats"]`) out of date, read again when the admin next opens `/admin`, in place of `dashboardKey`. The admin cards that showed the locked count are gone; the overview strip and the accounts zone show it now.


> **Amended 2026-11-20 (no spec of its own, at the engineer's request)**: a row of the users table shows only the status badge. The reason an admin gave when locking, and the marker "Tài khoản của bạn" of the viewer's own row, are read in "Xem chi tiết" (`RowDetail`), which every row has next to its first button. The same rule applies to the listing and review moderation lists (#21, #36): the reason of a hide is in "Xem chi tiết", and a comment is cut to two lines on the row.
## Context

> ⚠️ Premise note: scope item #20 is named "Admin shell and users" and says it defines the table and filter pattern. The shell and that pattern already exist: the admin frame came with #31, and the table, the filters kept in the address and the shared dialog came with #25, #22 and #23, which were built first. So this spec does not build a shell and does not invent a second table pattern. What #20 still has to define is the users page and the reason dialog. Also, the "Done when" line says a 403 `ACCOUNT_LOCKED` or a 401 sends the admin to sign in. The session layer already does that for every call that carries a token (`endReasonForTokenCall`), so the page adds nothing for it.

The admin dashboard lists a tool "Người dùng" that is still `soon`, so an admin has no way in the app to find an account that broke the rules and lock it. The backend is done (`api-for-frontend.md`, 6.10, 6.11, 6.12 and 6.34). `GET /users` (permission `user:read`) lists every account, locked ones and admins included, newest first, 20 rows by default and 50 at most, with the filters `accountType`, `status` and `q`. `q` matches email, name or phone as a substring. It ignores case but not accents, so "nguyen" never finds "Nguyễn". An unknown value or an unknown parameter is a 400. `POST /users/:id/lock` and `/unlock` (permission `user:lock`) need a `reason` of 1 to 500 characters and answer with six fields, without `lockedReason`. `POST /users/:id/revoke-sessions` (permission `user:revoke`) has no body and answers 204. A lock also ends every session at once; an unlock does not bring them back. The API refuses only one thing by identity: an admin locking their own account (409 `CANNOT_LOCK_SELF`). Locking another admin is allowed. Two admins acting at the same moment can meet 409 `ACCOUNT_ALREADY_LOCKED`, 409 `ACCOUNT_NOT_LOCKED` or 404 `USER_NOT_FOUND`.

What already exists. The admin pages `/admin/orders`, `/admin/plans`, `/admin/catalog` and `/admin/permissions` give the patterns to follow: filters and page in the address, a table from `md` and stacked blocks below, one shared dialog for all rows, `useReturnFocus`, a toast on success, `ListFailure` and `RateLimitNotice` for failures. The `users` tool in `src/components/shells/workspace-tools.ts` already has its permission and its dashboard number. The dev only sample screen `/dev/ui/screens/admin-users` shows a draft of this page, but it keeps a note under the search box and a hint under the reason field, which the project stopped allowing on 2026-11-13. Two more features need the same reason dialog (#21 hide and unhide a listing, #36 hide and unhide a review, both with a required reason of 1 to 500 characters), and without one shared piece the same form would be written three times.

## Requirements

Seeded from scope item #20 and refined with the engineer. Contract: `api-for-frontend.md`, sections 6.10, 6.11, 6.12 and 6.34. Patterns to follow: #25 (filters in the address, past the last page), #22 and #23 (shared dialog, toast, focus), `design.md`, and the project rules in `AGENTS.md` (no help text under a field, semantic tokens only).

**Out of scope** (settled with the engineer): a detail page for one account, sorting, last login, who locked an account and when, per row landlord data (plan, quota), counts by type or status, export, accent insensitive search (the API does not offer it), links from a row to the orders or the public profile, creating or deleting accounts, changing an account type, and the hide and unhide screens of #21 and #36 themselves.

**User stories**:
- As an admin, I want to search and filter accounts, so that I find the right person without knowing their id.
- As an admin, I want to lock an account with a reason and unlock it with a reason, so that the decision is written down.
- As an admin, I want to cut every session of a person without changing their account, so that a stolen login stops working.
- As an admin, I want a clear message when another admin got there first, so that I do not repeat or undo their work by mistake.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

The page and the list:
- **AC-1**: The page is `/admin/users` in the `(admin)` group, behind the route gate, titled "Người dùng", kept out of search (`noindex`), and has `instant = false` like the other gated pages. It reads in the browser with the token. A person without `user:read` sees `ForbiddenState` and no request is made. The `users` tool in `ADMIN_TOOLS` becomes `ready` with `ADMIN_USERS_PATH`, so the dashboard card and the menu item light together.
- **AC-2**: The list is one query on `GET /users` with `page`, `pageSize` 20 and only the filters that are set. The rows keep the API order (newest first). A heading shows the total ("37 người dùng"), is read out again when it changes, and is for a screen reader only when there are no rows. Each row shows: name (or "Chưa đặt tên") and email, phone (`formatPhone`, or "Chưa có"), the account type in words (Người đăng bài, Người tìm trọ, Quản trị viên), the registration day, and the status as a badge with words and an icon. A locked row shows its whole `lockedReason`, wrapped inside the status cell. The same rows are a table from `md` and stacked blocks below it.
- **AC-3**: The type filter, the status filter, the search text and the page all live in the address (`accountType`, `status`, `q`, `page`). Each filter change goes to page 1. The two selects write the address at once. The search text waits 400 ms after the last key and then replaces the address, so Back does not step through every letter. `q` is trimmed and cut to 254 characters, and a `q` that is empty after trimming is not sent. A value the API would refuse (an unknown `accountType` or `status`, a bad `page`) is treated as not there and never sent. While the person types, the box keeps what they typed; it takes the address text again only when the address changes from outside (the "Xóa bộ lọc" button, Back).
- **AC-4**: The search box has no text under it. Its placeholder says "Email, tên đúng dấu hoặc số điện thoại". When a search matches nothing, the empty state names the accent rule ("Tên phải gõ đúng dấu: “nguyen” không tìm ra “Nguyễn”.") and offers "Xóa bộ lọc". With a filter set and no match it says nothing matched and offers the same button. A page past the last one (typed by hand) goes to the last page that has rows.

The actions:
- **AC-5**: Row buttons follow one rule, and each needs its permission. An active account of another person shows "Khóa" (`user:lock`) and "Thu hồi phiên" (`user:revoke`). A locked account shows only "Mở khóa" (`user:lock`). The row of the person looking shows no button and says "Tài khoản của bạn". An admin holding neither permission sees no action column. Every button name carries the email of its row for a screen reader.
- **AC-6**: "Khóa" and "Mở khóa" open the shared `ReasonDialog` with a title, one sentence on what the action does, a required reason field, a live count "n/500" of the trimmed text, an example in the placeholder, and a confirm button ("Khóa tài khoản" in the destructive style, "Mở khóa tài khoản"). For an admin row the sentence adds "Đây là tài khoản quản trị." An empty reason or one over 500 characters is stopped in the browser with a message under the field and sends nothing. The body sent is only `{ "reason": <trimmed text> }`. The dialog stays open while the request runs, cannot be closed by Escape or a click outside during it, and a second press sends nothing.
- **AC-7**: After a lock or unlock succeeds, the list is read again before the dialog closes, the toast names the account ("Đã khóa tài khoản <tên hoặc email>", "Đã mở khóa tài khoản <tên hoặc email>"), and the row shows the new status and, for a lock, the `lockedReason` that the list returned. When a status filter is set and the row no longer matches, it leaves the list and focus goes to the results heading. Otherwise focus returns to the button of that row.
- **AC-8**: A 409 `ACCOUNT_ALREADY_LOCKED` or `ACCOUNT_NOT_LOCKED` closes the dialog, reads the list again, and shows a toast saying the account is already locked (or active) because of a change made elsewhere. A 404 `USER_NOT_FOUND` closes the dialog, reads the list again, and shows a toast saying the account no longer exists. A 409 `CANNOT_LOCK_SELF` (the button is hidden, so only a stale screen can reach it) shows its message inside the dialog.
- **AC-9**: Any other failure of a lock or unlock stays inside the dialog and keeps the typed text: a 400 `VALIDATION_FAILED` puts the message of `errors[].field` "reason" under the field; a 429 shows the wait counting down and disables the confirm button until it ends; a 403 `PERMISSION_DENIED`, a 5xx or a network error shows one form level message. The admin can send again. A 403 `ACCOUNT_LOCKED` or a 401 ends the session through the session layer, with nothing page specific.
- **AC-10**: "Thu hồi phiên" opens an alert dialog "Thu hồi mọi phiên của <tên hoặc email>?" saying the person must sign in again and the account does not change. Confirm calls `POST /users/:id/revoke-sessions` with no body. On 204 the dialog closes and a toast says "Đã thu hồi mọi phiên của <tên hoặc email>"; the list is not read again, because no row changes. The dialog stays open while the request runs. A 404 `USER_NOT_FOUND` closes it, reads the list again and shows the toast of AC-8. A 429, a 5xx or a network error stays inside the dialog (429 with the countdown) and the admin can confirm again.

The states and the frame:
- **AC-11**: While the first read runs the zone shows a table shaped loading state. A failed first read shows the error with "Thử lại" (a 429 shows the countdown and keeps "Thử lại" off until it ends), and a 403 `PERMISSION_DENIED` shows `ForbiddenState`. A later failed read keeps the rows on screen. A first page with no rows and no filter shows an empty state.
- **AC-12**: At 320, 390, 768 and 1280 px nothing scrolls sideways except the table inside its own zone at 768. Controls are 44 px in the blocks and 32 px in the table. Every dialog has a title. Status is said in words and an icon, never by color alone. `npm run check` and `npm run build` pass.

## Options considered

### Option 1: The users page plus a shared `ReasonDialog` now

Build `/admin/users` and, in the same change, one reason dialog in `src/components/form/` that takes a title, a sentence, a confirm label, a style and a send function. #21 and #36 call it without writing their own.

**Pros**:
- One place for the 1 to 500 rule, the live count, the error placement and the 429 wait, so three screens behave the same.
- Matches the scope, which already says the box is shared and follows the pattern of #20.

**Cons**:
- The contract is drawn with one real caller, so #21 or #36 may ask for a change.
- A little more work in this feature than a page that owns its form.

### Option 2: The page owns its reason form, lift it when #21 starts

Keep the form inside `src/features/admin-users/` and move it to shared code when the second caller arrives.

**Pros**:
- Smallest change now, and the shared shape is drawn from two real callers.

**Cons**:
- #21 must edit this feature as well, and the two copies can drift in between.
- Breaks the plain reading of scope #21 and #36, which call the box "shared".

### Option 3: Rework the admin pages around one generic data table component

Extract a table, filter and dialog component used by orders, plans, catalog, permissions and users.

**Pros**:
- One shape for every admin list in the long run.

**Cons**:
- It rewrites four finished and tested pages for a gain nobody asked for, in a demo project with a deadline.
- The pages differ (totals, toggles, a matrix), so the generic part would be thin.

## Decision

**Chosen option**: Option 1: The users page plus a shared `ReasonDialog` now

Build `/admin/users` on the patterns of #25, #22 and #23, and put the reason dialog and its schema in `src/components/form/` so #21 and #36 reuse them.

**Implementation skills**: `tanstack-query-best-practices` (`deckardger/tanstack-agent-skills`, `.agents/skills/tanstack-query-best-practices/`) · `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`)

## Rationale

Three screens need the same dialog with the same rule, and scope #21 and #36 already say they use the box that #20 defines. Writing it once removes the main way three admin screens could disagree, such as one accepting an empty reason or one losing the typed text after a failure. The cost is a contract guessed from one caller, but the contract is small (a title, a sentence, a confirm label, a style, a send function that may throw), and #21 and #36 have the same shape, a required reason of 1 to 500 characters sent in one POST. Option 3 was left out because four admin pages already work and differ too much for a generic table to pay off.

The row rule is strict on purpose (no button on your own row, a locked row offers only unlock). A locked account has no session left to cut, since a lock already ended them, and cutting your own sessions would only sign you out at the next refresh while the sign out button already exists. Locking another admin stays allowed because the contract allows it, a lock is reversible, and the extra sentence in the dialog guards against a wrong click. After a write the list is read again instead of patched by hand, as #22 and #23 do, because the lock answer lacks `lockedReason` and a patched row could disagree with the database.

## Feature design

**Data model sketch**:
- No new entity: the backend keeps the data. The row type is `AdminUserListItem` (`id`, `email`, `name`, `phone`, `accountType`, `status`, `lockedReason`, `createdAt`), already in `src/lib/api/types.ts`; the list answer is `Page<AdminUserListItem>`.
- View model (pure, in `user-filter.ts`): `UserFilters { accountType: AccountType | "all"; status: UserStatus | "all"; q: string }` plus the page number. The address is the only owner of it.
- Dialog target: one `AdminUserListItem` held while a dialog is open, so the toast can name it even after the row changes.

**State transitions**:
- Account status: `active` ⇄ `locked`. Lock needs `active` (else 409 `ACCOUNT_ALREADY_LOCKED`), unlock needs `locked` (else 409 `ACCOUNT_NOT_LOCKED`). A lock ends every session at once; an unlock restores none; a revoke ends every session and changes no status.
- Dialog: closed → open (idle) → sending → closed on success or on a "gone" answer (AC-8, AC-10), or back to open (idle, with a failure shown) on any other error.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/users` | GET | `page`, `pageSize` 20, `accountType`, `status`, `q` (each only when set) | `items`, `total`, `page`, `pageSize` | bearer, `user:read` | 400 `VALIDATION_FAILED`, 403 `PERMISSION_DENIED`, 403 `ACCOUNT_LOCKED` |
| `/users/:id/lock` | POST | `reason`: string 1 to 500 (req) | six field user, `status: locked` | bearer, `user:lock` | 400 `VALIDATION_FAILED` (`reason`), 404 `USER_NOT_FOUND`, 409 `ACCOUNT_ALREADY_LOCKED`, 409 `CANNOT_LOCK_SELF` |
| `/users/:id/unlock` | POST | `reason`: string 1 to 500 (req) | six field user, `status: active` | bearer, `user:lock` | 400 `VALIDATION_FAILED` (`reason`), 404 `USER_NOT_FOUND`, 409 `ACCOUNT_NOT_LOCKED` |
| `/users/:id/revoke-sessions` | POST | none | 204, no body | bearer, `user:revoke` | 404 `USER_NOT_FOUND`, 400 `INVALID_ID` |

All four error codes of the user module are already in `ERROR_CODES` (`src/lib/api/types.ts`); `ReasonDialog` places the 400 under the `reason` field through `applyFieldErrors`.

**Shared reason dialog contract** (`src/components/form/reason-dialog.tsx` and `reason-schema.ts`):
- Props: `open`, `onOpenChange`, `title`, `description` (one sentence of consequence, in the dialog header, never under the field), `confirmLabel`, `tone` (`default` or `destructive`), `placeholder`, and `onSubmit(reason: string): Promise<void>`.
- `reason-schema.ts` exports `REASON_MAX = 500` and the Zod schema (trimmed, 1 to `REASON_MAX`, messages "Nhập lý do." and "Lý do tối đa 500 ký tự.").
- The owner holds `open` and calls `useReturnFocus`. A resolved `onSubmit` means the owner closes the dialog. A thrown error is shown inside by `useFormFailure` and `FailureNotice` (field message, form message, or 429 countdown). To close on a "gone" answer the owner catches that error itself, shows its toast and resolves.
- The form lives inside `DialogContent`, so every opening starts empty. The only text near the field is a live count "n/500", which is a reading of what was typed.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| List | heading count | `total` of `GET /users` |
| List | name, email, phone, type, registration day | `name` (or "Chưa đặt tên"), `email`, `phone` through `formatPhone` (or "Chưa có"), `accountType` through the label map in `src/features/account/access.ts`, `createdAt` through `formatDateTime` |
| List | reason of a locked row | `lockedReason` of the list answer (the lock answer has none) |
| List | page size | `ADMIN_USERS_PAGE_SIZE` = 20, decided here (the API default, 50 at most) |
| Row | "is this my row" | `session.user.id` against the row `id` |
| Row | which buttons | `status`, "my row", and `can(session, "user:lock")` and `can(session, "user:revoke")` |
| Dialog | "Đây là tài khoản quản trị." | `accountType === "admin"` of the row held in the dialog |
| Dialog | the name in a toast | `name ?? email` of the row held when the dialog opened |
| Lock, unlock | `reason` sent | the typed text, trimmed |
| Dialog | the count "n/500" | length of the typed text, trimmed |
| Dialog | the 429 wait | `Retry-After` carried by the `ApiError`, read by `useCountdown` |

**Key invariants**:
- The body of a lock or unlock is only `{ reason }` with the trimmed text of 1 to 500 characters. A revoke sends no body.
- The row of the current admin never offers a lock or a revoke. A locked row never offers a revoke.
- A filter value the API would refuse is never sent. `q` is trimmed and at most 254 characters.
- After a lock or an unlock the list is the truth: no row is patched by hand. One request runs at a time per dialog (a ref guard, because state lags a render behind a fast second press).
- After a lock or an unlock the `dashboardKey` entries are marked out of date, so the locked accounts number on the dashboard card stays right.
- Text weights, tokens, sizes and zones follow `AGENTS.md` and spec 0004. No help text under any field.

**Security model**:
- Only an admin holds `user:read`, and it cannot be granted to the other types. The page is gated by the route and by `can(session, "user:read")`; hiding a button is a convenience, and the backend decides every call. `GET /users` answers `Cache-Control: private, no-store`, so the rows live only in the query cache in memory.
- The list holds emails and phones of other people. They stay on this gated, `noindex` page, are never logged, never stored in the browser and never placed in the address. The one exception is the search text the admin types, which sits in the address (and so in this browser's history) like any search.
- The backend records who locked an account, when and why. No compliance standard is set by the scope for this project.

**Configuration required**: none.

**Critical test scenarios**:
- Happy path: open the page, filter to landlords, search an email, lock the account with a reason, see the toast, the status and the reason in the list, then unlock it with a reason, verifies **AC-2**, **AC-3**, **AC-6**, **AC-7**.
- Revoke: confirm "Thu hồi phiên" on a tenant who is signed in elsewhere; the toast shows and that tab loses the session at its next refresh, verifies **AC-10**.
- Rules of the row: my row has no button, a locked row has only "Mở khóa", an admin row's dialog shows the extra sentence, verifies **AC-5**, **AC-6**.
- Failure case: two tabs, lock the same account in both; the second gets `ACCOUNT_ALREADY_LOCKED` and a toast with a closed dialog. Delete the account in the first and act in the second for `USER_NOT_FOUND`. Block the request for a network error and press send again, verifies **AC-8**, **AC-9**, **AC-10**.
- Address: unknown `status`, a `page` past the end, a `q` over 254 characters, Back after typing a search, verifies **AC-3**, **AC-4**.
- Auth/permission: a person without `user:read` sees the forbidden state with no request; an admin without `user:lock` sees no Khóa and Mở khóa, verifies **AC-1**, **AC-5**.
- Reach: 320, 390, 768 and 1280 px, keyboard only, and focus after each dialog closes, verifies **AC-12**.

## Build plan

Build approach: Tracer Bullet, so milestone 1 is a thin working thread through every layer and each later milestone thickens it and still runs end to end.

1. **M1 Thin thread**: `ADMIN_USERS_PATH` and the route `src/app/(admin)/admin/users/page.tsx` (`Suspense`, `noindex`, `instant = false`), the query on `GET /users` with `adminUsersKey`, a page with the heading total and the rows as a table and as blocks (status badge with the whole reason, no buttons yet), the loading state, the first read failure with "Thử lại" and the 429 countdown, `ForbiddenState`, and the `users` tool turned `ready` in `workspace-tools.ts`, satisfies **AC-1**, **AC-2**, **AC-11**.
2. **M2 Filters, search and paging in the address**: the pure `user-filter.ts` (parse, write back, `hasFilters`), the filter bar with the two selects and the search box (400 ms, `replace`, the box owns its text while typing), page links through `ListPagination`, past the end goes to the last page, the two empty states, satisfies **AC-3**, **AC-4**.
3. **M3 Reason dialog, lock and unlock**: `src/components/form/reason-schema.ts` and `reason-dialog.tsx`, the row rule (`row-actions.ts`), the lock and unlock mutations and the flow hook (one request at a time, list read again before closing, `dashboardKey` marked out of date, toast, focus), the "gone" answers and the in dialog failures, satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**.
4. **M4 Revoke and finish**: the revoke mutation and the alert dialog, the permission rules for the buttons and the hidden action column, the last states, a check at 320, 390, 768 and 1280 px with keyboard only, `npm run check` and `npm run build`, satisfies **AC-5**, **AC-10**, **AC-11**, **AC-12**.

Files: `src/features/admin-users/` (`admin-users-path.ts`, `admin-users-text.ts`, `user-filter.ts`, `row-actions.ts`, `user-failure.ts` with `classifyUserError`, `api/` for `users.ts` and `admin-users-keys.ts`, `hooks/` for the lock flow and the revoke flow, `components/` for `AdminUsersPage`, `UserFilterBar`, `UsersTable`, `UserCards`, `UserStatus`, `UserRowActions` and `RevokeDialog`), `src/components/form/` (`reason-dialog.tsx`, `reason-schema.ts`), the route, and the `users` entry in `src/components/shells/workspace-tools.ts`. Lift markup from the sample screen `/dev/ui/screens/admin-users` but drop its note under the search box and its hint under the reason field. Add no `/dev/ui` section (stopped on 2026-11-12). Reuse `ListFailure` from `src/features/admin-catalog/`.

## Consequences

**Positive**:
- Admins can finally act on an account from the app, and the "Người dùng" card works.
- #21 and #36 get a tested reason dialog and start from a settled pattern.
- A locked account number on the dashboard card stays right after each lock.

**Negative / tradeoffs**:
- The shared dialog contract is drawn from one caller and may need a change when #21 or #36 starts.
- Reading the list again after each write costs one more request, and under a status filter the row disappears, which the toast must explain.
- An admin cannot cut their own sessions from this page, and cannot cut the sessions of a locked account (a lock already did).
- Search is accent sensitive because the backend is, so a person who types "nguyen" finds nobody; the empty state says so instead of fixing it.
- The search text, which may be an email or a phone number, is kept in the address and the browser history.
- Locking another admin is allowed, so two admins can lock each other; it is reversible but needs a third admin or the database.

**Neutral**:
- The sample screen `/dev/ui/screens/admin-users` stays as it is and keeps compiling, including its own copy of the reason form.
- No change to the backend or to the session layer.

## Follow-up

- [ ] #21 and #36 call `ReasonDialog`; if either needs a different contract, amend this spec first.
- [ ] `src/components/AGENTS.md` should list `ReasonDialog` under `form/` once built (`/sync` owns that file).
- [ ] The old sample screen at `/dev/ui/screens/admin-users` still shows help text under its fields; leave it or clean it, your call.
