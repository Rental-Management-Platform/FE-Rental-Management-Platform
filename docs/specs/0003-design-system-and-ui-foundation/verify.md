# Verify: design system and UI foundation · spec 0003 · updated 2026-10-24

_Steps derived from spec 0003 acceptance criteria and its Value sourcing table. `/check verify` runs these; `/test` locks the durable ones. The tag in square brackets is the milestone after which the step can run. Steps tagged M1 were self checked during the M1 build (headless Edge, Chrome DevTools Protocol, `npm run build`), and steps tagged M2 during the M2 build (agent-browser on `next dev`, `npm run build`), but all are left open here for an independent run. The M2 Figma frames were not reviewed by the engineer (that gate was skipped), so a review in Figma is still open. The Figma steps need the Figma MCP. Run the app with `npm run dev` (port 5173)._

## UI / manual

- [ ] [M1] Open the Figma file `cdrAcD1PywM8IWdVRt7X0o`, page Foundations → a `Foundations/Tokens` frame exists with one swatch per variable of the `Tokens` collection (one flat mode named `Light`, 36 variables, names equal to the CSS token names) → AC-1
- [ ] [M1] In `design.md`, section `Approvals` → one dated line for each gate passed so far (M1 is dated 2026-10-23) → AC-1, AC-12
- [ ] [M1] Open `/` at 1280 wide, then at 390 wide, and compare with the Figma frames `Shells/Public/Header 1280` and `Header 390` → brand mark and name, active "Tìm trọ" chip, "Đăng nhập" (ghost) and "Đăng ký" (teal) at 1280; brand only at 390 until M4; header 64 px high with a 1 px `border` line → AC-1, AC-8
- [ ] [M1] Open `/dev/ui` at 320 wide → the line "Nguyễn Thị Hồng Nhung, đường Lê Văn Việt, phường Hiệp Phú" shows every diacritic whole at heading size and body size, with no clipped mark and no horizontal page scroll → AC-3
- [ ] [M1] On `/`, view the page source (scripts off) → `<html lang="vi">`, title "Rental Management Platform", description "Nền tảng đăng tin và tìm nhà trọ", a `link rel="icon"` that points to `icon.svg` → AC-3
- [ ] [M1] In browser devtools, emulate a dark system (`prefers-color-scheme: dark`) and reload `/` and `/dev/ui` → both pages stay light; scrollbars and native controls stay light → AC-4
- [ ] [M1] `/dev/ui` shows the Button in every variant (`default`, `secondary`, `outline`, `ghost`, `destructive`), sizes `sm` 32 px, `default` 40 px, `lg` 44 px, icon sizes, and the disabled state → AC-5, AC-11
- [ ] [M1] Press Tab on `/` → focus moves brand, "Tìm trọ", "Đăng nhập", "Đăng ký", each with a 2 px teal ring and a 2 px gap; with forced colors emulated the focus shows as a solid 2 px outline → AC-10
- [ ] [M1] Emulate reduced motion on `/dev/ui` → the transition duration of a button is 0.01 ms (`1e-05s`), not `none`; without it the duration is 0.15 s → AC-10
- [ ] [M2] On `/dev/ui`, the demo form with a fake 400 (two fields), a 409 `EMAIL_TAKEN` and a 429 with 15 minutes → each message sits under its own input with `data-invalid`, `aria-invalid` and `aria-describedby`; focus lands on the first field with a server error; the 429 shows a counting down wait and disables submit → AC-6
- [ ] [M2] On `/dev/ui`, the six shared states side by side → all Vietnamese; `ErrorState` with status 500 shows "Mã hỗ trợ: ..." and with 404 does not; the retry button works → AC-7
- [ ] [M2] On `/dev/ui`, click "400 · hai ô lỗi" → focus is on the Email input at once, and only on it; both inputs have `aria-invalid="true"` and their own `aria-describedby` → AC-6
- [ ] [M2] On `/dev/ui`, click "400 · ô lạ (thông báo chung)" → the message about `phone` shows in a destructive alert above the submit button and no input is marked invalid, so the message is not lost → AC-6
- [ ] [M2] On `/dev/ui`, click "429 · chờ 10 giây" → a warning notice counts down on screen (10, 9, ...), the submit button is disabled; at 0 the notice reads "Bạn có thể thử lại ngay." and the button works again. The visually hidden sentence (`.sr-only`) changes only at the start and at the end, so a screen reader is not read a number every second → AC-6, AC-7
- [ ] [M2] On `/dev/ui`, click "500 · có mã hỗ trợ" → a destructive alert with "Mã hỗ trợ: 7f3a2c91-4b1e"; the 404 `ErrorState` on the same page shows no code although it holds the same `requestId` → AC-7
- [ ] [M2] On `/dev/ui`, open the Select with the mouse, then with Enter and the arrow keys → the list opens under the trigger at the same width with three rows of 40 px, the first row tinted, Esc closes it and focus returns to the trigger → AC-5, AC-10
- [ ] [M2] On `/dev/ui`, press Tab through the controls → Input, Textarea, Select, Checkbox, Radio and Switch each show a 2 px teal ring with a 2 px white gap; an invalid input keeps its red border while focused → AC-10
- [ ] [M2] On `/dev/ui`, press each toast button, then emulate a dark system and press again → the toast opens at the top center, 356 px wide, light, with its icon in the token color and a 14 px title → AC-4, AC-5
- [ ] [M2] Compare the Figma sets (Components page, and the `States /` sections on Screens) with `/dev/ui` → same sizes, colors and copy. The engineer has not reviewed these frames yet → AC-1, AC-5
- [ ] [M2] Open `/dev/ui` at 320 and 390 px wide → no horizontal scroll, the demo form and the shared states fit → AC-5, AC-7
- [ ] [M2] On `/dev/session`, send one wrong sign in → the form shows the server message in the new destructive `FailureNotice`, so the move of `useFormFailure` did not break the session lab → AC-6
- [ ] [M3] On `/dev/ui`, open a dialog, an alert dialog and a sheet with the keyboard → focus is trapped, Esc closes, focus returns to the trigger; with reduced motion emulated they still open and close → AC-10
- [ ] [M4] Sign in on `/dev/session`, reload `/` → the account area shows a fixed size skeleton, then the user menu with name or email, the role links and "Đăng xuất"; "Đăng xuất" returns it to guest → AC-8
- [ ] [M4] Open `/dev/ui/shells/public`, `/dev/ui/shells/auth` and `/dev/ui/shells/workspace` → each has one `main`, a skip link that moves focus to it, the public menu button measures 44 by 44 px and opens a sheet with the nav links and account actions → AC-8, AC-10, AC-11
- [ ] [M4] Open an unknown URL such as `/khong-co` → the "Không tìm thấy trang" state shows inside the public header → AC-7
- [ ] [M5] The Figma file holds the seven sample screens at the sizes in AC-14, plus empty, loading, error and rate limited frames for the list and the users table, each approval dated in `design.md` → AC-14
- [ ] [M6] Keyboard pass on `/dev/ui`: Tab order, focus ring, Esc, arrow keys in menus and tabs → AC-10

## Commands

- [ ] [M1] `npm run check` → lint, typecheck and format check all pass → AC-13
- [ ] [M1] `npm run build` → passes with no "uncached data outside Suspense" error; `/` is listed as static → AC-9, AC-13
- [ ] [M1] `npm run build && npm run start`, then `curl -s -o /dev/null -w "%{http_code}" localhost:5173/dev/ui`, the same for `/dev/ui/anything` and `/dev/session` → 404 for all three, and 200 for `/` → AC-11
- [ ] [M1] `curl -s localhost:5173/` and read the HTML → it holds the brand, the "Tìm trọ" link and the "Đăng nhập" link with scripts off, and exactly one `<main` → AC-8, AC-9
- [ ] [M1] `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|\b(bg|text|border|ring|fill|stroke|outline|divide|from|via|to|accent|caret|decoration|shadow|placeholder)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-[0-9]+)?(/[0-9]+)?\b" src --include="*.ts" --include="*.tsx" --exclude=globals.css` → prints nothing → AC-2
- [ ] [M1] Read the `Foundations/Tokens` frame with `get_variable_defs` and compare every name and value with `src/app/globals.css` (colors as hex, radius 8 px = 0.5rem) → no difference → AC-2
- [ ] [M1] `grep -nE "prefers-color-scheme|\.dark|chart-" src/app/globals.css` → nothing; `grep -n "color-scheme: light" src/app/globals.css` → one match; `@custom-variant dark` is still there → AC-4
- [ ] [M1] `grep -rnE "Previous|Next|More pages|Close|Toggle Sidebar|Loading" src/components/ui` → prints nothing; `grep -rn "dark:" src/components/ui` → prints nothing → AC-5
- [ ] [M2] `ls src/app/dev/session/form-failure.tsx` → no such file, and `grep -rn "from \"./form-failure\"" src` → prints nothing, so the lab uses `src/components/form/failure-notice.tsx` and `src/lib/forms/use-form-failure.ts` → AC-6
- [ ] [M2] `grep -rnE "ring-3|ring-ring/50|ring-\[3px\]|bg-black/50" src/components` → prints nothing (no half transparent focus ring) → AC-10
- [ ] [M2] `grep -n "next-themes" package.json` → prints nothing; `grep -n "position=\"top-center\"\|theme=\"light\"" src/components/ui/sonner.tsx` → both found → AC-4
- [ ] [M6] Change `--primary` to a pale teal, run `npm run check` → it fails and names the failing pair; revert → passes → AC-10
- [ ] [M6] Open `/` and `/dev/ui` with the browser console open → no hydration warning and no console error → AC-13
- [ ] [M6] Spec 0001 follow up item about the Vietnamese font, `lang` and title is ticked → AC-13

## Value sourcing (one step per row of the spec table)

- [ ] [M1] Site name: change `SITE_NAME` in `src/lib/site.ts` → the header brand and the default `<title>` change with it → AC-3, AC-8
- [ ] [M1] Title template: give a child page `title: "Tìm trọ"` → the tab reads "Tìm trọ | Rental Management Platform"; the description is the `SITE_DESCRIPTION` text → AC-3
- [ ] [M1] `<html>` language: view source on `/`, `/dev/ui` and an unknown URL → `lang="vi"` on all, never the system or browser language → AC-3
- [ ] [M1] Brand mark and `icon.svg`: open `/icon.svg` → a white house on a `#0F766E` rounded square, the same shape as the header mark → AC-8
- [ ] [M1] Colors, radius and type: change a variable in Figma, read it again with `get_variable_defs` → the diff against `globals.css` names the changed token → AC-2
- [ ] [M1] Body font: `getComputedStyle(document.body).fontFamily` → starts with "Be Vietnam Pro" then its size adjusted fallback; `document.fonts` lists weights 400, 500, 600, 700 in the `vietnamese` and `latin` subsets → AC-3
- [ ] [M1] Nav active link: on `/` the "Tìm trọ" link has `aria-current="page"` (server HTML also holds the link without it inside the `<Suspense>` fallback) → AC-8, AC-9
- [ ] [M2] Form field error id: two `FormField`s on one page → the `aria-describedby` ids are different and each points at its own message → AC-6
- [ ] [M2] `ErrorState` message and support code: feed `describeError` a 500 with `requestId` and a 404 → code only for the 500; the message is the Vietnamese one from `describeError` → AC-7
- [ ] [M2] `RateLimitNotice`: a 429 with `retryAfterExact` false, then true → "khoảng" appears only for the inexact one; the seconds count down → AC-6, AC-7
- [ ] [M2] `ImagePlaceholder`: a listing with `coverImageUrl` null → the neutral box with a house icon; with a URL → the photo → AC-7
- [ ] [M4] Account name and letters: a user with a name, then one without → name or else email in the menu; the avatar letter is the first letter of that text → AC-8
- [ ] [M4] Account links: sign in as tenant, landlord and admin → `ACCOUNT_LINKS.all` plus the list of that account type; items stay hidden until their page exists → AC-8
- [ ] [M4] Nav items: `PUBLIC_NAV`, `LANDLORD_NAV`, `ADMIN_NAV` hold only links to pages that exist (plus `/login` and `/register`) → AC-8
- [ ] [M6] Contrast script: thresholds 4.5:1 for text pairs and 3:1 for control borders and focus rings, token values read from `globals.css` → AC-10

## Acceptance-criteria coverage

- AC-1 covered by the Figma tokens step, the Approvals step, the header comparison step · AC-2 by the grep step and the `get_variable_defs` step · AC-3 by the 320 px line step, the page source step, the font step, the title template step · AC-4 by the dark system step and the grep step · AC-5 by the Button matrix step and the English strings grep · AC-6 by the demo form step, the field id step, the rate limit step · AC-7 by the shared states step, the unknown URL step, the error and placeholder value steps · AC-8 by the header comparison step, the account area step, the shell previews step · AC-9 by the build step and the curl HTML step · AC-10 by the focus, reduced motion, dialog, keyboard pass and contrast failure steps · AC-11 by the Button matrix step, the shell previews step and the production 404 step · AC-12 by the Approvals step · AC-13 by `npm run check`, `npm run build`, the console step and the follow up step · AC-14 by the sample screens step
- Added after the M2 build: AC-4 also by the toast and `next-themes` steps · AC-5 also by the Select, toast, Figma comparison and 320 px steps · AC-6 also by the focus on first error, unplaced message, 429 countdown, session lab and `form-failure` steps · AC-7 also by the 500 code step and the 320 px step · AC-10 also by the Select, Tab ring and half transparent ring steps
