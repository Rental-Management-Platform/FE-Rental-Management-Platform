# 0004. Type and layout refinement for the web frontend

**Date**: 2026-10-24
**Status**: Accepted

## Summary

After reviewing the seven sample screens, the engineer found the text too big and too heavy, and the parts of a page hard to tell apart. This spec switches the font to Inter, shrinks the text and cuts it to three weights (body 15 px), and divides every screen into clear zones: white cards with a thin border on a very light grey page. It changes tokens and shared pieces first, so every later screen inherits the look, and it replaces the parts of spec 0003 that set the font, the type scale and the card shadow.

## Requirements

Seeded from scope row #30 and refined with the engineer. Spec 0003 stays the contract for everything this spec does not name (colors, radius, control heights, shells, states, accessibility baseline).

**User stories**:
- As a visitor on a phone, I want smaller and lighter text with clear headings, so a page reads calmly and I find the part I need.
- As a landlord or admin at a desk, I want filters, tables, forms and side notes each in their own marked zone, so I can scan a page fast.
- As the developer of a later feature, I want one page header and one zone pattern, so I never invent weights, sizes or spacing.
- As the engineer, I want the change made in tokens and shared components, not screen by screen, so a later tweak is one edit.

**Acceptance criteria** (the contract; each is checkable on its own):
- **AC-1**: Font. The body font is Inter, loaded through `next/font/google` as a variable font with `weight: ['400', '500', '600']` (a list, because the loader rejects a range string such as `'400 600'`), subsets `vietnamese` and `latin`, `display: 'swap'`, no extra axes, and the CSS variable `--font-inter`. `--font-sans` in `globals.css` starts with `var(--font-inter, ui-sans-serif)` and keeps the same fallback list as before. No import or variable of Be Vietnam Pro remains (`grep -rniE "Be_Vietnam|be-vietnam" src` prints nothing). On `/dev/ui` at 320 px wide the line "Nguyễn Thị Hồng Nhung, đường Lê Văn Việt, phường Hiệp Phú" shows with no missing glyph and no clipped mark at the h1, h2, h3 and body sizes, and `getComputedStyle(document.body).fontFamily` starts with the Inter family name.
- **AC-2**: Weights. Only 400, 500 and 600 are used. `grep -rnE "font-(bold|extrabold|black|thin|extralight|light)|font-\[[0-9]+\]" src --include="*.ts" --include="*.tsx"` prints nothing. Computed weights on `/dev/ui`: body text 400; h1 to h4 600; button, label, tab, badge and table head text 500; card, dialog and sheet titles 600; no element has a computed weight above 600.
- **AC-3**: Scale. `globals.css` sets `--text-xs` to `--text-4xl` and their line heights to the values in the Type scale table, and adds `--text-input` at 1rem. Computed sizes: body 15 px; a `text-sm` element 13 px; h1 24 px at 390 wide and 28 px at 1280; h2 20 px and 22 px; h3 17 px; h4 15 px; text typed in an input, textarea or select trigger 16 px at both widths; every heading line height is at least 1.25 times its size.
- **AC-4**: Canvas and zone surface. `globals.css` has a `--canvas` token (`#F1F5F9`) with a `canvas` color mapping, in `globals.css` only. `body` uses it, so `getComputedStyle(document.body).backgroundColor` is `rgb(241, 245, 249)` under every shell. The public header and footer, the workspace top bar and the zone cards are white. A zone is a `Card` with a 1 px `border`, 12 px radius, no shadow, 20 px padding (16 px for `size="sm"`) and a title in `text-base` 600; a zone that holds a table or a form has a hairline under its title row. The workspace content area and the auth page stand on the canvas.
- **AC-5**: Page header. `src/components/layout/page-header.tsx` exports `PageHeader` with the props `title`, `description?`, `breadcrumb?` and `actions?`. It renders the one `h1` of the page, the description in `text-base` muted, 8 px between its parts, and puts `actions` at the right from `md` up and under the text on a phone. The six screens outside the auth shell render their title through it.
- **AC-6**: Zones on the seven screens. Each sample screen follows its row of the Zone maps table. Page side padding is 16 px on a phone and 24 px from `md`; the gap between the page header and the first zone, and between two zones, is 24 px. On every screen `document.querySelectorAll('[data-slot=card] [data-slot=card]').length` is 0, and a table inside a zone has no frame of its own (computed border width 0 on `[data-slot=table-container]` inside a card). The empty, loading, error and rate limited views of the listing list and the users table still work inside the new zones.
- **AC-7**: Contrast. `PAIRS` in `scripts/check-contrast.mjs` gains the pairs on `canvas`: `foreground`, `muted-foreground`, `primary` and `destructive` at 4.5:1, `input` and `ring` at 3:1. `npm run check` passes. Setting `--canvas` to a mid grey such as `#94A3B8` makes it fail and name the pair; the value is then restored.
- **AC-8**: Nothing else regresses. Public controls stay 44 px high and the header menu button 44 by 44 px; dense desktop rows stay at least 32 px; the focus ring is unchanged; no screen scrolls sideways at 320 px (the seven screens and `/dev/ui`); there is no hydration warning and no console error on `/` and `/dev/ui`; `npm run check` and `npm run build` pass.
- **AC-9**: Docs and amendments. `design.md` records Inter, the three weights, the scale and its roles, the canvas token, the zone rules, the spacing rhythm and `PageHeader`, and says that the Figma `font` variable and `Foundations/Type` styles are stale. Spec 0003 carries a short "Amended by 0004" note at each place this spec replaces: Summary (the font), AC-2, AC-3, the Font and Type scale bullets, the elevation bullet and the invariant about one font family. The AC-2 comparison of spec 0003 no longer includes the `font` variable.

## Decision

**Chosen option**: Option 1: Change the tokens, the base styles and the shared Card in place, then divide each screen into zones, built thread first (Tracer Bullet)

Switch the font to Inter (variable, 400 to 600), set the type scale and weights below, add a `canvas` page background with white `Card` zones and one shared `PageHeader`, and roll it out thin first: tokens and one screen, then components and shells, then the other six screens, then the gates.

**Implementation skills**: `tailwind-design-system` (`wshobson/agents`, `.agents/skills/tailwind-design-system/`) · `shadcn` (`shadcn-ui/ui`, `.agents/skills/shadcn/`) · `next-dev-loop` (`vercel/next.js`, `.agents/skills/next-dev-loop/`)

The Next.js docs in `node_modules/next/dist/docs/` win over these skills where they disagree (project rule in `AGENTS.md`).

## Feature design

**Data model and API surface**: none. No table, endpoint or stored data. The screens keep their fixed sample data from spec 0003.

### Scope of this spec

| In #30 | Left to others |
|---|---|
| Font swap, weights, type scale, the input size token | Updating the Figma file (it stays a frozen reference, now stale on font and type) |
| The `canvas` token, the zone look of `Card`, `PageHeader` | Dark mode and its canvas value (scope Deferred) |
| Canvas and white bars in the four shells, frameless table inside a zone, field gap | A text size control for readers who want bigger text |
| Dividing the seven sample screens into zones, adjusting the `/dev/ui` gallery | Real feature pages: they lift the markup and `PageHeader` from the screens |
| New contrast pairs, `design.md`, "Amended by 0004" notes in spec 0003 | Changing any existing color, the radius or the control heights |

### Amendments to spec 0003

| Where in spec 0003 | Was | Now |
|---|---|---|
| Summary, AC-3, the Font bullet | Be Vietnam Pro, weights 400, 500, 600, 700, variable `--font-be-vietnam-pro` | Inter, variable, 400 to 600, variable `--font-inter` |
| The Type scale bullet | 12, 14, 16, 18, 20, 24, 30, 36 px; h1 30 to 36, h2 24 to 30, h3 20 to 24, h4 18 to 20 | The Type scale table below. The rule "inputs are 16 px or more" stays, through `--text-input` |
| The Elevation bullet | `shadow-sm` for cards | Zones have no shadow; menus and dialogs keep `shadow-md`; an interactive item card may take `shadow-md` on hover |
| AC-2 | Every variable of the Figma `Tokens` collection has a same name, same value token | The `font` variable is left out, and the `Foundations/Type` text styles are not compared |
| Key invariant "one font family in four weights" | four weights | one family, three weights |
| Tokens table | no page background token | gains `canvas` (in `globals.css` only, no Figma variable) |

Everything else in spec 0003 stays in force.

### Design source

In code, from `design.md` and the existing sample screens. No Figma frame and no approval gate; the engineer reviews the result in the browser and through `/check verify`.

### Type

**Font.** Inter, loaded in `src/app/layout.tsx`: `Inter({ weight: ['400', '500', '600'], subsets: ['vietnamese', 'latin'], display: 'swap', variable: '--font-inter' })`. The `weight` option of `next/font/google` takes only the single values that the font lists, or `'variable'`. A range string such as `'400 600'` fails with "Unknown weight", even though the Next.js font docs show a range (the loader checks each value against the font data, see `validate-google-font-function-call.js`). Leaving `weight` out would load the whole 100 to 900 axis, so the list of three values is what clamps the weights. Inter is a variable font, so the three weights point to the same file and each subset is still downloaded once. No `axes` means only the weight axis is fetched. `--font-sans` in `globals.css` becomes `var(--font-inter, ui-sans-serif), ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. The range stops at 600, so a stray bold cannot render. `global-error.tsx` has no web font and keeps using the system font.

**Weights by role.**

| Role | Weight |
|---|---|
| Body text, descriptions, helper text, table cells, input values | 400 |
| Field labels, buttons, tabs, badges, table heads, menu rows, links that act | 500 |
| Headings h1 to h4, card, dialog and sheet titles, the site name, prices and other emphasized numbers | 600 |

**Type scale.** These replace the `@theme` values of spec 0003.

| Token | Size | Line height | Used for |
|---|---|---|---|
| `text-xs` | 12 px | 1.5 | Captions, badges |
| `text-sm` | 13 px | 1.55 | UI text: labels, buttons, tabs, helper text, table cells |
| `text-base` | 15 px | 1.6 | Body text, zone titles, menu rows, `lg` buttons |
| `text-lg` | 17 px | 1.5 | h3, dialog and sheet titles, in page section headings |
| `text-xl` | 20 px | 1.4 | h2 on a phone, a number in an item card |
| `text-2xl` | 22 px | 1.35 | h2 from `md`, a price on the detail page |
| `text-3xl` | 24 px | 1.3 | h1 on a phone, a plan price |
| `text-4xl` | 28 px | 1.25 | h1 from `md` |
| `--text-input` (new) | 16 px | 1.5 | Text typed in an input, a textarea and a select trigger, at every width (see the class note below) |

**Class for typed text.** The token is `--text-input` with its line height `--text-input--line-height` (1.5), but the plain class `text-input` does not give a font size: Tailwind reads it as the `input` color. The three controls therefore use `text-(length:--text-input) leading-(--text-input--line-height)`.

Base heading styles: h1 `text-3xl md:text-4xl font-semibold`, h2 `text-xl md:text-2xl font-semibold`, h3 `text-lg font-semibold`, h4 `text-base font-semibold`. Heading line height never goes under 1.25, so stacked marks (ễ, ợ) are never clipped. The `Button` keeps `text-sm` for `sm` and `default` and takes `text-base` for `lg`, because the public primary action needs legible text on a phone. A price or other emphasized number is `font-semibold`, never bold, and one step smaller than today (card `text-xl`, detail `text-2xl`, plan `text-3xl`).

### Zones

**Canvas.** A new token `--canvas: #F1F5F9` with `--color-canvas: var(--canvas)`, applied to `body` (`bg-canvas`). It is the page background under every shell. The sidebar token (`#F8FAFC`) is unchanged, so the side menu is a lighter panel separated from the canvas by its border. The header and footer of the public shell and the workspace top bar are white (`bg-background`) with a hairline, so they frame the canvas.

**Zone.** A zone is a `Card` on the canvas: `border`, `--radius-xl` (12 px), `bg-card` white, no shadow, padding from `--card-spacing` set to 20 px (`size="sm"` 16 px). The title row uses `CardHeader`, `CardTitle` (`text-base` 600), an optional `CardDescription` (`text-sm` muted) and an optional `CardAction`. When a zone holds a table or a form, its `CardHeader` has `border-b`, which draws the hairline.

**Item cards.** A card that stands for one item (a listing, a plan) is also a `Card`, but it sits directly on the canvas and never inside a zone, so there is no card in a card. An interactive item card may take `shadow-md` on hover.

**Table in a zone.** The zone is the frame, so the table container loses its own border and radius when it is inside a card (for example with an `in-data-[slot=card]:border-0 in-data-[slot=card]:rounded-none` variant on `[data-slot=table-container]`). Outside a zone it keeps its frame.

**Spacing rhythm** (the 4 px grid):

| Where | Value |
|---|---|
| Page side padding | 16 px on a phone, 24 px from `md` |
| Page top and bottom padding | 24 px on a phone, 32 px from `md` |
| Page header to the first zone, and zone to zone | 24 px |
| Inside a zone: padding, then between field groups or blocks | 20 px, then 16 px (`FieldGroup` gap 20 px) |
| Between related rows or items inside a block | 8 to 12 px |
| Title row to its hairline | 16 px |

**Dividers.** Hairlines (`border`) only inside a zone: under a title row that is followed by a table or a form, between table rows, above a pagination row. No divider between zones; the canvas gap does that job.

**PageHeader** (`src/components/layout/page-header.tsx`, a server friendly component): props `title: ReactNode`, `description?: ReactNode`, `breadcrumb?: ReactNode`, `actions?: ReactNode`. It renders the breadcrumb, then the `h1`, then the description in `text-base` muted, with 8 px between, and the actions at the right from `md` up. It sits on the canvas with no card around it.

**Sample strip.** The dashed strip of switches above each sample screen stays, with a white fill so it reads on the canvas. It is not a zone and not part of the screen.

### Zone maps

| Screen | Page header | Zones | On the canvas |
|---|---|---|---|
| Listing list (public) | Title and intro | Filters zone: search, ward, price, button, no title row | Results heading row (h2 17 px with the sort select), the item card grid, the pagination. State views stand where the grid stands |
| Listing detail (public) | Breadcrumb, listing title, address as description | Price and facts zone, description zone, property zone (name, fees, amenities, each part with its own h2), contact zone (sticky right column from `lg`, right after the facts on a phone) | The gallery image |
| Pricing (public) | Title and intro | The "Cần biết trước khi mua" zone | The three plan item cards |
| Sign in (auth shell) | None: the shell's card is the zone and its title is the h1 | The auth card | The page background |
| My listings (landlord) | Title, description, the "Đăng tin mới" action | One table zone: its title row holds the status tabs, its body is the frameless table | The quota notice (an `Alert`) |
| Post listing (landlord) | Breadcrumb, title, description | "Thông tin chính" zone and "Giá, diện tích và ngày vào ở" zone inside the form, and a tips zone at the side from `xl` | The form notice and the submit row, under the two zones |
| Admin users | Title and description | Filters zone (search, two selects, the accent help line); table zone (title row with the count, frameless table, pagination row under a hairline) | none |

### Files this spec touches

`src/app/layout.tsx` (font), `src/app/globals.css` (font variable, `--canvas`, scale, `--text-input`, base styles, `body`), `src/components/layout/page-header.tsx` (new), `src/components/ui/card.tsx`, `button.tsx`, `table.tsx`, `field.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `sidebar.tsx` (`SidebarInset`), `src/components/shells/site-footer.tsx` and the shells that set a background, the seven screens and the shared helpers under `src/app/dev/ui/screens/`, the gallery under `src/app/dev/ui/`, `scripts/check-contrast.mjs`, `design.md`, and the "Amended by 0004" notes in spec 0003.

### Value sourcing

| Where | Value displayed | Source |
|---|---|---|
| Every page | Body font | Inter from `next/font/google`, the weight list 400, 500 and 600 on a variable font, subsets `vietnamese` and `latin`, variable `--font-inter` (decided here) |
| Every page | Text weight | The three weights in the role table (decided here), through `font-normal`, `font-medium`, `font-semibold` and the base heading styles |
| Every page | Text sizes and line heights | The `--text-*` tokens in `globals.css`, with the values of the Type scale table (decided here) |
| Input, textarea, select trigger | Size of typed text | `--text-input` at 1rem, so iPhone does not zoom on focus (decided here, rule kept from spec 0003) |
| Under every shell | Page background | `--canvas` `#F1F5F9` in `globals.css` (decided here, no Figma variable) |
| Zone | Background, border, radius, padding, shadow | `card` and `border` tokens, `--radius-xl`, `--card-spacing` 20 px, no shadow (decided here) |
| Page and zone | Padding and gaps | The spacing rhythm table, 4 px grid steps (decided here) |
| `PageHeader` | Title, description, breadcrumb, actions | Props from the screen; the title is the screen's one `h1` |
| The seven screens | Rows, labels and copy | Unchanged, from the sample data of spec 0003 under `src/app/dev/ui/screens/` |
| Contrast gate | Pairs and limits | `PAIRS` and the tokens in `globals.css` (spec 0003); the `canvas` pairs are added here |
| Figma | What is compared | The `font` variable and the type styles are no longer compared (decided here) |

### Key invariants

- Only three weights exist: 400, 500, 600. The font range stops at 600.
- Text typed in an input, textarea or select trigger is 16 px at every width.
- Headings keep a line height of at least 1.25.
- A zone is a `Card` on the canvas; a card never sits inside another card.
- The canvas only through `bg-canvas`; no raw color anywhere (the grep of spec 0003 AC-2 still prints nothing).
- Control heights (32, 40, 44 px) and the 44 px public targets do not shrink with the text.
- One font family.

### Edge cases and failure handling

| Case | Handling |
|---|---|
| Google Fonts unreachable at build | `next/font` fails the build loudly; no request to Google at run time; the fallback stack is unchanged, with the size adjusted fallback that `next/font` makes |
| Stacked Vietnamese marks at the smaller headings | Line height stays at 1.25 or more; the test line of AC-1 is checked at every heading size |
| A `bg-muted` element placed straight on the canvas | `muted` and `canvas` share one value, so its fill disappears and only its border shows. Put such an element inside a white zone. The sample strip uses a white fill for this reason |
| Windows forced colors mode | Card borders stay visible, the canvas fill is dropped by the system; zones still read as boxes |
| System dark mode | The page stays light, as in spec 0003 |
| Text size set to 200 percent in the browser | Sizes are in rem and layouts reflow; checked at 320 px |
| A very long listing title | `line-clamp-2` on card titles is unchanged; smaller type simply shows more words |
| `global-error.tsx` | No web font and no `PageHeader`; it picks up the canvas through `globals.css` |
| Figma opened later | Its font variable and type styles still say Be Vietnam Pro; `design.md` says so, and nothing compares them |

### Security model

No new data, endpoint or storage. The font file is fetched once at build and self hosted. No new dependency.

### Configuration required

None. No environment variable and no package (`next/font` ships with Next.js). One new file, `src/components/layout/page-header.tsx`.

### Critical test scenarios

- Happy path: open `/dev/ui/screens/listings` at 390 and 1280. The page is light grey, the filters sit in a white zone, the cards sit on the grey, h1 is 24 px then 28 px, and nothing looks bold beyond 600, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**.
- Computed style probe: read the computed size and weight of `body`, `h1` to `h4`, a button, a label, an input at 390 and 1280 and compare them with the Type scale and weight tables, verifies **AC-2**, **AC-3**.
- Vietnamese: the test line at 320 px shows every mark at each heading size, verifies **AC-1**.
- Card in card: run the `querySelectorAll('[data-slot=card] [data-slot=card]')` count on all seven screens and expect 0; check the table container border inside a zone, verifies **AC-6**.
- Grep gate: the weights grep of AC-2 and the Be Vietnam Pro grep of AC-1 both print nothing, verifies **AC-1**, **AC-2**.
- Failure case: set `--canvas` to `#94A3B8`, run `npm run check`; it fails and names the pair; revert, verifies **AC-7**.
- Unchanged: Tab through the public header and a landlord screen (focus ring as before), check the 44 px targets and the 320 px width on all screens, run `npm run check` and `npm run build`, verifies **AC-8**.
- Docs: `design.md` and the notes in spec 0003 are present, verifies **AC-9**.

## Build plan

Tracer Bullet (your project default): a thin thread first, from the font and tokens to one real screen, then each milestone thickens it. Each milestone is one `/develop` pass. No Figma step and no gate.

**M1. Thin thread: font, tokens and one zoned screen**
1. In `src/app/layout.tsx` replace Be Vietnam Pro by Inter as in the Font paragraph, and update `--font-sans` in `globals.css`, satisfies **AC-1**
2. In `globals.css` restate `--text-xs` to `--text-4xl` and their line heights, add `--text-input`, set the base heading styles and weights, add `--canvas` and `--color-canvas`, and put `bg-canvas` on `body`. Switch `input.tsx`, `textarea.tsx` and `select.tsx` from `text-base` to `text-(length:--text-input)` with `leading-(--text-input--line-height)`, satisfies **AC-2**, **AC-3**, **AC-4**
3. Add `PageHeader`. Turn `Card` into the zone (no shadow, 20 px spacing, `text-base` 600 title). Divide the listing list screen as its zone map says, and check it at 390 and 1280, satisfies **AC-4**, **AC-5**, **AC-6**

**M2. Components and shells**
4. Weights sweep: remove every `font-bold` and any weight above 600, check `font-medium` and `font-semibold` against the role table, give `Button` size `lg` `text-base`, and shrink the prices and numbers one step in the shared helpers, satisfies **AC-2**
5. Shells and shared pieces: white public footer, `SidebarInset` and the auth page on the canvas, white workspace top bar, the frameless table inside a zone, `FieldGroup` gap 20 px, satisfies **AC-4**, **AC-6**

**M3. The other six screens and the gallery**
6. Divide listing detail, pricing, sign in, my listings, post listing and admin users as their zone maps say, using `PageHeader` and `Card` zones, satisfies **AC-5**, **AC-6**
7. Adjust `/dev/ui`: the type specimens show the new scale and weights with the Vietnamese line, the sample strip gets a white fill, and one section shows the canvas, a zone and a `PageHeader`, satisfies **AC-1**, **AC-3**, **AC-4**

**M4. Gates and finish**
8. Add the `canvas` pairs to `PAIRS`, run `npm run contrast`, and fix any failing pair, satisfies **AC-7**
9. Run the grep gates, the computed style probe, the card in card count, the 320 px and console checks, `npm run check` and `npm run build`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-6**, **AC-8**
10. Finish `design.md` (typography, weights, scale roles, canvas, zones, spacing, `PageHeader`, the stale Figma note) and confirm the "Amended by 0004" notes in spec 0003, satisfies **AC-9**

Every AC appears in at least one task and every task names an AC.

## Consequences

**Positive**:
- Smaller, lighter text and clear zones answer the three complaints at the source: size, weight, and hard to tell areas apart.
- One variable font file replaces four static files, and the weight range is locked at 600.
- The look lives in tokens, base styles, `Card` and `PageHeader`, so a later tweak is one edit and every later feature inherits it.
- The screens become the worked example that later features lift from.

**Negative / tradeoffs**:
- The Figma file is stale on font and type styles, and `design.md` has to say so.
- Inter is a very common UI font and less distinctive than Be Vietnam Pro, which was drawn for Vietnamese. It is chosen to be calmer, judged by eye in the browser, and swapping it later is one variable.
- A 15 px body and 13 px UI text are smaller than before; readers who want bigger text must use the browser's zoom until a text size control exists.
- `canvas` and `muted` share one value, so a quiet `bg-muted` box placed straight on the canvas looks like nothing; it belongs inside a white zone.
- The change shows everywhere at once, including `/dev/ui` and the shells, so an unplanned layout shift at some width is possible until M4 checks them.
- The verify steps of spec 0003 that name Be Vietnam Pro, four weights or the old sizes are stale until `/check verify` rereads them.

**Neutral**:
- No new dependency, no environment variable, no data.
- Control heights, colors, radius and the focus ring are unchanged.
- `/dev/ui` stays a 404 in production.

## Follow-up

- [ ] Run `/check verify design system & UI foundation` after this feature, so the font, weight, scale and elevation steps of spec 0003's `verify.md` are rederived from AC-2 and AC-3 as amended here (the scope orders #30 before that verify).
- [ ] Root `AGENTS.md` `## Rules`: add "text weights are 400, 500 and 600 only, sizes come from the `--text-*` tokens, and a page area is a `Card` zone on the `canvas` background" (`/sync`).
- [ ] The Figma `font` variable and `Foundations/Type` styles still say Be Vietnam Pro. Update them only if the file is shared with a designer.
- [ ] If the 15 px body proves too small in review, change `--text-base` alone; no component edits are needed.
- [ ] Optional later: a text size control (normal and large) for readers who want bigger text, and a dark mode canvas value.
- [ ] Features that ship one of these screens lift its markup and `PageHeader` instead of drawing it again.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
