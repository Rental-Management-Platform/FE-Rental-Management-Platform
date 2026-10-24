# 0005. Sign up and sign in pages, route gate and permission helper for the web frontend

**Date**: 2026-10-25
**Status**: In Progress

## Summary

This feature turns the session layer from spec 0002 into real screens. A sign in page, a sign up page where a person picks "landlord" or "seeker" once, a gate (a check that sends a guest to sign in and then back), and a small helper that hides what a person has no permission to use. It also shows a clear "cannot check your account, try again" state, and removes the temporary `/dev/session` test page. It adds no backend call, no table and no environment variable, because every call already exists in `useSessionActions`.

## Requirements

Seeded from scope item #5 (marked Beta) and refined with the engineer. Contract with the backend: `api-for-frontend.md` sections 4, 6.1, 6.2 and 7. Contract for the session, shells, forms and states: specs 0002, 0003 and 0004.

**User stories**:
- As a visitor, I want to create an account as a landlord or a seeker, so that I can post listings, or save and follow them.
- As a returning person, I want to sign in and land on the page I was trying to reach.
- As a person whose session ended, I want to be told why and to sign in again without losing my place.
- As a guest who opens a page that needs a login, I want to be sent to sign in and then returned to that page.
- As the developer of a later feature, I want one gate and one `Can` helper, so that I never hand write an access check.
- As someone using a keyboard or a screen reader, I want labelled fields, visible focus and announced errors.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: Sign in. `/login`, in the `(auth)` shell, has an email field, a password field and a submit button. It calls `signIn` from `useSessionActions`. On success the state is `user`, the header shows the account menu, and the page moves to the landing path of AC-7 with `router.replace`, so the back button does not return to the form. A hard reload on any page keeps the person signed in (spec 0002 AC-4), checked here through the real pages. The password is in no URL, storage or log.
- **AC-2**: Sign in errors. 401 `INVALID_CREDENTIALS` and 403 `ACCOUNT_LOCKED` show one form level message (the backend text) and mark no input. 400 puts each `errors[].field` message under its input and moves focus to the first one. 429 shows `RateLimitNotice` with the countdown and disables submit. A 5xx shows the message with the support code, and a network error shows the standard message. Before sending, an empty email says "Nhập email của bạn.", a badly formed email says "Email không đúng định dạng.", and an empty password says "Nhập mật khẩu." Sign in checks only that the password is not empty, with no length check, because the backend decides.
- **AC-3**: Sign up, landlord. `/register` opens with two cards, "Người đăng bài" (`landlord`) and "Người tìm trọ" (`tenant`), none selected, and no form until one is chosen. A line says the type cannot be changed after signing up. A landlord form has email, password, name (optional) and phone (required). Success gives state `user` and the landing path of AC-7.
- **AC-4**: Sign up, seeker. The phone is optional, and if typed it gets the same light check as AC-6. Success is the same as AC-3. Switching the card before sending keeps what was typed and changes only the phone rule: the phone error is cleared on a switch and checked again only if a send was already tried.
- **AC-5**: Sign up errors. `EMAIL_TAKEN` shows under email and `PHONE_TAKEN` under phone (through `fieldErrors`). `VALIDATION_FAILED` shows per `errors[].field`, and a message for a field the form does not have becomes a form level message. 429 shows the countdown and disables submit. The first field with a message gets focus, in screen order (the order of the form's `fields` list, not the order the backend sent them). A message on `accountType` shows under the cards. A blank name or phone (`trim() === ''`) is left out of the request body, the name is sent trimmed, and the phone is sent exactly as typed.
- **AC-6**: Light checks before sending (the backend stays the real validator; messages in Vietnamese). Email is trimmed (before the check and before sending, and never lowercased), required, loosely formed (one `@` with text on both sides and a dot in the domain), and at most 254 characters. Password is 8 to 128 characters, spaces kept as typed. Name is at most 100. The account type is required. A phone is required for a landlord, and when present it passes the check "after dropping spaces, dots and dashes and turning a leading `+84` or `84` into `0`, it is `0`, then one of `3 5 7 8 9`, then 8 digits". That change is for the check only.
- **AC-7**: Landing path. After sign in or sign up, and when an already signed in person opens `/login` or `/register`, the page goes to `next` if `safeNextPath` accepts it, else to `/`. `safeNextPath` accepts only a relative path: one leading `/`, no `//`, no backslash, no scheme or host, no control character, at most 2000 characters, and not `/login` or `/register` or anything under them. It returns the path with its query and hash, after a last check that `new URL(path, origin).origin` equals the site origin. One function, `afterAuthPath(next, user)`, holds the rule, so a later feature can route by account type.
- **AC-8**: Auth page states. While the session is `loading`, both pages show the form skeleton, so a person who already has a session never sees the form flash. `user` redirects (AC-7). `guest` shows the form, with the message of AC-10 when the session was lost. `guest('unavailable')` shows the form and, above it, "Không kiểm tra được tài khoản" with a "Thử lại" button that calls `restore()` (spec 0002 requires a retry on every login page). Once the form has been shown it stays mounted through a later `loading`, so typed values are not lost.
- **AC-9**: Gate. `RequireSession` wraps the layouts of `(landlord)` (account type `landlord`) and `(admin)` (account type `admin`), outside their shell, and can wrap any single page that needs a login. `loading` shows `LoadingState`. A guest is sent with `router.replace` to `/login?next=<path and query, encoded>`, and nothing of the page is rendered for them. A `user` of another account type sees `ForbiddenState`. A matching `user` sees the children. The gate's own states (`LoadingState`, `ErrorState`, `ForbiddenState`) are drawn inside the `AuthShell` frame, so they have a skip link, one `main` and one `h1`. Until #12 and #20 add real pages, two dev only fixture pages, `/landlord/dev-check` and `/admin/dev-check` (404 in production), let the gate be checked. Each has a button that makes a required call (`reload()`).
- **AC-10**: Lost session. A gated page that sees `guest('expired' | 'revoked' | 'locked')`, whether the state arrives from `user` or from `loading` (a reload after the session ended), sends the person to `/login?next=...`, and the login page shows the reason above the form: "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại." (expired), "Phiên đăng nhập đã bị đóng ở nơi khác hoặc bởi quản trị viên. Hãy đăng nhập lại." (revoked), "Tài khoản của bạn đã bị khóa. Hãy liên hệ quản trị viên." (locked). `guest(null)` right after `user` (an explicit sign out) sends a gated page to `/` and leaves a public page where it is. `guest(null)` on arrival goes to `/login?next=...`.
- **AC-11**: Unavailable. With `guest('unavailable')`, the account area (bar and phone menu sheet) shows "Không kiểm tra được tài khoản" and a "Thử lại" button that calls `restore()`, in place of the "Đăng nhập" and "Đăng ký" buttons. A gated page shows `ErrorState` with the title "Không kiểm tra được tài khoản", the message "Hệ thống chưa trả lời. Bạn có thể vẫn đang đăng nhập, hãy thử lại." (a new optional `message` prop, because there is no error object to read it from) and a retry that calls `restore()`. A retry shows `loading` and then settles, or lands in another state of AC-10.
- **AC-12**: Sign out. "Đăng xuất" in the account menu (bar and sheet) calls `signOut()` without waiting for it (the state is already `guest(null)` when it returns its promise, and the server call can run up to its timeout) and shows the toast "Đã đăng xuất" at once. A public page stays where it is as a guest view. A gated page goes to `/` (AC-10). The header shows the guest buttons.
- **AC-13**: Header links. The guest buttons "Đăng nhập" and "Đăng ký", in the bar and in the phone sheet, link to `/login` and `/register` with `?next=<current path>` (the path only, no query), except on `/` and on the auth pages, where they carry no `next`. The login and register pages link to each other and keep `next`, only when `safeNextPath` accepts it, built with `URLSearchParams` through `authHref`.
- **AC-14**: Permission helper. `Can` (`src/components/can.tsx`) renders its children only when `can(state, permission)` is true. Otherwise it renders `fallback` (default nothing), and while the state is `loading` it renders `loading` (default nothing). It never disables a control. It is display only: the backend decides.
- **AC-15**: Accessibility baseline (WCAG AA). Every input has a visible label. `autocomplete` is `username` on the email of both forms, `current-password` on sign in, `new-password` on sign up, `name` and `tel` for those fields, and the phone has `inputMode="tel"`. Both forms have `noValidate` (the Vietnamese messages replace the browser's own bubbles) and `method="post"` (a native submit before the script loads must never put the password in the URL). The password field has a show and hide button with `aria-pressed` and the Vietnamese names "Hiện mật khẩu" and "Ẩn mật khẩu", at least 44 px. Inputs type at 16 px and controls are 44 px (`lg`). The type cards are a radio group with a visible focus ring and arrow keys. While sending, submit is disabled with a spinner and `aria-busy`, so a second click sends nothing. The page has one `h1` and works at 320 px.
- **AC-16**: Metadata. `/login` and `/register` have the titles "Đăng nhập" and "Đăng ký" through the title template of spec 0003, and `robots` is `noindex, nofollow`.
- **AC-17**: Cleanup and clean build. `src/app/dev/session/`, `SessionDebug`, `useSessionDebug` and the `debug` hook inside `createSession` and `AuthProvider` are gone, and nothing imports them. `/dev/ui` shows the unavailable account view and still meets AC-11 of spec 0003. No link to a page that does not exist is rendered (so no "Quên mật khẩu?"). `npm run check` and `npm run build` pass, with no hydration warning and no console error on `/login` and `/register`.

## Decision

**Chosen option**: Option 1: Real pages in `src/features/auth` on top of the existing session layer, one client gate component mounted in the layouts, and a small `Can` helper

Build `/login` and `/register` with the form pieces of spec 0003 (`FormField`, `useFormFailure`, `FailureNotice`), gate the landlord and admin areas with a client component outside their shell, show a retry state when the session cannot be checked, and remove the temporary lab.

**Implementation skills**: `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `zod` (`pproenca/dot-skills`, `.agents/skills/zod/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`). Read the pages on `useRouter`, `useSearchParams` with Suspense, and metadata `robots` before writing.

## Feature design

**Data model and API surface**: none new. No table, endpoint or stored data. Every call is already behind `useSessionActions` (spec 0002): `signIn` (`POST /auth/login`), `signUp` (`POST /auth/register`), `signOut` (`POST /auth/logout`), `restore`, and the internal `GET /auth/me`. The only data are the two form values below and the `SessionState` that spec 0002 defines.

### Scope of this spec

| In #5 | Left to another item |
|---|---|
| `/login`, `/register`, `PasswordInput`, `AccountTypeChoice` | Password recovery pages and the "Quên mật khẩu?" link: #27 |
| `RequireSession` on `(landlord)` and `(admin)`, usable on any page | The gated pages themselves: #12, #14, #20, #28 |
| The "cannot check your account" state and retry | Quota and trial notices (these are not permissions): #17 |
| `Can`, sign out toast, `next` on the header links | Landing by account type (one function to change): #12, #20 |
| Removing `/dev/session` and the session debug hook | Profile, change password and the "Tài khoản" link: #28 |

Not in the backend, so not built: email verification, social sign in, "remember me", a password confirm field.

### Files

```
src/
  app/
    (auth)/login/page.tsx        title, noindex, <Suspense> with the form skeleton, renders LoginForm
    (auth)/register/page.tsx     same for RegisterForm
    (landlord)/layout.tsx        RequireSession accountType="landlord" around the shell
    (admin)/layout.tsx           RequireSession accountType="admin" around the shell
    (landlord)/landlord/dev-check/page.tsx   dev only fixture for the gate, 404 in production
    (admin)/admin/dev-check/page.tsx         the same for the admin group
    dev/session/                 deleted
  features/auth/
    components/                  login-form, register-form, account-type-choice, ended-notice, require-session
    hooks/use-auth-redirect.ts   a user on an auth page goes to afterAuthPath
    schemas/                     login-schema, register-schema (Zod, light checks)
  components/
    can.tsx
    form/password-input.tsx      shared with #27 and #28
    states/error-state.tsx       gains an optional message prop
    shells/account-menu.tsx, account-menu-view.tsx   unavailable view, next links, sign out toast
  lib/
    next-path.ts                 safeNextPath, afterAuthPath, authHref (pure)
    forms/apply-field-errors.ts  focus follows the order of the fields list
    session/                     debug hook removed
```

### Pages and states

- **Auth pages** (client form inside `<Suspense>`, `next` read with `useSearchParams`, the fallback is the form skeleton so the page stays static):

| Session state | Page shows |
|---|---|
| `loading` | Form skeleton |
| `guest` (any reason) | The form, with `EndedNotice` for `expired`, `revoked`, `locked`, and the retry notice above it for `unavailable` |
| `user` | Nothing, and `useAuthRedirect` replaces the URL with `afterAuthPath(next, user)` |

- **Sign up** is one page. The two cards (a radio group) come first. After a choice the form appears: email, password, name, phone. Phone shows for both types, required only for a landlord. Landlord card: "Đăng tin cho thuê và quản lý nhà trọ. Cần số điện thoại." Seeker card: "Xem tin, lưu tin yêu thích và theo dõi chủ trọ." The note "Loại tài khoản không đổi được sau khi đăng ký." sits under the cards. No type is preselected.
- **Gate** (`RequireSession`, a client component with the props `accountType?` and `children`):

| Session state | Gate does |
|---|---|
| `loading` | `LoadingState` (form variant, its standard "Đang tải"), inside the `AuthShell` frame |
| `guest(null)` otherwise (arrival, never signed in) | `router.replace('/login?next=...')`, once |
| `guest(null)` right after `user` (explicit sign out) | `router.replace('/')` |
| `guest('expired' \| 'revoked' \| 'locked')`, arriving from `user` or from `loading` | `router.replace('/login?next=...')` |
| `guest('unavailable')` | `ErrorState` (title, message and a retry calling `restore()`) |
| `user`, account type matches or none required | children |
| `user`, other account type | `ForbiddenState` |

  The gate is mounted outside the shell, so a guest or a wrong role never sees a menu of the other role. To tell an explicit sign out from an arrival it keeps the previous status in a ref and compares it in an effect. The ref is reset to `loading` when the gate unmounts or is hidden by `<Activity>` (the cleanup of an effect with no dependencies), so going back to a gated page after signing out on a public page counts as an arrival.
- **Account area**: `AccountMenuView` takes a new view for `guest('unavailable')` with an `onRetry` prop. The container passes `restore`. `/dev/ui` shows it beside the loading, guest and user views. The guest buttons are built in a small leaf inside `<Suspense>` (it reads `usePathname()` for `next`), with the 32 px skeleton as its fallback, because `usePathname` can need Suspense on a route with dynamic parts under Cache Components.
- **`Can`**: `<Can permission="listing:create" fallback={...} loading={...}>children</Can>`. It uses `useSession` and `can`. It hides, never disables.

### Copy (Vietnamese, decided here, `/develop` may polish the wording)

| Where | Text |
|---|---|
| Sign in | `h1` "Đăng nhập". Fields "Email" and "Mật khẩu", placeholders "Nhập email của bạn" and "Nhập mật khẩu". Button "Đăng nhập", while sending "Đang đăng nhập". Link "Chưa có tài khoản? Đăng ký" |
| Sign up | `h1` "Đăng ký", line "Chọn loại tài khoản bạn cần." Cards as above. Fields "Email", "Mật khẩu" with the hint "Từ 8 đến 128 ký tự.", "Tên (không bắt buộc)", "Số điện thoại" (hint for a landlord "Dùng để người tìm trọ liên hệ bạn.", marker "(không bắt buộc)" for a seeker). Button "Tạo tài khoản", while sending "Đang tạo tài khoản". Link "Đã có tài khoản? Đăng nhập" |
| Password button | "Hiện mật khẩu" and "Ẩn mật khẩu" |
| Light check messages | Email: "Nhập email của bạn.", "Email không đúng định dạng.", "Email tối đa 254 ký tự." Password: "Nhập mật khẩu." (sign in), "Mật khẩu cần từ 8 đến 128 ký tự." (sign up). Name: "Tên tối đa 100 ký tự." Phone: "Người đăng bài cần có số điện thoại.", "Số điện thoại di động Việt Nam gồm 10 số, ví dụ 0912 345 678." Type: "Chọn loại tài khoản." |
| Cannot check the account | Title "Không kiểm tra được tài khoản", message "Hệ thống chưa trả lời. Bạn có thể vẫn đang đăng nhập, hãy thử lại.", button "Thử lại" |
| Toast | "Đã đăng xuất" |

Server messages (`INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `errors[].message` and the rest) come from the backend text unchanged.

### Value sourcing

| Action | Value produced or displayed | Source |
|---|---|---|
| After sign in or sign up | Landing path | `next` query value accepted by `safeNextPath`, else `/`, through `afterAuthPath(next, user)` (decided here) |
| Gate redirect | `next` | `window.location.pathname` plus `window.location.search`, read together inside the effect (never while rendering) and encoded with `encodeURIComponent` |
| Header guest links | `next` | `usePathname()`, path only, none on `/` and the auth pages (decided here) |
| Login page message | Reason text | `useSession()` `endedReason` and the fixed sentences of AC-10 (decided here) |
| Sign up body | `accountType` | The card chosen, no default |
| Sign up body | `name`, `phone` | The typed value as is, or left out when blank (decided here) |
| Sign up form | Is the phone required | Derived: `accountType === 'landlord'` |
| Sign in and up | Field messages | `fieldErrors(error)` of spec 0002 (it maps `EMAIL_TAKEN` to `email` and `PHONE_TAKEN` to `phone`), and the Zod messages for the light checks |
| Sign in and up | Form level message and support code | `describeError(error)`, the code for a 5xx only |
| Sign in and up | 429 wait | `RateLimitNotice` and `useCountdown` (spec 0002) |
| Account area | "Không kiểm tra được tài khoản" | `endedReason === 'unavailable'` (spec 0002), retry is `restore()` |
| Sign out | Toast text | Fixed "Đã đăng xuất" (decided here) |
| Gate | Does the person pass | `user.accountType` from `useSession()` |
| `Can` | Is it shown | `permissions` from `useSession()` through `can()` |
| Metadata | Titles | `metadata.title` "Đăng nhập" and "Đăng ký" under the template of spec 0003 |

### Key invariants

- The token never leaves the session closure. The `next` value carries only a path.
- The password is never logged, never put in a URL, never copied into an error, and its input is `type="password"` (or `text` only while shown).
- `next` is trusted only after `safeNextPath`. No redirect leaves the site.
- A guest never sees the content of a gated page: children are not rendered until the state is `user`.
- Gated pages fetch no private data on the server (the server has no token), so nothing private travels in the server payload of a gated page.
- The gate and `Can` are display only. The backend is the real check.
- One mechanism moves a `user` off an auth page (the `useAuthRedirect` effect), so a sign in, an already signed in visit and a second tab behave the same.
- No link to a page that does not exist is rendered.
- Forms use `FormField`, `useFormFailure` and `FailureNotice`. No new error pattern.

### Edge cases and failure handling

| Case | Handling |
|---|---|
| Person with a session opens `/login` | Skeleton, then `user`, then replace. The form never flashes |
| `?next=//evil.com`, `?next=/login`, a value with a backslash | `safeNextPath` rejects it and the landing path is `/` |
| Wrong email or password | One form level message from the backend. Both fields keep what was typed |
| Locked account at sign in | The backend message in the form level alert. No other hint |
| 429 | `RateLimitNotice` counts down and submit stays disabled |
| Network error or timeout | The standard message, the form stays, the person can retry |
| Double click on submit | Disabled while sending |
| Second tab opens `/login` while the first is signed in | Hint cookie, shared refresh, `user`, replace |
| `guest('unavailable')` on `/login` | The form is shown and sign in works |
| Back button after sign in | The sign in page was replaced, so back leaves it |
| Reload of a gated page after the session ended (`loading` then `guest('expired')`) | The gate goes to `/login?next=...` and the login page shows the reason |
| Back to a gated page after signing out on a public page | The gate counts it as an arrival (the ref was reset), so it goes to `/login?next=...` |
| Two tabs: tab B still shows `/login` as a guest while tab A signs in, then B signs in as someone else | Known limitation. The shared `rt` cookie changes, and tab A keeps showing its old user until the session layer is hardened (see Follow-up) |
| A server answer for a field the form does not have | Shown as the form level message (spec 0002), so nothing is lost |
| Phone typed with spaces or `+84` | Checked after the change in AC-6, sent as typed, the backend normalizes it |
| Switch card after typing | Values stay, only the phone rule changes |
| `useSearchParams` and Cache Components | Read inside `<Suspense>` with the skeleton as fallback, and confirm with `npm run build` |
| `usePathname()` in the header guest links | A small leaf inside `<Suspense>` with the 32 px skeleton as fallback, confirmed with `npm run build` |
| Scripts off | The auth pages show the shell and the skeleton only. Accepted, the forms are client only |

### Security model

- Both pages are public. The backend limits sign up to 10 per hour per IP and sign in to 10 per 15 minutes per email and 30 per 15 minutes per IP, each wrong password counted.
- Personal data typed here (email, phone, name) is held only in the form and sent to the API. Nothing is stored in the browser, and no regulated standard applies.
- The backend gives the same answer for a wrong email and a wrong password. A lock is shown only when the password is right. `EMAIL_TAKEN` and `PHONE_TAKEN` are shown as the contract says.
- `noindex, nofollow` on both pages. The gate is a convenience for people and never protects data.

### Configuration required

None. No environment variable and no new package (`react-hook-form`, `zod` and `@hookform/resolvers` are installed).

### Critical test scenarios

- Happy path: with the backend running, sign up as a landlord (phone typed with spaces), land on `/`, see the account menu, reload and stay signed in, sign out, verifies **AC-1**, **AC-3**, **AC-5**, **AC-12**.
- Seeker: sign up with no phone, then with a bad phone (message), then a good one, verifies **AC-4**, **AC-6**.
- Errors: wrong password, a locked account, a taken email, a taken phone, a 429 (twelve wrong logins), a stopped backend, verifies **AC-2**, **AC-5**.
- Redirect: open `/landlord/dev-check` as a guest, land on `/login?next=%2Flandlord%2Fdev-check`, sign in as a landlord and come back; try `?next=//evil.com` and `?next=/login`, verifies **AC-7**, **AC-9**.
- Wrong role: a seeker opens `/admin/dev-check` and sees `ForbiddenState` inside the auth frame, with no menu, verifies **AC-9**.
- Lost session: on `/landlord/dev-check` in tab B, sign out in tab A, then press the check button in tab B (it makes a required call, so the refresh runs): tab B goes to login with the "revoked" message. Also, sign in, let the session end (or clear the `rt` cookie), reload `/landlord/dev-check`: `loading`, then login with the reason, verifies **AC-10**.
- Sign out: on a listing page the person stays as a guest with the toast, on `/landlord/dev-check` the page goes to `/`, verifies **AC-12**.
- Unavailable: stop the backend, reload as a signed in person, see the retry in the header, above the form on `/login`, and on a gated page, start the backend and press retry, verifies **AC-8**, **AC-11**.
- Header: on a listing page the guest buttons carry `?next=`, on `/` and `/login` they do not, verifies **AC-13**.
- Keyboard and screen reader: Tab through both forms, arrow keys on the cards, show and hide the password, announced errors, 320 px, and the page source shows `method="post"` and `novalidate` on both forms, verifies **AC-15**.
- Metadata and cleanup: page source shows the titles and `noindex`, `/dev/session` is a 404 in every mode (the page is gone), `npm run check` and `npm run build` pass, verifies **AC-16**, **AC-17**.
- Permission: a seeker does not see a control wrapped in `Can` for a landlord permission, verifies **AC-14**.

## Build plan

Tracer Bullet (your project default, tier Beta): the first thread is a real sign in against the real backend, then each milestone thickens it. Each milestone is one `/develop` pass. No Figma step: layout comes from `design.md` and the sample screens, decided by `/develop`.

**M1. Thin thread: real sign in**
1. Add `src/lib/next-path.ts` (`safeNextPath`, `afterAuthPath`, `authHref`), `PasswordInput` in `src/components/form/`, and `loginSchema`, satisfies **AC-2**, **AC-7**, **AC-15**
2. Add `LoginForm`, `useAuthRedirect`, and the `/login` page with the `<Suspense>` skeleton and metadata, and the retry notice for `guest('unavailable')`. Run it against the backend: sign in as a seeded landlord, see the menu, reload, sign out, satisfies **AC-1**, **AC-2**, **AC-7**, **AC-8**, **AC-16**

**M2. Sign up**
3. Add `registerSchema` (light checks), `AccountTypeChoice`, `RegisterForm`, the `/register` page, the links between the two pages that keep `next`, and make `applyFieldErrors` focus in the order of the `fields` list, satisfies **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-13**, **AC-15**, **AC-16**

**M3. Gate and session states**
4. Add `RequireSession` and `EndedNotice`, and an optional `message` prop on `ErrorState`. Mount the gate outside the shell in the `(landlord)` and `(admin)` layouts, with the transition table above, and add the two dev only `dev-check` fixture pages, satisfies **AC-9**, **AC-10**, **AC-11**
5. Add the unavailable view with retry to `AccountMenuView` (bar and phone sheet) and to the `/dev/ui` account section, the sign out toast (without awaiting `signOut()`), and `next` on the header guest links, built in a small `<Suspense>` leaf, satisfies **AC-11**, **AC-12**, **AC-13**

**M4. Permission helper and cleanup**
6. Add `Can` and a short example on `/dev/ui`, satisfies **AC-14**
7. Delete `src/app/dev/session/`, `SessionDebug`, `useSessionDebug` and the `debug` hook. Remove their mentions from `src/app/dev/AGENTS.md` and `src/lib/AGENTS.md`. Add the "Amended by 0005" notes listed below to specs 0002 and 0003, satisfies **AC-17**

**M5. Gates**
8. Run `npm run check` and `npm run build`, check the console on `/login` and `/register`, then `/check verify` with the backend running (and `ACCESS_TTL_SECONDS=60` for the lost session case), then `/test` for `safeNextPath`, the schemas and the gate transitions (tier Beta), satisfies **AC-1**, **AC-17**

Every AC appears in at least one task and every task names an AC.

### Amendments to earlier specs

| Where | Was | Now |
|---|---|---|
| Spec 0002: the lab page, `SessionDebug`, `useSessionDebug`, `session.debug`, the early refresh margin switch, the lab based test scenarios | A dev only page and hook | Removed. The session stays testable with a fake `fetch` and `now` (`createSession` takes them) |
| Spec 0002 Follow-up: "remove `dev` from the reserved names" | Remove it with the lab | Not done: `dev` stays reserved because `/dev/ui` stays |
| Spec 0003: the scope row and Follow-up for #5, and the scenarios that sign in on `/dev/session` | Left to #5 | Done here. Those scenarios sign in on `/login` |
| Spec 0003: "`guest('unavailable')` is shown as a guest until #5" and "Đăng nhập and Đăng ký point to pages that do not exist" | A stand in | The account area shows the retry state, and both pages exist |
| Spec 0003: `ErrorState` takes an `error` and always shows `describeError(error).message` | One source for the text | Gains an optional `message` prop that replaces it, for a state that has no error object |
| Spec 0002 AC-8 and spec 0003 AC-6: `applyFieldErrors` focuses the first field with a message | In the order the backend sent the errors | In the order of its `fields` list, which is screen order |

## Consequences

**Positive**:
- Later features get a tested sign in, sign up, gate and `Can`, so none of them writes its own access check.
- The landing rule is one pure function, so landing by account type later is one edit.
- The code is a little smaller after the lab and its debug hook are gone.

**Negative / tradeoffs**:
- The gate is client side. A guest sees `LoadingState` for a moment and then a redirect. No content leaks, but there is no server redirect (the server never sees the refresh cookie, spec 0001).
- `Can` only hides. A person is not told why a control is missing. The reasons that matter (quota, trial) are not permissions and get their own notices in #17.
- Spec 0002's `verify.md` has steps that use the lab. They can no longer run, and `/test` should cover `createSession` with a fake `fetch` instead.
- Without the debug hook, reaching the 401 retry path by hand means waiting out `ACCESS_TTL_SECONDS=60`.
- Until #27, a person who forgot the password has no link to recover it.
- The account type cannot change after sign up, so a wrong pick means a new account with another email (the backend rule).
- Everyone lands on `/` after signing in until #12 and #20 add their areas.
- Two tabs can swap accounts. If tab B is still a guest on `/login` while tab A signs in, and B then signs in as someone else, the shared `rt` cookie changes and tab A keeps showing its old user while its next refresh returns the new one. This is a hole in the session layer (spec 0002) that this feature makes reachable. It is recorded here and fixed in the session layer, not in this feature.
- The two `dev-check` fixture pages are extra dev only code that #12 and #20 may delete once real gated pages exist.

**Neutral**:
- `src/features/auth` is the first folder under `src/features`.
- The sample sign in screen at `/dev/ui/screens/sign-in` stays as a design reference.
- No new dependency, environment variable or data.

## Follow-up

- [ ] Item #27 adds the "Quên mật khẩu?" link to `/login` (one line) in the same change that ships its page.
- [ ] Item #28 adds the "Tài khoản" link to `ACCOUNT_LINKS.all` and wraps `/account` in `RequireSession`. Item #14 does the same for `/favorites`.
- [ ] Items #12 and #20 may change `afterAuthPath` to land a landlord or admin in their area.
- [ ] Item #17 decides how quota and trial limits are shown, because `Can` never disables.
- [ ] Harden the session layer (an update to spec 0002): after a refresh, call `GET /auth/me` and compare `user.id` with the user on screen, and reload or end the session if it changed, so one tab cannot show a person while the cookie belongs to another.
- [ ] Items #12 and #20 delete the `dev-check` fixture pages when they ship a real gated page.
- [ ] `/test sign up and sign in` (tier Beta): `safeNextPath` cases, the Zod schemas, the gate transitions, and `createSession` with a fake `fetch`.
- [ ] Root `AGENTS.md` `## Rules`: add "access checks use `RequireSession` and `Can`, never a hand written role check" (`/sync`).
- [ ] The `verify.md` of spec 0002 has lab steps that stop being runnable. `/check verify` rereads it when it next runs.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
