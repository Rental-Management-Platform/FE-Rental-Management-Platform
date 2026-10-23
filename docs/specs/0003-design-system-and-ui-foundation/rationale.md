# 0003. Rationale: design system and UI foundation

The decision record for [index.md](index.md). `/develop` skips this file.

## Context

> ⚠️ Premise note: Seven sample screens in Figma is a lot of design work for a foundation item, and three of them (sign in, home, post listing form) belong to items #5, #16 and #7 that come next. Drawing them now helps those items, but with a delivery deadline it is the first thing to lose. The build plan keeps the screens in their own milestone (M5) so they can be cut or moved without touching the tokens, components and shells. Everything else in this spec is on the critical path of every later screen.

The project has a working data and session layer (specs 0001 and 0002) and no look at all. `src/app/globals.css` still has the `create-next-app` defaults: white and near black colors, an Arial rule on `body`, and a `prefers-color-scheme: dark` block that turns the page dark on a dark system. The root layout loads Geist and Geist Mono with only the `latin` subset (no Vietnamese marks), sets `lang="en"` and an English title. Spec 0001 already says item #4 owns the UI kit, tokens, fonts and the three shells, and lists the font, `lang` and title as unfinished scaffold items.

Twenty seven features after this one all need screens: forms with server errors, lists with pagination, tables for admin, dialogs that ask for a reason, status labels, empty and error and rate limit states. Without a shared base, each feature would pick its own colors, spacing and component code, and accessibility (the project target is WCAG AA, with all text in Vietnamese) would be solved again each time. The public site is mobile first and needs SEO; landlord and admin are desktop first and sit behind a client side gate. The stack uses Next.js 16.4 with Cache Components and Tailwind 4, and a rule that session dependent parts run in the browser.

The scope asks for the design to be drawn in Figma through the connected MCP before any code. The Figma file exists but is empty; it has the Material 3 Design Kit and Simple Design System attached. The project is a demo or thesis with a deadline, so the team is one engineer and time matters more than a perfect bespoke system.

## Options considered

### Component base

**Option 1: shadcn/ui on Radix (chosen)**. Components are copied into the repo as source, built on Radix primitives for focus and keyboard behavior and styled with Tailwind through semantic variables. It now ships `Field`, `Empty`, `Sidebar`, `Spinner` and `Skeleton`, and an official Agent Skill describes its rules.

**Pros**:
- Accessible behavior (focus trap, Esc, arrow keys) comes ready.
- Tokens are plain CSS variables, which match how Figma variables are copied.
- The code is yours to edit; the sidebar, table and dialog cover the admin screens.

**Cons**:
- Generated files must be reviewed and kept in line with lint and strict TypeScript.
- Upstream changes are merged by hand with the CLI's diff.
- The CLI moves fast, and this project loads Tailwind through a Turbopack rule instead of PostCSS, so setup needs checking.

**Option 2: Radix Primitives with hand written styles**. Same accessible parts, but every variant of button, input, table is written here.

**Pros**: full control, fewer files from outside.
**Cons**: much more work for no clear gain; easy to drift from the Figma components.

**Option 3: React Aria Components**. Very strong accessibility and internationalization.

**Pros**: the most thorough keyboard and screen reader behavior.
**Cons**: fewer Tailwind 4 examples, a different writing style from the rest of the tool ecosystem the project already uses (`react-hook-form` and shadcn style forms), and more to learn.

**Option 4: Everything hand written**. No dependencies.

**Pros**: nothing to maintain from outside.
**Cons**: focus traps, menus and tables to the AA standard take real effort and are easy to get wrong.

### Where the tokens come from

- **Figma variables first, code copies them (chosen)**: matches the scope (design before code) and makes Figma the place the engineer approves. Cost: code waits for Figma.
- **CSS first, Figma follows**: contrast is easy to script, but it reverses the order the scope fixed and invites drift in Figma.

### How to use the two Figma kits

- **References only, own components on own variables (chosen)**: tokens stay ours, variant names match shadcn.
- **Simple Design System as the main kit, restyled**: faster for tables and cards but needs many overrides to follow our tokens.
- **Kit components as they are**: fastest, but colors and type would not match the code.

### Navigation

- **Public**: compact top bar with a sheet menu on phones (chosen), against a Material style bottom bar with three items. The bottom bar fights the sticky "Đăng nhập để xem số điện thoại" action on the listing page and needs a guest state for "Đã lưu".
- **Workspace**: a collapsible left side menu with a top bar (chosen), against a top tab bar. Admin has seven areas, which a tab bar would squeeze.

### Quality gate for accessibility

- **A contrast script inside `npm run check` plus a keyboard pass at verify time (chosen)**: stops a token change from silently breaking AA and needs no test runner.
- **axe-core in the browser at verify time**: finds missing labels and heading order, but is a manual step and the project has no test runner yet.
- **Lighthouse and eyes only**: fastest but guards nothing.

## Rationale

The forces from Context decide this. There is one engineer and a deadline, so building accessible dialogs, menus and tables from nothing (options 2 and 4) is the wrong place to spend time, and React Aria (option 3) trades a smaller community for strength the project does not need. shadcn/ui on Radix gives accessible behavior from day one, uses plain CSS variables that map one to one onto Figma variables, and adds `Sidebar`, `Table`, `Field` and `Empty`, which are exactly the admin and form needs listed in the scope. The installed Agent Skill gives the agent shadcn's real rules (use `Field`, use semantic colors, use `Empty` for empty states), which cuts guessing during the build.

Figma first matches the order the scope already fixed and puts approval where change is cheapest. Drawing our own components on our variables, with shadcn variant names, is what keeps Figma and code from drifting: the same word means the same thing in both. Teal is chosen because it is calm, fits housing, avoids the orange and red used by many Vietnamese listing sites, and passes AA with white text (5.47:1). Be Vietnam Pro is designed for Vietnamese, so stacked marks stay clear at small sizes on phones. Light only follows the scope's Deferred list, and removing the system dark rule is needed anyway: with Tailwind default components that do not know about dark mode, the old rule would give dark text on a dark page.

The contrast script is the cheapest guard that fits a project with no test runner. It checks the pairs that matter (text and backgrounds, control borders, focus ring) every time `npm run check` runs, so a later color tweak fails before it ships.

The engineer's preferences all fit these forces: Figma through MCP, shadcn/ui, lucide-react, Sonner, Be Vietnam Pro, the teal direction, light only, and the extra three sample screens. The one place a preference carries real cost is the extra sample screens; that is flagged in the Premise note and given its own cut line.

Decisions made here without being asked (RECOMMEND items):
- shadcn preset `vega` (classic geometry; runner up `nova`, more compact): our tokens set the look, and control heights are pinned to 32, 40 and 44.
- Hex values in both Figma and CSS (runner up OKLCH): a one to one match makes the Figma comparison and the contrast script simple.
- The sidebar does not read a cookie on the server (runner up: persist its state): reading `cookies()` in a layout would make the shell dynamic under Cache Components.
- Plain shadcn `Table` with no TanStack Table: sorting and filtering are done by the API.
- Nav items are added by each feature when its page ships (runner up: list all planned pages now): no dead links in the demo.
- One font family in four weights, no mono font: keeps the font cost low.
- `/dev/ui` stays after #5 (runner up: delete with `/dev/session`): it is the place to review states that are hard to reach, such as a 429 or a 403.
- `useFormFailure` and `FailureNotice` move out of the session lab: #5 builds the real forms on them.
- Account links live in `ACCOUNT_LINKS` per account type, empty until each feature adds its own (runner up: tie the role links to the first item of `LANDLORD_NAV` and `ADMIN_NAV`, which leaves the tenant with no place for "Tin đã lưu").
- Figma approvals are logged in `design.md` (runner up: the spec's Follow-up): `/develop` may not edit spec content, and `/check verify` reads `design.md` anyway.
- `error.tsx` keeps showing the `digest` as the support code, as spec 0001 already says (the cross check suggested dropping it).
- Seven sample screens split into their own criterion, AC-14, so cutting milestone M5 does not fail the foundation criteria.

## Update 2026-10-24: Figma stops after M2

The engineer decided that from M3 on the work is built directly in code on the existing design system, with no Figma frames or gates, and that `/develop` decides the layout of each screen. This replaces "Figma first" for M3 to M6 in the Rationale above. M1 and M2 stay as they were built.

What the repo showed when this was decided:
- The M1 gate was approved on 2026-10-23. The M2 gate was skipped on 2026-10-24 at the engineer's request, who asked to write the code right after the frames were drawn (`design.md`, Approvals). So the approval step had already stopped paying for itself.
- The Figma file is on the Starter plan, which allows 3 pages, so the `Shells` and `States` pages in the first plan could not exist; the frames went into sections on `Screens`.
- Scope item #16 (the home page) is dropped, so the seventh sample screen is the pricing page of item #18 instead.

Options weighed:
- **Keep Figma and its gates for every milestone (the first plan).** Pros: one visual source of truth, rework while it is cheap. Cons: the engineer already skipped a gate, the page cap forces workarounds, and drawing shells and seven screens is slow work that `/develop` would repeat in code.
- **Stop after M2, keep the file as a frozen reference (chosen).** Pros: M3 to M5 go straight to visible code; the tokens and base components that need an exact match are still checked (AC-2, only for tokens that existed at the end of M2). Cons: the file drifts, and a layout is first seen in the browser, not on a drawing.
- **Drop Figma completely, including the M1 and M2 frames.** Pros: no second place to keep in step. Cons: the approved tokens and button would lose their source, and AC-2 would have nothing to compare with.

The seven sample screens stay as a criterion, now built in code with fake data (no network call, no photos, a local `Intl` helper), so they need no backend. They are still the first thing to cut, and cutting them touches only AC-14.

## Evidence

### Figma file today

`get_metadata` on file `cdrAcD1PywM8IWdVRt7X0o`: one page, "Page 1", empty. Libraries attached: Material 3 Design Kit, Simple Design System, and Apple platform kits (iOS, iPadOS, macOS, watchOS, visionOS), which are not used.

### Agent Skill and MCP discovery

- Searched the skills registry for shadcn, lucide, Sonner, next font and accessibility. Found: `shadcn-ui/ui@shadcn` (390.6K installs), `emilkowalski/skills@ask-sonner` (133.8K), `addyosmani/web-quality-skills@accessibility` (63.3K), lucide skills with a few hundred installs.
- Chosen and installed: `shadcn-ui/ui@shadcn`, into `.agents/skills/shadcn/`, linked for Claude Code. Security summary shown at install: Gen Safe, Snyk Low Risk, Socket 1 alert.
- Not chosen: `ask-sonner`, `accessibility`, the lucide skills.
- MCP: shadcn has its own MCP server (`mcp init` command). The pages found were mostly mirrors and third party, so the exact Claude Code command is not confirmed; the engineer chose to connect it and should check shadcn's MCP page. Figma MCP and `next-devtools-mcp` were already known to the project.

### Cross check of the first draft

A read only pass by a different model (Opus) returned SOUND WITH GAPS: 17 decision gaps and 9 soundness notes. The engineer chose to apply the recommended fixes, so all 17 are closed in `index.md`. Checked by hand before applying: the nested `main` in `src/app/(public)/page.tsx` is real; Next 16 `error.js` takes `retry` and has `global-error.js` (Next.js docs); `useSession` never suspends (it uses `useSyncExternalStore` with a `loading` server snapshot); the half transparent teal focus ring (`#0F766E` at 50% on white, about `#87BBB6`) measures 2.14:1, under 3:1; every extra contrast pair added to the script list passes. The claims about the code the shadcn CLI generates (ring classes, heights, `text-white`, `next-themes` in the Sonner file, English labels, sidebar width, breakpoint) come from the reviewer's knowledge and are listed in the spec as "confirm against the real file" edits.

### Next.js facts checked in `node_modules/next/dist/docs/`

- Under Cache Components, client hooks that read the route (`usePathname`, `useParams`) suspend in a shared layout when routes below it have dynamic params, so the component that reads the hook must sit inside `<Suspense>`, pushed down to the smallest leaf (migrating to Cache Components guide). Routes `/[slugCode]` and `/landlords/[id]` are such routes.
- `layout.js` does not re render on navigation, so the pathname is read in a client component (layout file convention).
- The default `not-found` UI follows the system color scheme and ignores an app level theme, so the project ships its own `not-found.tsx` (not-found file convention).
- Fonts that are not variable fonts need an explicit `weight`; Be Vietnam Pro on Google Fonts is static weights (fonts guide).

### Contrast of the starting palette

Computed with the WCAG relative luminance formula:

| Pair | Ratio | Needs |
|---|---|---|
| `#0F172A` on `#FFFFFF` | 17.85 | 4.5 |
| `#475569` on `#FFFFFF` | 7.58 | 4.5 |
| `#475569` on `#F1F5F9` | 6.92 | 4.5 |
| `#FFFFFF` on `#0F766E` (also the link color on white) | 5.47 | 4.5 |
| `#0F766E` on `#F1F5F9` | 5.00 | 4.5 |
| `#134E4A` on `#F0FDFA` | 9.09 | 4.5 |
| `#134E4A` on `#CCFBF1` | 8.41 | 4.5 |
| `#FFFFFF` on `#B91C1C` | 6.47 | 4.5 |
| `#FFFFFF` on `#15803D` | 5.02 | 4.5 |
| `#78350F` on `#FEF3C7` | 8.15 | 4.5 |
| `#FFFFFF` on `#1D4ED8` | 6.70 | 4.5 |
| `#64748B` on `#FFFFFF` (control border) | 4.76 | 3 |
| `#0F766E` on `#FFFFFF` (focus ring) | 5.47 | 3 |
| `#0F766E` on `#F1F5F9` (focus ring) | 5.00 | 3 |
| `#CBD5E1` on `#FFFFFF` (decorative border) | 1.48 | not required |
