# 0003. Design system and UI foundation for the web frontend

**Date**: 2026-10-23
**Status**: In Progress

## Summary

The first two milestones (M1 and M2) draw the design tokens (named values for color, text, spacing and corner radius), the button, the form controls and the shared states in Figma, then copy them into code with a set of ready made components from shadcn/ui (copy in components built on Radix, a library of accessible parts). From M3 on there is no more Figma: everything is built directly in code on that design system, and `/develop` decides the layout of each screen. The Figma file stays as a frozen reference. The look is a deep teal on white, in the Be Vietnam Pro font (amended by [0004](../0004-type-and-layout-refinement/index.md): now Inter), light mode only. Four page frames (public, sign in, landlord, admin) wrap every later page, and shared empty, loading, error, rate limit, not found and forbidden states keep screens consistent. A color contrast check inside `npm run check` keeps text readable at WCAG AA (the accessibility level this project targets), and a development only page, `/dev/ui`, shows everything for review, with seven sample screens built in code at `/dev/ui/screens`.

## Requirements

Seeded from the scope row for #4 and refined with the engineer. Contract for the data and sessions: spec 0001 (stack, routes, shells) and spec 0002 (session hooks, `describeError`, `formatWait`, `useCountdown`).

**User stories**:
- As the developer of a later feature, I want tokens, base components, page frames and shared states ready, so that I never invent a look or solve accessibility a second time.
- As a visitor on a phone, I want pages that read well in Vietnamese with every diacritic (accent mark) intact and controls that are easy to tap.
- As a landlord or admin on a computer, I want a steady workspace (side menu, top bar) that I can scan quickly.
- As the engineer, I want the tokens and base components of M1 and M2 approved in Figma before their code (or a skipped gate on record), and from M3 on to see new components and screens built directly in code on that system, with no Figma step.
- As someone using a keyboard or a screen reader, I want visible focus, labels, and announcements for changes.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: Figma is the source for M1 and M2 only. The file `cdrAcD1PywM8IWdVRt7X0o` holds a `Foundations/Tokens` frame with one swatch bound to each variable (one flat mode named `Light`, variable names equal to the CSS token names), the M1 and M2 base components bound to those variables (button, form controls, `Field`, `Alert`, `Badge`, `Skeleton`, `Spinner`, `Separator`, toast, the shared states), and the public header frame at 390 and 1280. The engineer approves the gate of M1 and the gate of M2 (build plan steps 1 and 5) before the matching code is written, or skips a gate and says so, and each outcome is recorded as a dated line in the `Approvals` section of `design.md`. From M3 on there is no Figma frame and no gate: components, shells and screens are built directly in code on the existing tokens and components, and the layout of each screen is decided by `/develop`. The Figma file is not updated for M3 and later work.
- **AC-2**: Tokens match Figma, for the tokens that existed at the end of M2. Every variable in the Figma `Tokens` collection (read from the `Foundations/Tokens` frame with `get_variable_defs`) has a token in `src/app/globals.css` with the same name and value; colors are compared as hex and radius as px (rem times 16). The check runs in that one direction only: a token added from M3 on lives in `globals.css` alone, needs no Figma variable, and gets its contrast pair in the script of AC-10. No raw color appears in the code: `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(|\b(bg|text|border|ring|fill|stroke|outline|divide|from|via|to|accent|caret|decoration|shadow|placeholder)-(white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(-[0-9]+)?(/[0-9]+)?\b" src --include="*.ts" --include="*.tsx" --exclude=globals.css` prints nothing. The search covers all of `src` because `src/features` does not exist yet. Amended by [0004](../0004-type-and-layout-refinement/index.md): the `font` variable is left out of the comparison, and the `Foundations/Type` text styles are not compared.
- **AC-3**: Vietnamese text is correct. The root layout has `lang="vi"`, a Vietnamese description and a title template. Be Vietnam Pro loads through `next/font/google` with the `vietnamese` and `latin` subsets, and the Geist fonts are gone. Amended by [0004](../0004-type-and-layout-refinement/index.md): the font is Inter, a variable font with weights 400 to 600 and the same subsets; the test line and the `lang` rules stay. On `/`, the `<html>` tag has `lang="vi"`, the title is the site name and the description is the Vietnamese constant. On `/dev/ui` at 320 px wide, the line "Nguyễn Thị Hồng Nhung, đường Lê Văn Việt, phường Hiệp Phú" shows with no missing glyph and no clipped mark at heading and body sizes.
- **AC-4**: Light only. No `prefers-color-scheme` rule remains in the CSS, no `.dark` block and no `chart-*` token remains, and `color-scheme: light` is set on the root. The `@custom-variant dark` line stays, keyed to a class that is never set, so the `dark:` classes inside generated files stay off (their default would follow the system). With the browser emulating a dark system the pages stay light. Token names are semantic (`background`, `primary`), so dark mode can be added later with one more set of values.
- **AC-5**: Base components exist and are consistent. The components listed under "Components" are in `src/components/ui`, styled only through tokens, and `/dev/ui` shows each with its variants, sizes, disabled state and invalid state. A search of `src/components/ui` for the English labels the generator ships (`Previous`, `Next`, `More pages`, `Close`, `Toggle Sidebar`, `Loading`) finds none: every visible and `sr-only` string is Vietnamese.
- **AC-6**: Forms show server errors. A form built with the `FormField` wrapper (shadcn `Field` plus React Hook Form, ids from `useId`) shows each `fieldErrors` message under its own input with `data-invalid`, `aria-invalid` and an `aria-describedby` that points at it, moves focus to the first input that got a server error, shows a form level message for the rest, and shows a rate limit notice with a counting down wait that disables the submit button. The `/dev/ui` demo form proves it with fake `ApiError` objects.
- **AC-7**: Shared states. `EmptyState`, `LoadingState`, `ErrorState`, `RateLimitNotice`, `NotFoundState` and `ForbiddenState` exist, are in Vietnamese, and appear side by side on `/dev/ui`. `ErrorState` shows the support code (`requestId`) only for a 5xx answer and has a retry button. Each route group has an `error.tsx` and a `not-found.tsx` that use them, and so does the root. `global-error.tsx` has its own `<html lang="vi">` and imports `globals.css`, and the root `not-found` renders inside the public shell, so an unknown URL still shows a header.
- **AC-8**: Four shells. The `(public)`, `(auth)`, `(landlord)` and `(admin)` layouts wrap their pages in their shell. Public: a header (brand, nav links, account area), below `md` a menu button opening a sheet that holds the nav links and the account actions, a footer, a skip link. Auth: a minimal centered frame. Landlord and admin: a collapsible side menu and a top bar with the account menu, the side menu becoming a sheet below `lg`. The account area shows a fixed size skeleton while the session is `loading`, "Đăng nhập" and "Đăng ký" for a `guest`, and for a `user` a menu with name (or email), the links from `ACCOUNT_LINKS` (role links and "Tài khoản", each added by the feature that ships its page) and "Đăng xuất". Links to pages that do not exist yet are not rendered, with two named exceptions: `/login` and `/register`, which #5 (the next item) builds.
- **AC-9**: The shell stays static. The server HTML of every public route already contains the brand, nav links and footer with scripts off (the `<Suspense>` fallback of the active link leaf holds the same links without `aria-current`), `npm run build` shows no "uncached data outside Suspense" error, and no shell layout calls `cookies()` or `headers()`.
- **AC-10**: Accessibility baseline (WCAG AA). `npm run check` runs a contrast script that fails when any text and background token pair is under 4.5:1, or any control border, icon or focus ring pair is under 3:1. Every interactive component shows a visible focus ring from the keyboard. Dialog, alert dialog and sheet trap focus, close on Esc and return focus to the trigger. Public pages use the `lg` control size (44 px high) at every width and the header menu button is 44 by 44 px; dense desktop rows are at least 32 px. Pages have header, nav, one `main` and footer landmarks and a skip link, and `prefers-reduced-motion` sets animation and transition durations to 0.01 ms (not `none`, which can leave Radix components stuck).
- **AC-11**: Development gallery. `/dev/ui` renders every component state, the type scale, the contrast pairs and the shared states (the account area in its loading, guest and user views), and `/dev/ui/shells/public`, `/dev/ui/shells/auth` and `/dev/ui/shells/workspace` preview the shells with sample content. `src/app/dev/layout.tsx` calls `notFound()` in a production build, so everything under `/dev` (`/dev/session` too) answers 404.
- **AC-12**: `design.md`. A `design.md` at the project root records the character (deep teal, trustworthy, friendly), a build mandate for later UI work, the Figma file and the frame names of M1 and M2 (a frozen reference), and points at `globals.css` for token values, so `/develop` builds new pages inside this system. The build mandate says what AC-1 says: from M3 on, build directly in code on the existing design system, with no Figma frame or gate, and the layout of each screen is decided by `/develop`. Its `Approvals` section lists the gate of M1 and the gate of M2 with a date each (approved, or skipped with the engineer's reason). No line is added after M2, because no gate exists after M2.
- **AC-13**: Clean build. `npm run check` and `npm run build` pass, with no hydration warning and no console error on `/` and `/dev/ui`, and the scaffold items in spec 0001's follow up (Vietnamese font subset, `lang`, Vietnamese title) are closed.
- **AC-14**: Sample screens, built in code. Seven sample screens run at `/dev/ui/screens`, each reachable from that page: listing list, listing detail, landlord "my listings", admin users table, sign in, pricing page, post listing form. They are built from the existing tokens, `src/components/ui`, the shared states and the shells, with fake data and no network call, and `/develop` decides the layout of each one. Public screens work at 390 and 1280 wide, landlord and admin screens at 1440, and none scrolls sideways at 320. The listing list and the users table can also be shown in their empty, loading, error and rate limited states. There is no Figma frame and no engineer gate for these screens. This is the one criterion that can be moved or dropped without touching AC-1 to AC-13.

## Decision

**Chosen option**: Option 1: Figma variables as the source of truth for M1 and M2, then code only; a CSS token layer in Tailwind 4, shadcn/ui (Radix base) components copied into the repo, and four shells built by us

The tokens, the button, the form controls and the shared states (M1 and M2) are drawn in Figma first, and their variables are copied into `globals.css`. From M3 on there is no Figma frame and no gate: `/develop` builds directly in code on the existing design system and decides the layout of each screen, and a token added from M3 on lives in `globals.css` alone. The Figma file stays as a frozen reference. shadcn/ui supplies accessible, restyled components; our own shells, shared states and a contrast gate keep every later page consistent.

**Implementation skills**: `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `react-hook-form` (`pproenca/dot-skills`, `.agents/skills/react-hook-form/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`).

## Feature design

**Data model and API surface**: none. This spec adds no database table, endpoint or stored data. The UI only reads what specs 0001 and 0002 already define (`useSession`, `describeError`, `formatWait`, `useCountdown`, `fieldErrors`), so the usual data model, state machine and API table do not apply; the design below is the surface.

### Scope of this spec

| In #4 | Left to another item |
|---|---|
| Figma variables and base components for M1 and M2 only; from M3 on, code only | Domain components in code: listing card (#8, #15, #14), stat card (#25, #26), plan card (#18). The cards on the sample screens are sample markup inside `src/app/dev/ui/screens/`, which those items may lift |
| Seven sample screens built in code at `/dev/ui/screens` with fake data | Real data fetching, routes and logic of those screens: sign in (#5), pricing page (#18), post listing form (#7) and the listing and admin screens of their own items |
| Tokens, Be Vietnam Pro, `lang="vi"`, metadata template, site icon | Charts (#26), map (#29), photo uploader (#10), date picker (#25) |
| shadcn base components, toast, state components, list pagination | Money, area and date formatting in `format.ts`: the first feature that shows a price |
| Four shells, account menu, nav configs, `error.tsx` and `not-found.tsx` per group | The route gate with `?next=`, real login and register pages, what to show for `guest('unavailable')`: #5 |
| Contrast script in `npm run check`, `design.md`, `/dev/ui` | Dark mode (scope Deferred), default share image (#9) |
| Moving `useFormFailure` and `FailureNotice` out of the session lab | Deleting `/dev/session`: #5 |

### Design source: Figma for M1 and M2, code from M3

- File `cdrAcD1PywM8IWdVRt7X0o` (the libraries Material 3 Design Kit and Simple Design System are attached). Figma through its MCP was the design source for M1 and M2 only, chosen by the engineer. From M3 on the engineer builds directly in code on the existing design system: no new Figma frame, no gate, and the file is not kept in step with later work. It stays as a frozen reference.
- What the file holds, as built in M1 and M2: the file is on the Starter plan (3 pages), so it has `Foundations` (the `Tokens` frame with one swatch bound to each variable, in one flat mode named `Light`, plus type, shape and spacing), `Components` (the M1 and M2 base components with their variants and states) and `Screens` (the public header at 390 and 1280, and sections named `States /` for the shared states and the server error forms). There is no `Shells` or `States` page and nothing for overlays, tables, shells or sample screens.
- The two kits were references for layout ideas only. Our own components were drawn on our variables, with variant names that match the shadcn props: `default`, `secondary`, `outline`, `ghost`, `destructive` and sizes `sm`, `default`, `lg`. From M3 on, the same names are used in code only.
- From M3 on, `/develop` decides the layout of each screen and shell from this spec, the scope text, the API contract and `design.md`, and the engineer reviews the result in the browser (and through `/check verify`), not on a drawing.

### Sample screens (AC-14)

Seven screens in code at `/dev/ui/screens`, with fake data. What each shows comes from the scope text and the API contract; how it is laid out is `/develop`'s call.

- Listing list: search field, listing cards (cover image, title, price, area, `fullAddress`), pagination. Also empty, loading, error and rate limited states.
- Listing detail: photo, title, price, area, address, property and landlord block, a "Đăng nhập để xem số điện thoại" button for guests.
- My listings (landlord): status filter, table of listings with labels for hidden by landlord, hidden by admin (with reason) and `visible` but not public, action buttons, delete confirmation.
- Admin users: search, filters by account type and status, table, lock and unlock dialog with a required reason. Also empty, loading, error and rate limited states.
- Sign in: email and password fields, field errors, rate limit notice.
- Pricing page: one card per plan (name, price, maximum listings, days per period) from the `GET /plans` shape, and a "Mua" button only for a signed in landlord; a guest is led to sign in; a seeker and an admin see no button (scope item #18).
- Post listing form: title, description, price, area, deposit, available from, with field errors. "Available from" is a plain date input, because the date picker waits for #25.

Sample data rules (decided here): the data is fixed objects in code under `src/app/dev/ui/screens/`, shaped like the answers in `api-for-frontend.md`, with no network call, so no backend is needed. Photos are not used: `coverImageUrl` is `null` in the sample data, so `ImagePlaceholder` shows. Prices, areas and dates use a small helper in that folder built on `Intl` with `vi-VN` and `Asia/Ho_Chi_Minh`, until the first item that shows a price adds `format.ts`, and then the screens switch to it.

### Tokens

Names follow shadcn/ui so its components work unchanged. The same names are used for Figma variables. The values below are the starting palette (WCAG ratios computed, all pass); for the tokens that existed at the end of M2, **Figma wins** and `globals.css` copies it (AC-2). A token added from M3 on is decided in `globals.css` only, and its contrast pair is added to the script in the same change.

| Token | Start value | Role | Pair checked |
|---|---|---|---|
| `background` / `foreground` | `#FFFFFF` / `#0F172A` | Page and text | 17.85:1 |
| `card` / `card-foreground`, `popover` / `popover-foreground` | `#FFFFFF` / `#0F172A` | Surfaces | same |
| `primary` / `primary-foreground` | `#0F766E` / `#FFFFFF` | Main actions, links | 5.47:1 |
| `secondary` / `secondary-foreground` | `#F0FDFA` / `#134E4A` | Quiet actions | 9.09:1 |
| `muted` / `muted-foreground` | `#F1F5F9` / `#475569` | Quiet areas, help text | 6.92:1 (on muted), 7.58:1 (on white) |
| `accent` / `accent-foreground` | `#CCFBF1` / `#134E4A` | Hover and selected rows | 8.41:1 |
| `destructive` / `destructive-foreground` | `#B91C1C` / `#FFFFFF` | Delete, lock, errors | 6.47:1 |
| `success` / `success-foreground` | `#15803D` / `#FFFFFF` | Done states | 5.02:1 |
| `warning` / `warning-foreground` | `#FEF3C7` / `#78350F` | Notices | 8.15:1 |
| `info` / `info-foreground` | `#1D4ED8` / `#FFFFFF` | Neutral notices | 6.70:1 |
| `border` | `#CBD5E1` | Decoration only (cards, dividers) | not required |
| `input` | `#64748B` | Border of form controls | 4.76:1 (needs 3:1) |
| `ring` | `#0F766E` | Focus ring | 5.47:1 on white, 5.00:1 on muted (needs 3:1) |
| `overlay` | `#0F172A80` (50% alpha) | Backdrop behind dialog, alert dialog and sheet | not text |
| `sidebar` / `sidebar-foreground` | `#F8FAFC` / `#0F172A` | Workspace side menu | 17.06:1 |
| `sidebar-primary` / `sidebar-primary-foreground` | `#0F766E` / `#FFFFFF` | Active item | 5.47:1 |
| `sidebar-accent` / `sidebar-accent-foreground` | `#CCFBF1` / `#134E4A` | Hovered or selected item | 8.41:1 |
| `sidebar-border`, `sidebar-ring` | `#CBD5E1`, `#0F766E` | Divider, focus ring | ring 5.23:1 on `sidebar` |

Other values, also decided here:
- **Font**: Be Vietnam Pro, weights 400, 500, 600, 700, subsets `vietnamese` and `latin`, CSS variable `--font-sans`. This font is not a variable font on Google Fonts, so weights are listed explicitly. Mono falls back to the system mono stack; Geist Mono is removed. Amended by [0004](../0004-type-and-layout-refinement/index.md): Inter, variable `--font-inter`, weights 400 to 600.
- **Type scale**: override Tailwind's `--text-xs` to `--text-4xl` in `@theme`, each with its line height (`--text-xs--line-height` and so on), as px / line height: `xs` 12/1.5, `sm` 14/1.5, `base` 16/1.6, `lg` 18/1.5, `xl` 20/1.4, `2xl` 24/1.35, `3xl` 30/1.3, `4xl` 36/1.25. Figma text styles carry the same names (`text-xs` to `text-4xl`). Roles: caption `xs`, small `sm`, body `base`, lead `lg`. Headings in the base styles: h1 `text-3xl md:text-4xl`, h2 `text-2xl md:text-3xl`, h3 `text-xl md:text-2xl`, h4 `text-lg md:text-xl`. Inputs are 16 px or more (stops iPhone zoom on focus). No all caps for sentences. Amended by [0004](../0004-type-and-layout-refinement/index.md): the scale, the heading sizes and the weights are replaced by the Type scale and weight tables there; inputs keep 16 px, now through `--text-input`.
- **Radius**: base `0.5rem` (8 px), cards `0.75rem`, pills full. **Spacing**: Tailwind 4 px grid. **Elevation**: two levels (`shadow-sm` for cards, `shadow-md` for menus and dialogs). Amended by [0004](../0004-type-and-layout-refinement/index.md): a zone card has no shadow.
- **Page background**: added by [0004](../0004-type-and-layout-refinement/index.md): the `canvas` token (`#F1F5F9`) in `globals.css` only, no Figma variable.
- **Control heights**: `sm` 32, `default` 40, `lg` 44 px. Public mobile primary actions and inputs use `lg`.
- **Breakpoints**: Tailwind defaults (`sm` 640, `md` 768, `lg` 1024, `xl` 1280). Public content width `max-w-6xl` with 16 px (phone) or 24 px side padding. Workspace content fills the space beside a 256 px side menu (64 px when collapsed).
- **Motion**: 150 ms transitions on color, shadow and opacity. A global `@media (prefers-reduced-motion: reduce)` rule sets `animation-duration` and `transition-duration` to 0.01 ms (not `none`, which can leave Radix presence logic waiting for an animation end that never comes).
- **Brand mark and icon**: a white lucide `House` shape on a `#0F766E` rounded square. The same mark sits next to `SITE_NAME` in the headers, and `src/app/icon.svg` is that mark.
- **Focus ring**: 2 px ring plus 2 px offset in `ring`, with a transparent outline under it so it still shows in forced colors mode.
- **shadcn setup**: `components.json` with `base: radix`, preset `vega` (classic geometry; our tokens override the look), `iconLibrary: lucide`, `tailwindCssFile: src/app/globals.css`, aliases `components: @/components`, `ui: @/components/ui`, `utils: @/lib/utils`, `lib: @/lib`, `hooks: @/hooks` (so `use-mobile` lands in `src/hooks`).

**Edits after adding shadcn files.** The generator's defaults do not meet this spec, so each file is edited once after `add`. These come from knowledge of the generated code; confirm each against the real file when adding it:
- **Dark**: keep `@custom-variant dark` keyed to a class that is never set; delete init's `.dark` block and its `chart-*` tokens; convert init's `oklch` values to the hex values above.
- **Focus ring**: replace half transparent rings such as `ring-[3px] ring-ring/50` by `ring-2 ring-ring ring-offset-2`. A half transparent teal on white is only 2.14:1, under the 3:1 the focus ring needs.
- **Colors**: dialog, alert dialog and sheet backdrops use the `overlay` token, not `bg-black/50`; the destructive button uses `text-destructive-foreground`, not `text-white`.
- **Sizes**: button, input and select use `sm` h-8, default h-10, `lg` h-11; `input` and `textarea` use `text-base` at every width (the generator uses a smaller size from `md` up).
- **Sidebar**: `SIDEBAR_WIDTH_ICON` is 4rem and the `use-mobile` breakpoint is 1024.
- **Sonner**: remove `next-themes`, and render `<Toaster theme="light" position="top-center" />`.
- **Words**: translate every English label: "Previous" to "Trang trước", "Next" to "Trang sau", "More pages" to "Thêm trang", "Close" to "Đóng", "Toggle Sidebar" to "Mở hoặc đóng menu", "More" to "Thêm", "Loading" to "Đang tải".

### Components

From shadcn/ui into `src/components/ui` (added one by one with the CLI, never `add --all`): `button`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `label`, `field`, `card`, `badge`, `alert`, `alert-dialog`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `table`, `pagination`, `skeleton`, `spinner`, `tooltip`, `avatar`, `separator`, `breadcrumb`, `empty`, `sidebar`, `sonner`. `badge` gets `success`, `warning` and `info` variants; a status is always shown with words (and optionally an icon), never by color alone.

Ours:

```
src/
  app/
    layout.tsx             lang vi, Be Vietnam Pro, title template, Providers + Toaster
    globals.css            tokens (:root and @theme inline), base styles; no dark media query
    icon.svg               site icon (replaces the default favicon.ico)
    not-found.tsx          root 404 (NotFoundState inside PublicShell)
    global-error.tsx       own <html lang="vi"> and <body>, imports globals.css, ErrorState
    (public)/ (auth)/ (landlord)/ (admin)/
      layout.tsx           the shell for the group
      error.tsx            ErrorState with a retry button
      not-found.tsx        NotFoundState
    dev/layout.tsx         notFound() in production (also covers /dev/session)
    dev/ui/                page.tsx + client parts
    dev/ui/shells/public|auth|workspace/page.tsx   shell previews
    dev/ui/screens/        index page plus the seven sample screens, fake data and the sample
                           format helper (AC-14); how the screens are split into files is /develop's call
  components/
    ui/                    shadcn components (generated, then edited)
    states/                empty-state, loading-state, error-state, rate-limit-notice,
                           not-found-state, forbidden-state, image-placeholder
    form/failure-notice.tsx   moved from the session lab, recomposed (see Shared states)
    form/form-field.tsx    React Hook Form Controller wrapper over shadcn Field (useId, aria)
    list-pagination.tsx    page links from { page, pageSize, total } with hrefFor or onPageChange
    shells/                public-shell, auth-shell, workspace-shell, account-menu (reads
                           the session), account-menu-view (takes the state), site-footer,
                           skip-link, nav-config.ts (PUBLIC_NAV, LANDLORD_NAV, ADMIN_NAV, ACCOUNT_LINKS)
  lib/
    utils.ts               cn()
    site.ts                SITE_NAME, SITE_DESCRIPTION
    forms/use-form-failure.ts   moved from the session lab
  hooks/use-mobile.ts      from the sidebar component
scripts/check-contrast.mjs   reads tokens from globals.css, fails npm run check
components.json
design.md
```

### Shells

- **Public** (`PublicShell`, server component): skip link, sticky header (brand linking to `/`, nav links from `PUBLIC_NAV`, account area), below `md` a 44 by 44 px menu button that opens a sheet holding the nav links and the account actions (the account area is not in the bar at that width, and the sheet closes when a link is clicked), `<main id="main" tabIndex={-1}>`, footer with the site name and the line "Dự án demo, thanh toán chỉ là thanh toán thử." The part that reads the current path (active link, `aria-current`) is a small client leaf inside `<Suspense>`; its fallback renders the same `<a>` links without `aria-current`, so the server HTML holds the links on every public route. Public pages use `size="lg"` controls at every width.
- **Auth** (`AuthShell`): brand on top linking home, one centered card up to `max-w-sm`, no nav, no footer.
- **Workspace** (`WorkspaceShell`, used by `(landlord)` and `(admin)` with `LANDLORD_NAV` or `ADMIN_NAV`): shadcn `Sidebar` (collapses to icons, a sheet below `lg`), top bar with the sidebar trigger and the account menu. The sidebar always starts expanded; its state is not read from a cookie on the server.
- **Account area** (`AccountMenu` reads the session and hands `state` to `AccountMenuView`, which only draws, so `/dev/ui` can show every state without a backend; a client leaf, and `useSession` never suspends because its server snapshot is `loading`, so it needs no `<Suspense>`): `loading` shows a 32 px skeleton; `guest` (also `guest('unavailable')` until #5 decides) shows the buttons "Đăng nhập" (`/login`) and "Đăng ký" (`/register`); `user` shows an avatar button opening a menu with the name and email, the links `ACCOUNT_LINKS.all` and `ACCOUNT_LINKS[accountType]`, and "Đăng xuất". Below `md` the same content is a list inside the menu sheet. "Đăng xuất" calls `signOut()` and does not navigate; the route gate of #5 moves guests off protected pages.
- **Nav configs** (`nav-config.ts`): arrays of `{ label, href, icon, permission? }`. An item with a `permission` shows only when `can(state, permission)` is true, so the list that renders the items is a client component (items without a `permission` need no session). Rule: a feature adds its item in the same change that ships its page. Today `PUBLIC_NAV` has only "Tìm trọ" (`/`), the other two are empty. `ACCOUNT_LINKS` is `{ all, tenant, landlord, admin }`, each an array of the same item shape and all empty today: #14 adds the tenant item "Tin đã lưu", #12 the landlord item "Khu chủ trọ", #20 the admin item "Quản trị", and #28 adds "Tài khoản" to `all`.

### Shared states

| Component | Props | Behavior |
|---|---|---|
| `EmptyState` | title, description, action? | Wraps shadcn `Empty`. Copy comes from the feature. |
| `LoadingState` | variant: `cards` or `table` or `form` | Skeleton presets; `aria-busy` and an `sr-only` "Đang tải". |
| `ErrorState` | error, onRetry | `describeError(error).message`, and `requestId` as "Mã hỗ trợ: ..." only when status is 500 or more; retry button. |
| `RateLimitNotice` | error | `formatWait(retryAfterSeconds, { approximate: !retryAfterExact })` with `useCountdown(error)`; `aria-live="polite"`; the owner disables its submit button while seconds are above 0. |
| `NotFoundState` | title?, backHref? | "Không tìm thấy trang" with a link back. |
| `ForbiddenState` | message? | "Bạn không có quyền truy cập" with a link home. |
| `ImagePlaceholder` | ratio | Neutral box with a house icon, for a listing with no photo. |

`FailureNotice` (moved from the lab) becomes a destructive `Alert` holding the form level message, plus `RateLimitNotice` when the error is a 429 and the support code under the `ErrorState` rule (5xx only). It repeats no countdown text and uses only tokens (`text-destructive`), not the lab's `text-red-700`. `useFormFailure` keeps its API.

### Accessibility rules

- Every input has a visible `FieldLabel` (or `sr-only` when the design shows none). shadcn's `Field` does not link an error to its control by itself, so `FormField` does: it makes the error element id with `useId`, sets `aria-describedby` and `aria-invalid` on the control and `data-invalid` on the field. After `applyFieldErrors` places server errors, the first of those fields gets focus (the call passes `shouldFocus: true` for it only).
- Dialogs, sheets and alert dialogs always have a title (`sr-only` if hidden). Icon only buttons have an `aria-label` in Vietnamese.
- Toasts (Sonner) are for short results ("Đã lưu"); anything the person must read and act on (quota, trial ended, test payment) is an `Alert` that stays on the page.
- Targets: 44 px on public controls at every width (`size="lg"`), 32 px minimum for dense desktop rows (WCAG 2.2 asks 24 px).
- Contrast script: reads the token values from `globals.css` and checks its own `PAIRS` array: foreground tokens on their surfaces (`foreground` on `background`, `card-foreground` on `card`, `popover-foreground` on `popover`); `muted-foreground` on `background`, `card`, `muted`, `secondary`, `accent` and `sidebar`; every `X-foreground` on `X` (`primary`, `secondary`, `accent`, `destructive`, `success`, `warning`, `info` and the three `sidebar` pairs), all at 4.5:1; `primary` as link text on `background`, `muted`, `secondary` and `accent`, and `destructive` as text on `background` and `muted`, at 4.5:1; `input` border on `background`, `card` and `muted`, and `ring` on `background`, `muted`, `accent` and `sidebar`, at 3:1. A new token pair must be added to `PAIRS` in the same change. The values in the Tokens table were computed with the same formula and all pass.
- Keyboard pass before `done`: Tab order, focus ring, Esc, arrow keys in menus and tabs.

### `/dev/ui`

A client page (the shadcn skill calls it the design system page) with sections: colors with their contrast pairs, type specimens including the Vietnamese line, every component state, the shared states side by side, a demo form with fake `ApiError` objects, toasts, and links to the three shell previews and to `/dev/ui/screens`. `src/app/dev/layout.tsx` calls `notFound()` when `process.env.NODE_ENV === 'production'`, so the whole `/dev` tree (the shell previews and the existing `/dev/session`, whose own `page.tsx` check stays) answers 404 in production. The shell previews use a local `SAMPLE_NAV`, because the real arrays are empty. The account area appears as `AccountMenuView` in its loading, guest and user views with fixed sample data. The name `dev` is already reserved (spec 0001). Unlike `/dev/session`, `/dev/ui` stays after #5.

### Value sourcing

| Where | Value displayed | Source |
|---|---|---|
| Header, footer, title | Site name | `SITE_NAME` in `src/lib/site.ts`, value "Rental Management Platform" (engineer's choice) |
| Metadata | Title template and description | `title: { default: SITE_NAME, template: "%s \| Rental Management Platform" }`; `SITE_DESCRIPTION` = "Nền tảng đăng tin và tìm nhà trọ" (decided here) |
| `<html>` | Language | Constant `vi` |
| Account area | Name | `useSession().user.name`, else `user.email` |
| Account area | Avatar letters | First letter of the name, else of the email |
| Account menu | Links | `ACCOUNT_LINKS.all` plus `ACCOUNT_LINKS[user.accountType]` (display only; what a person may do stays with `can()` and the backend) |
| Brand mark, `icon.svg` | Shape and color | A white lucide `House` on a `#0F766E` rounded square (decided here) |
| Form fields | Error element id | `useId()` inside `FormField` |
| Nav | Active link | `usePathname()` in a client leaf inside `<Suspense>` |
| Nav | Which items exist | The three arrays in `nav-config.ts` |
| Everything | Colors, radius, type | Tokens that existed at the end of M2: Figma variables, copied by `get_variable_defs` into `globals.css`. A token added from M3 on: decided in `globals.css` |
| Sample screens | Listing, user and plan rows | Fixed objects in `src/app/dev/ui/screens/`, shaped like `GET /listings`, `GET /me/listings`, `GET /users` and `GET /plans` in `api-for-frontend.md`; no network call |
| Sample screens | Cover photo | None: `coverImageUrl` is `null`, so `ImagePlaceholder` (decided here) |
| Sample screens | Price, area, date text | A small helper in the screens folder on `Intl` with `vi-VN` and `Asia/Ho_Chi_Minh`, replaced by `format.ts` when that exists (decided here) |
| Sample screens | Empty, loading, error, rate limited views | The shared state components, with fake `ApiError` objects as on `/dev/ui` |
| Pricing screen | Who sees the "Mua" button | A fixed sample viewer (guest, landlord, seeker or admin) set on the screen, not the real session; the rule is scope item #18 |
| Body | Font | `Be_Vietnam_Pro` from `next/font/google`, variable `--font-sans` |
| `ErrorState` | Message and support code | `describeError(error)` (spec 0002); code only for status 500 or more |
| `RateLimitNotice` | Wait text and seconds | `formatWait` and `useCountdown` (spec 0002); "khoảng" only when `retryAfterExact` is false |
| Contrast script | Thresholds | WCAG 2.2: 4.5:1 text (1.4.3), 3:1 controls and focus ring (1.4.11; the focus must also be visible, 2.4.7) |
| Contrast script | Token values | `src/app/globals.css` |
| `ImagePlaceholder` | Shown when | The caller has no image URL (`coverImageUrl` is `null`) |

### Key invariants

- Components use semantic tokens only (`bg-primary`, `text-muted-foreground`), never raw colors, and `className` for layout, not for restyling a component.
- No shell layout reads `cookies()` or `headers()`, and every client leaf that reads `usePathname` sits inside `<Suspense>` (Next.js Cache Components rule; the session hook does not suspend).
- Message text from the API is rendered as text, never as HTML.
- There is one font family in four weights (amended by [0004](../0004-type-and-layout-refinement/index.md): three weights, 400, 500 and 600).
- Every contrast pair in the script passes, or `npm run check` fails.
- Everything under `/dev` is a 404 in production, decided in `src/app/dev/layout.tsx`.
- Generated shadcn files are updated only with the CLI's `--dry-run` and `--diff`, never `--overwrite` without the engineer's approval.

### Edge cases and failure handling

| Case | Handling |
|---|---|
| Google Fonts unreachable at build | `next/font` fails the build loudly; no runtime request to Google is made after build (files are self hosted) |
| Font not loaded yet | `font-display: swap`; fallback stack `ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`, all with Vietnamese glyphs |
| Stacked diacritics clipped | Headings keep line height 1.25 or more; no fixed heights or `overflow-hidden` on text with tight leading |
| Long names, emails, addresses | One line labels use `truncate` with a `title` or tooltip; card titles use `line-clamp-2`; flex children get `min-w-0` |
| 320 px wide screen | No horizontal page scroll; the header shows the brand and the 44 px menu button, and the account actions sit in the menu sheet; wide tables scroll inside their own container |
| Error in the root layout | `error.tsx` does not wrap the layout above it, so `global-error.tsx` catches it with its own `<html lang="vi">` and `globals.css` (its default would follow the system color scheme) |
| URL that matches no route | The root `not-found` renders `NotFoundState` inside `PublicShell`, so the person still has a header |
| Session `loading` | Account area is a fixed size skeleton, so nothing jumps |
| Session `guest('unavailable')` | Shown as a guest until #5 adds a retry |
| Scripts off or failed | Public header links and footer are plain anchors in the server HTML; only the account area stays a skeleton |
| System dark mode | Page stays light; `color-scheme: light` keeps scrollbars and native controls light |
| Windows forced colors | The focus ring keeps a transparent outline under it |
| Reduced motion | Durations set to 0.01 ms by one global rule, never `none` |
| A token that existed at the end of M2 is changed in code (or in Figma) later | The Figma file is no longer kept in step, so change both, or `/check verify` flags the mismatch (AC-2). Tokens added from M3 on are never compared with Figma |
| shadcn CLI cannot work with the project's Tailwind setup | The project loads Tailwind through a Turbopack rule (`next.config.ts`), not `postcss.config`. Task 2 proves `init` works. If it does not, set `components.json` by hand; if the CSS imports fail, stop and route to `/architect` (a stack change) |
| A person has no photo on a listing | `ImagePlaceholder` |

### Security model

- No new data, endpoints or storage. The shells enforce no access: the route gate is #5 and the backend decides. Hiding a link by role is a convenience.
- Only text from the API is displayed, as text. No `dangerouslySetInnerHTML`.
- Fonts are fetched once at build and self hosted. shadcn code is copied source: review each generated file; the installed `shadcn` skill passed Gen and Snyk scans but Socket raised one alert (details on skills.sh), so read what it tells the agent to run.
- `/dev/ui` is hidden in production.
- No regulated data.

### Configuration required

- No environment variable.
- New dependencies, with the versions the shadcn CLI pins at install: `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `sonner`, `tw-animate-css`, and `shadcn` if `init` asks for it. `next-themes` is not installed (the toaster theme is pinned to light).
- Files created: `components.json`, `scripts/check-contrast.mjs` (wired into the `check` script in `package.json`), `design.md`.
- The sample screens use fake data in code, so no backend has to run for them.

### Critical test scenarios

- Happy path: open `/dev/ui` and see every component and state; compare the public header at 390 and 1280 with the Figma frames, verifies **AC-1**, **AC-5**, **AC-8**, **AC-11**.
- Token match: read the `Foundations/Tokens` frame with `get_variable_defs` and check that every variable has a token of the same name and value in `globals.css` (a token that exists only in `globals.css` is fine); run the search from AC-2 and expect no output, verifies **AC-2**.
- Vietnamese: the test line at 320 px shows every mark; `<html lang>`, the title and the description on `/` are right, verifies **AC-3**.
- Light only: emulate a dark system in the browser; the page and a generated component with `dark:` classes stay light, verifies **AC-4**.
- English strings: search `src/components/ui` for the English labels; none, verifies **AC-5**.
- Server errors: the demo form with a fake 400 (two fields), a 409 `EMAIL_TAKEN` and a 429 with 15 minutes; focus lands on the first field with an error and a screen reader reads the message with the field, verifies **AC-6**.
- Shared states: side by side on `/dev/ui`; an `ErrorState` with status 500 shows the support code and with status 404 does not, verifies **AC-7**.
- Session states in the header: guest, then sign in on `/dev/session` and reload `/`; the account area goes skeleton, then user menu, then "Đăng xuất" returns to guest, verifies **AC-8**.
- Static shell: `curl` the page with scripts off; the HTML holds brand, links and footer; `npm run build` passes, verifies **AC-9**.
- Failure case: change `--primary` to a pale teal; `npm run check` fails naming the pair; revert, verifies **AC-10**.
- Keyboard: Tab through the public header, open the menu sheet with Enter, close with Esc and land back on the button; the same for a dialog and an alert dialog on `/dev/ui`, verifies **AC-10**.
- Landmarks and targets: each shell has one `main`, a skip link that moves focus to it, and the header menu button measures 44 by 44 px; with reduced motion emulated, a dialog still opens and closes, verifies **AC-10**.
- Permission: `next build` then `next start`, `/dev/ui`, `/dev/ui/shells/public` and `/dev/session` all answer 404, verifies **AC-11**.
- Design record: `design.md` has the character, a build mandate that says "from M3 on, build in code on the existing design system, no Figma frame or gate, layout decided by `/develop`", the Figma file and the frame names of M1 and M2, and an `Approvals` section with a dated line for the M1 gate and the M2 gate (approved, or skipped with the reason) and none after; the Figma file holds the `Foundations/Tokens` frame, verifies **AC-1**, **AC-12**.
- Sample screens: open `/dev/ui/screens` and reach all seven screens from it; check the public ones at 390 and 1280 and the landlord and admin ones at 1440, with no sideways scroll at 320; the listing list and the users table show their empty, loading, error and rate limited states; the pricing page shows the "Mua" button only for the sample landlord; no network request is made, verifies **AC-14**.
- Build: `npm run check` and `npm run build` pass, no console error, verifies **AC-13**.

## Build plan

Tracer Bullet (your project default): a thin thread first, from a Figma variable to a visible button in the public header, then each milestone thickens it. Each milestone is one `/develop` pass. Figma came before code in M1 and M2, and `/develop` stopped for your approval at the gates of steps 1 and 5 (M2's gate was skipped at your request). From M3 on there is no Figma step and no gate: `/develop` builds directly in code on the existing design system and decides the layout of each screen.

**M1. Thin thread: Figma to screen**
1. In Figma, create the variables (colors, radius, font; one flat mode `Light`) with the token names above, a `Foundations/Tokens` frame with one bound swatch per variable, a `Button` component (variants and sizes, bound to the variables) and the public header frame at 390 and 1280. **Gate: engineer approves** (recorded in `design.md` once it exists), satisfies **AC-1**, **AC-2**
2. Run `npx shadcn@latest init --base radix --preset vega --no-monorepo -y`, then `git diff`, then `npx shadcn@latest info --json` and confirm `base` is `radix`, `tailwindVersion` is `v4`, `tailwindCssFile` is `src/app/globals.css`, `iconLibrary` is `lucide`. Revert anything `init` adds that fights the project: a `postcss.config.*` or `@tailwindcss/postcss` (Tailwind would then run twice beside the Turbopack rule) and any edit to `next.config.ts`. Confirm the `tw-animate-css` and `shadcn/tailwind.css` imports resolve through the Turbopack rule; add `shadcn` to the dependencies if `init` asks for it. Fall back as in the edge case table. Read `npx shadcn@latest docs button` before using it, satisfies **AC-5**, **AC-13**
3. Copy the tokens from Figma (`get_variable_defs`) into `globals.css` (`:root` and `@theme inline`), delete the dark media query and the Arial rule, set `color-scheme: light`. Keep `@custom-variant dark` keyed to a class, delete init's `.dark` block and `chart-*` tokens, add the `overlay` token, override `--text-xs` to `--text-4xl` with their line heights, and add the reduced motion rule. Switch the font to Be Vietnam Pro, set `lang="vi"`, the Vietnamese description and the title template, add `src/lib/site.ts` and `src/app/icon.svg` (the brand mark), remove the Geist fonts, satisfies **AC-2**, **AC-3**, **AC-4**
4. Add `button`, a first `PublicShell` header (brand, nav, a login button) used by `(public)/layout.tsx`. The shell owns `<main id="main" tabIndex={-1}>`, so remove the `<main>` that `src/app/(public)/page.tsx` renders today (two `main` landmarks would nest). Add a first `/dev/ui` with the button and the Vietnamese test line. Compare the screenshot with the Figma frame, satisfies **AC-5**, **AC-8**, **AC-11**

**M2. Forms, states and feedback**
5. In Figma: form controls with their states, `Field` with error, `Alert`, `Skeleton`, the six shared states, a toast frame. **Gate: engineer approves**, satisfies **AC-1**
6. Add `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `label`, `field`, `alert`, `skeleton`, `spinner`, `badge`, `separator`, `empty`, `sonner`, and apply "Edits after adding shadcn files" to each (focus ring, sizes, `text-base`, translations, Sonner theme). Build `FormField` and the state components and `ImagePlaceholder`. Move `useFormFailure` and `FailureNotice` out of the session lab, recompose `FailureNotice` as described under Shared states, and update the lab's imports. Make `applyFieldErrors` focus the first field it places. Mount the `Toaster` in `Providers`. Extend `/dev/ui` with the demo form, satisfies **AC-5**, **AC-6**, **AC-7**

**M3. Overlays and data display**
7. No Figma step and no gate. Change `design.md` so its build mandate says what AC-1 says (from M3 on, build directly in code on the existing design system, no Figma frame or gate, the layout of each screen is decided by `/develop`) instead of "Figma first", and so its `Approvals` section ends at M2. `/develop` then decides how the dialog, alert dialog, sheet, dropdown menu, tabs, table, pagination, tooltip, avatar, card and badge variants look, in code, on the existing tokens, while building step 8, satisfies **AC-12**
8. Add `card`, `dialog`, `alert-dialog`, `sheet`, `dropdown-menu`, `tabs`, `table`, `pagination`, `tooltip`, `avatar`, `breadcrumb`, applying the same edits (overlay token, `text-destructive-foreground`, translations, focus ring). Build `ListPagination`. Extend `/dev/ui`, satisfies **AC-5**, **AC-10**

**M4. Shells**
9. No Figma step and no gate. `/develop` decides the layout of the auth shell, the workspace shell (side menu expanded and collapsed, top bar, account menu), the public shell with the menu sheet and footer, and the account area states, inside the behavior fixed under "Shells". It checks them in the browser at 390, 1280 and 1440 through the previews of step 10, satisfies **AC-8**
10. Add `sidebar` (apply `SIDEBAR_WIDTH_ICON` 4rem, the `use-mobile` breakpoint 1024 and the other edits). Finish `PublicShell` (menu sheet that also holds the account actions, footer, skip link, the `<Suspense>` fallback with plain links), `AuthShell`, `WorkspaceShell`, `AccountMenu` and `AccountMenuView`, and `nav-config.ts` with `PUBLIC_NAV`, `LANDLORD_NAV`, `ADMIN_NAV` and `ACCOUNT_LINKS`. Create the `(auth)`, `(landlord)` and `(admin)` groups with their layouts, `error.tsx` and `not-found.tsx` for every group and the root, `global-error.tsx`, and `src/app/dev/layout.tsx` with the production 404. In Next 16 an `error.tsx` receives `error` and `retry` (use `retry()`, not `reset()`, per the Next.js docs); it shows the generic message and the `digest` as the support code, as spec 0001 says. Add the three previews under `/dev/ui/shells/` (with a local `SAMPLE_NAV`) and show `AccountMenuView` in its three views on `/dev/ui`. Confirm `npm run build` shows no Suspense error, satisfies **AC-7**, **AC-8**, **AC-9**, **AC-11**

**M5. Seven sample screens (in code)**
11. No Figma step and no gate. Build the seven sample screens in code at `/dev/ui/screens` with fake data, as described under "Sample screens (AC-14)": an index page that reaches all seven (listing list, listing detail, landlord "my listings", admin users table, sign in, pricing page, post listing form), the sample format helper, and the empty, loading, error and rate limited states for the listing list and the users table. `/develop` decides the layout of each screen, and checks it at the widths in AC-14. This is the first thing to cut if time runs short: sign in, the pricing page and the post listing form belong to #5, #18 and #7, which can build them later. Cutting or moving this milestone affects only AC-14, satisfies **AC-14**

**M6. Accessibility gate and finish**
12. Write `scripts/check-contrast.mjs` with the `PAIRS` list under Accessibility rules and wire it into `npm run check`. Fix any failing pair in the CSS, and in the Figma variable too when the token existed at the end of M2. Run the search from AC-2, satisfies **AC-2**, **AC-10**
13. Finish `design.md` (character, the build mandate from step 7, the Figma file and the frames of M1 and M2, pointer to `globals.css`, and the `Approvals` section with the dated lines for the M1 and M2 gates). Finish `/dev/ui` (contrast table, type specimens, state matrix). Do the keyboard pass and the landmark and target checks. Run `npm run check` and `npm run build`. Tick the font and `lang` item in spec 0001's follow up, satisfies **AC-1**, **AC-10**, **AC-11**, **AC-12**, **AC-13**

Every AC appears in at least one task and every task names an AC.

## Consequences

**Positive**:
- Later features get tokens, accessible components, shells and shared states for free, and `/develop` has a `design.md` to build inside.
- The tokens and base components of M1 and M2 were drawn in Figma before their code, and from M3 on there is no Figma step, so each milestone goes straight to visible code.
- A failing contrast pair stops the build, so accessibility does not erode with later color tweaks.
- Components are source in the repo: the engineer owns and can edit them.

**Negative / tradeoffs**:
- The Figma file stops at M2 and drifts from the code as later components and screens are added; only the M1 and M2 tokens are compared with it (AC-2).
- From M3 on nothing is approved on a drawing: the layout of each screen is `/develop`'s call, so a layout the engineer dislikes is found in the browser and reworked in code.
- Seven sample screens is still a large amount of work, and three of them (sign in, pricing page, post listing form) belong to later items. M5 is the cut line, and it carries only AC-14, so cutting it does not fail the rest.
- Generated shadcn code must be kept in line with the repo's lint and strict TypeScript rules, and upstream updates must be merged by hand with `--diff`.
- The CLI and its presets change quickly, and the project's Tailwind through Turbopack setup is unusual; task 2 may need a manual fallback.
- The contrast script checks token pairs, not every real combination (text over photos, or over an image overlay still needs a look).
- Until #5 ships, "Đăng nhập" and "Đăng ký" point to pages that do not exist yet.
- Light only: a visitor whose system is dark still sees a light site. Dark mode stays in Deferred.
- The sidebar does not remember collapsed or open between visits.

**Neutral**:
- `/dev/ui` stays as a living design system page (it is a 404 in production).
- The default favicon is replaced by `icon.svg`; a default share image waits for #9.
- `components.json` and `src/components/ui` become part of the project layout; spec 0001's folder map is satisfied by them.

## Follow-up

- [ ] Root `AGENTS.md` `## Agent skills`: add a bullet for the installed `shadcn` skill (`.agents/skills/shadcn/`, `shadcn-ui/ui`), and, if the MCP server is connected, name it in the `MCP servers:` line. `/audit` or `/sync` owns that file.
- [ ] Record as declined in `AGENTS.md` so they are not offered again: `emilkowalski/skills@ask-sonner` and `addyosmani/web-quality-skills@accessibility` (offered, not chosen).
- [ ] Connect the shadcn MCP server (you chose it): run shadcn's own `mcp init` for Claude Code and check the exact command on shadcn's MCP page, because the sources found did not confirm it for this client.
- [ ] Root `AGENTS.md` `## Rules`: add "semantic tokens only, no raw colors", "components from `src/components/ui`, copy changes through the shadcn CLI", and the Vietnamese UI string rule (`/sync`).
- [ ] Spec 0001 follow up: tick the item "Pick a font that covers Vietnamese. Also change `lang`" when this ships.
- [ ] Item #5: use `useFormFailure`, `FailureNotice` and the `Field` pattern for the real forms, delete `/dev/session`, add the route gate, and decide what `guest('unavailable')` shows in the header.
- [ ] Items #8, #12 and #20: each adds its nav item in the same change that ships its page. #14 adds the tenant item "Tin đã lưu" to `ACCOUNT_LINKS.tenant`, #12 "Khu chủ trọ" to `.landlord`, #20 "Quản trị" to `.admin`, #28 "Tài khoản" to `.all`.
- [ ] Items #8, #15, #14 and #18: build the listing card and the plan card starting from the sample markup on `/dev/ui/screens` (lift it into the feature, do not redraw it). Item #25: build the stat card in code on the tokens and `card`; no sample screen has one.
- [ ] `design.md` still says "Figma first" in its build mandate and its Approvals intro. Step 7 of the Build plan changes that when M3 starts (`/develop` owns the file).
- [ ] The first item that shows a price adds `src/lib/format.ts`; the sample format helper in the screens folder then switches to it.
- [ ] `verify.md` for this spec was written before this update. `/check verify` rereads AC-1, AC-2, AC-12 and AC-14 and replaces the steps that ask for Figma frames from M3 on.
- [ ] Item #26 (revenue) and #29 (map) pick their chart and map libraries; #26 adds the `chart` tokens.
- [ ] Optional later: dark mode as a second token set plus a contrast pass; persist the sidebar state.
- [ ] Optional later: `/test` can lock the contrast script and the `describeError` driven states with a component test.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
