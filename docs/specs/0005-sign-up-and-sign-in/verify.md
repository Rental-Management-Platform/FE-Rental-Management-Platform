# Verify: sign up and sign in · spec 0005 · updated 2026-10-25

_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. Needs the backend running and seeded. For the lost session steps start the backend with `ACCESS_TTL_SECONDS=60`. Test accounts made by `/develop` on the local database: `claude.dev.landlord1@example.com`, `claude.dev.tenant1@example.com`, `claude.dev.tenant2@example.com`, all with the password `Passw0rd!dev1`._

## UI / manual

**Sign in**

- [ ] As a guest open `/login` and submit empty → "Nhập email của bạn." and "Nhập mật khẩu." show under their fields and focus is on the email → AC-2, AC-15
- [ ] Type `a@b` as the email and submit → "Email không đúng định dạng."; type a 255 character email → "Email tối đa 254 ký tự." → AC-2, AC-6
- [ ] Sign in with a wrong password → one message above the button, no input is marked invalid, both values are kept → AC-2
- [ ] Open `/login?next=%2Fdev%2Fui` and sign in as the landlord → the page replaces itself with `/dev/ui`, the header shows the account menu, the back button does not return to the form → AC-1, AC-7
- [ ] Reload `/dev/ui` → the session is still there; DevTools shows no token in `localStorage`, `sessionStorage` or any URL, and only the `has_session` hint cookie → AC-1
- [ ] While signed in open `/login?next=//evil.com`, then `/login?next=%2Flogin`, then `/login?next=%2Fa%5Cb` → each ends on `/` → AC-7
- [ ] While signed in open `/login` with a hard reload → the form skeleton shows, then the redirect, and the form never appears → AC-8
- [ ] Sign in as `lan.bui@demo.example.com` (locked, see `api-for-frontend.md`) → the backend text of `ACCOUNT_LOCKED` shows in the form level message, no input is marked → AC-2
- [ ] Twelve wrong sign ins in a row → `RateLimitNotice` with a countdown shows and the submit button is disabled until it ends → AC-2
- [ ] Stop the backend and press submit → the standard "Không kết nối được tới máy chủ" message shows and the form stays → AC-2

**Sign up**

- [ ] Open `/register` → two cards ("Người đăng bài", "Người tìm trọ"), none selected, no fields, and the line "Loại tài khoản không đổi được sau khi đăng ký." → AC-3
- [ ] Choose "Người đăng bài", submit empty → messages for email, password and phone, in screen order, and focus goes to the email → AC-3, AC-5, AC-6
- [ ] As a landlord type the phone `12345` → "Số điện thoại di động Việt Nam gồm 10 số, ví dụ 0912 345 678."; type `+84 388.123-457` → the message goes away → AC-6
- [ ] Switch the card to "Người tìm trọ" after a failed send → everything typed stays, the phone label becomes "Số điện thoại (không bắt buộc)", a blank phone has no message → AC-4
- [ ] Switch back to "Người đăng bài" with a blank phone after a failed send → "Người đăng bài cần có số điện thoại." shows; before any send it does not → AC-4
- [ ] Sign up as a landlord with name left blank and phone `0388 123 457` → lands on `/` with the account menu; the request body has no `name` and the phone exactly as typed → AC-3, AC-5
- [ ] Sign up with an email that exists → "Địa chỉ email này đã được sử dụng." under the email, focus on the email → AC-5
- [ ] Sign up as a landlord with a phone that exists → the backend text under the phone, focus on the phone → AC-5
- [ ] Sign up as a seeker with no phone → works, and a typed bad phone is refused with the same message as a landlord → AC-4, AC-6
- [ ] Sign up ten times in an hour → the eleventh shows `RateLimitNotice` and the button is disabled → AC-5
- [ ] The link "Đăng nhập" under the form keeps `next` when it is safe, and drops it when it is not → AC-13

**Gate and session states**

- [ ] As a guest open `/landlord/dev-check?a=1` → `router.replace` to `/login?next=%2Flandlord%2Fdev-check%3Fa%3D1` with no flash of the page, and after signing in as the landlord the page opens at `/landlord/dev-check?a=1` → AC-7, AC-9
- [ ] As a seeker open `/admin/dev-check` → `ForbiddenState` inside the auth frame, with the skip link, one `main`, one `h1` and no menu → AC-9
- [ ] As the landlord open `/landlord/dev-check` → the landlord shell and the fixture card show → AC-9
- [ ] On `/landlord/dev-check` revoke the session from elsewhere (`POST /auth/logout-all` with another login of the same account), wait 40 seconds, press "Kiểm tra phiên" → the page goes to `/login?next=...` and shows "Phiên đăng nhập đã bị đóng ở nơi khác hoặc bởi quản trị viên. Hãy đăng nhập lại." → AC-10
- [ ] Sign in, revoke the session elsewhere, reload `/landlord/dev-check` → `loading`, then `/login?next=...` with the same message → AC-10
- [ ] Let the refresh session expire on the backend (wait out its lifetime, or ask whoever runs the backend to shorten it) and reload → "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại." → AC-10
- [ ] Lock the account from the admin and reload a gated page → "Tài khoản của bạn đã bị khóa. Hãy liên hệ quản trị viên." → AC-10
- [ ] Block `**/auth/refresh` in the browser (or stop the backend), reload as a signed in person → the header (bar and phone sheet) shows "Không kiểm tra được tài khoản" with "Thử lại"; `/login` shows the form with the notice above; `/landlord/dev-check` shows `ErrorState` with the message "Hệ thống chưa trả lời. Bạn có thể vẫn đang đăng nhập, hãy thử lại." → AC-8, AC-11
- [ ] Unblock, press "Thử lại" → `loading`, then the state settles to the signed in view and a gated page opens → AC-11
- [ ] On `/khong-co-trang` (public) choose "Đăng xuất" → the toast "Đã đăng xuất" shows at once, the page stays, the header shows the guest buttons → AC-12
- [ ] On `/landlord/dev-check` choose "Đăng xuất" → toast, and the page goes to `/` → AC-10, AC-12
- [ ] Sign out on a public page, then press the browser back button to the gated page → it counts as an arrival and goes to `/login?next=...`, not to `/` → AC-10
- [ ] On `/khong-co-trang` the guest buttons link to `/login?next=%2Fkhong-co-trang` and `/register?next=%2Fkhong-co-trang`; on `/`, `/login` and `/register` they have no `next` → AC-13

**Accessibility, permission, metadata**

- [ ] Tab through `/login` and `/register`: every input has a visible label, the focus ring is visible, the show and hide button is at least 44 px with `aria-pressed` and the names "Hiện mật khẩu" and "Ẩn mật khẩu" → AC-15
- [ ] On `/register` the arrow keys move between the two cards and Space chooses one; the group has the name "Loại tài khoản" → AC-15
- [ ] In the DOM: email has `autocomplete="username"`, sign in password `current-password`, sign up password `new-password`, phone `inputmode="tel"` and `autocomplete="tel"`, both forms have `novalidate` and `method="post"` → AC-15
- [ ] While submitting, the button is disabled with a spinner and `aria-busy`; a second click sends nothing (check the Network tab) → AC-15
- [ ] Both pages work at 320 px with no sideways scroll, and each has one `h1` → AC-15
- [ ] View source of `/login` and `/register` → titles "Đăng nhập | ..." and "Đăng ký | ..." and `<meta name="robots" content="noindex, nofollow"/>` → AC-16
- [ ] On `/dev/ui` section "Quyền (Can)": signed in as a seeker the "Đăng tin" button is absent and "Lưu tin" shows; as a landlord the reverse; as a guest both show the fallback text; none is ever disabled → AC-14
- [ ] `/dev/ui` shows the "không kiểm tra được" account view beside loading, guest and user → AC-11, AC-17
- [ ] No page renders a "Quên mật khẩu?" link or any link to a page that does not exist → AC-17

## Commands

- [ ] `npm run check` → exit 0 → AC-17
- [ ] `npm run build` (backend running) → exit 0, no hydration warning in the output → AC-17
- [ ] `npm run start`, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/dev/session` → `404` → AC-17
- [ ] `grep -rn "SessionDebug\|useSessionDebug\|session-lab" src` → prints nothing → AC-17
- [ ] With `npm run start` open `/login` and `/register` in a fresh browser profile → the console shows no error and no hydration warning → AC-17

## Acceptance-criteria coverage

- AC-1 · sign in, reload, no token in storage · AC-2 · sign in errors and light checks · AC-3 · landlord sign up · AC-4 · seeker sign up and card switch · AC-5 · sign up errors, focus order, body · AC-6 · light checks · AC-7 · landing path and unsafe `next` · AC-8 · auth page states and retry · AC-9 · gate, wrong type, fixtures · AC-10 · lost session, sign out, back button · AC-11 · unavailable views and retry · AC-12 · sign out and toast · AC-13 · header and page links with `next` · AC-14 · `Can` · AC-15 · accessibility baseline · AC-16 · metadata · AC-17 · cleanup, check, build, console
- Value sourcing rows: landing path (`next` accepted or `/`) · gate `next` (path and query read in the effect) · header `next` (path only, none on `/` and auth pages) · login reason text · `accountType` from the card · `name` and `phone` omitted when blank · phone required only for a landlord · field messages from `fieldErrors` and Zod · form message and support code for a 5xx · 429 wait · unavailable text from `endedReason` · sign out toast · gate pass from `user.accountType` · `Can` from `permissions` · titles
