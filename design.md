---
name: rental-management-platform-design-system
source: figma:cdrAcD1PywM8IWdVRt7X0o (M1 and M2 only, a frozen reference)
character: "Deep teal on white, calm and trustworthy, friendly rather than corporate. Rounded 8 px shapes, quiet borders, one strong accent used only for the main action. Vietnamese text is the first class citizen: Inter with its Vietnamese subset, small and light type, generous line height, every diacritic intact. Each part of a page is a white zone on a very light grey canvas."
tokens: "Real values live in src/app/globals.css (:root and @theme inline). The tokens that existed at the end of M2 were copied from the Figma variables of the Tokens collection, one flat mode named Light, with the same names. A token added from M3 on lives in globals.css alone, and its contrast pair is added to the contrast script in the same change. Never copy a value into this file."
contrast: "Kept true by scripts/check-contrast.mjs, which runs in npm run check. It reads the tokens from src/app/globals.css and fails when a text pair is under 4.5:1 or a control border, icon or focus ring pair is under 3:1. The pairs are listed in PAIRS in that file and shown, with their measured ratio, on /dev/ui. Never copy a ratio into this file."
---

# Design system

The look of the whole site: guests on a phone, landlords and admins on a computer. Specs: [0003](docs/specs/0003-design-system-and-ui-foundation/index.md) (tokens, components, shells) and [0004](docs/specs/0004-type-and-layout-refinement/index.md) (font, type scale, weights, canvas and zones; where the two disagree, 0004 wins). Everything here is light mode only.

## Build mandate

You are a senior product designer. Every page ships as a complete, professional product surface: brand, real Vietnamese copy, a considered layout with clear hierarchy, all states (empty, loading, error, rate limited), and supporting content. Never a lone form on an empty page. The full list of disqualifiers is in the UI guide of `/develop`.

Rules for any new screen or component:

- **Code directly, no Figma.** From M3 on, build in code on the existing design system: no new Figma frame and no approval gate. The layout of each screen is decided by `/develop` from the spec, the scope text, the API contract and this file, and the engineer reviews it in the browser. Figma was the source for M1 and M2 only, and it stays as a frozen reference.
- **Tokens only.** Colors, radius, type and shadows come from `src/app/globals.css` through semantic classes (`bg-primary`, `text-muted-foreground`). No raw color, no `bg-red-700`, no hex in a `.tsx` file.
- **Weights and sizes from the scale.** Only three weights exist: 400, 500 and 600 (see Type). Never `font-bold`, never an arbitrary size such as `text-[17px]`; take a step of the `text-*` scale.
- **A page area is a zone.** Each part of a page is a `Card` on the canvas, and a card never sits inside another card (see Canvas, zones and spacing). Every page except sign in starts with `PageHeader`.
- **Components from `src/components/ui`.** Add them with the shadcn CLI (`npx shadcn@latest add <name>`), one at a time, never `add --all`, never `--overwrite` without approval. After adding, review the file and edit it to match the rules in spec 0003 ("Edits after adding shadcn files").
- **`className` is for layout.** Do not restyle a component from outside. Use its variants (`default`, `secondary`, `outline`, `ghost`, `destructive`) and sizes (`sm`, `default`, `lg`).
- **Vietnamese only.** Every visible and screen reader string is Vietnamese. Money and area use `vi-VN`, dates use `Asia/Ho_Chi_Minh`.
- **Status is never color alone.** Pair color with words, and optionally an icon.
- **Public pages use the `lg` control size** (44 px high) at every width. Dense desktop rows are at least 32 px.

## Character and direction

- Teal `primary` is for the main action and the current place (active nav link). Everything else is quiet: white surfaces, slate text, thin `border` lines.
- Shapes: 8 px radius for controls and small surfaces, 12 px for zones and cards, full round for pills.
- Depth: a zone has no shadow, only a hairline border. `shadow-md` is for menus and dialogs, and an interactive item card may take it on hover. Prefer a hairline border to a shadow.
- Type: one family, Inter, three weights (400, 500, 600). The scale `text-xs` to `text-4xl` and `text-input` is set in `globals.css`, and the roles of each step are under Type. Headings never get a line height under 1.25, so stacked marks (ễ, ợ) are never clipped.
- Motion: 150 ms on color, shadow and opacity. With reduced motion the durations become 0.01 ms, never `none`.
- Brand mark: a white house (lucide `House`) on a teal rounded square, shown next to the site name.

## Composition patterns

- **Public pages** (mobile first): sticky white header (brand, nav links, account area), one `main`, a white footer, the canvas between them. Content width `max-w-6xl` with 16 px side padding on a phone and 24 px from `md` up. Below `md` the header shows the brand and a 44 by 44 px menu button that opens a sheet with the nav links and the account actions.
- **Sign in and register**: a minimal centered frame on the canvas, brand on top, one card up to `max-w-sm`. The card is the zone and its title is the page `h1`, so there is no `PageHeader`.
- **Landlord and admin** (desktop first): a side menu (256 px, collapses to 64 px, becomes a sheet below `lg`) and a white top bar with the account menu. The content area stands on the canvas.
- **Lists**: a filters zone on top, then the collection and its pagination (item cards on the canvas, or a table zone). Always design the empty, loading, error and rate limited states with it, inside the same zone.
- **Forms**: `FieldGroup` and `Field` from shadcn, a visible label for every input, the server error under its own field.

## Type

One family, Inter, loaded in `src/app/layout.tsx` as a variable font with the range 400 to 600 and the subsets `vietnamese` and `latin`. The range stops at 600, so a stray bold cannot render. Sizes and line heights are the `--text-*` tokens in `globals.css`; this file names the roles and never copies the numbers.

| Role                                                                        | Weight |
| --------------------------------------------------------------------------- | ------ |
| Body text, descriptions, helper text, table cells, input values             | 400    |
| Field labels, buttons, tabs, badges, table heads, menu rows, links that act | 500    |
| Headings h1 to h4, card, dialog and sheet titles, the site name, prices     | 600    |

| Token        | Used for                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------- |
| `text-xs`    | Captions, badges                                                                             |
| `text-sm`    | UI text: labels, buttons, tabs, helper text, table cells                                     |
| `text-base`  | Body text, page descriptions, zone titles, menu rows, `lg` buttons, h4                       |
| `text-lg`    | h3, dialog and sheet titles, the heading row of a result list                                |
| `text-xl`    | h2 on a phone, a number in an item card                                                      |
| `text-2xl`   | h2 from `md`, a price on the detail page                                                     |
| `text-3xl`   | h1 on a phone, a plan price                                                                  |
| `text-4xl`   | h1 from `md`                                                                                 |
| `text-input` | Text typed in an input, a textarea or a select trigger, at every width (16 px, see the rule) |

- Headings take their size and weight from the base styles in `globals.css` (h1 `text-3xl md:text-4xl`, h2 `text-xl md:text-2xl`, h3 `text-lg`, h4 `text-base`, all `font-semibold`). A heading that is a zone title sits inside `CardTitle` and takes `text-base`, so every zone title is one size; a heading that stands on the canvas keeps its base style, or a named step such as `text-lg` for the heading row of a result list.
- A price or other emphasized number is `font-semibold`, never bold.
- Write the input size as `text-(length:--text-input)`. The plain class `text-input` is the `input` color, not the size.
- If the body proves too small in review, change `--text-base` alone. No component needs an edit.

## Canvas, zones and spacing

- **Canvas.** The page background is the `canvas` token (`bg-canvas`, set once on `body`), a very light grey under every shell. The public header and footer and the workspace top bar are white with a hairline, so they frame it. The side menu keeps the `sidebar` token. The token has no Figma variable.
- **Zone.** A zone is a `Card` on the canvas: white, 1 px `border`, 12 px radius, no shadow, 20 px padding (16 px for `size="sm"`), title in `CardTitle` (`text-base`, 600). A zone that holds a table or a form puts `border-b` on its `CardHeader`, which draws the hairline under the title row. A filters zone has no title row.
- **No card in a card.** An item card (a listing, a plan) is also a `Card`, but it stands on the canvas, never inside a zone. If a part needs a quiet box inside a zone, use a border or a tint, not a second `Card`.
- **A `bg-muted` box on the canvas disappears**, because `muted` and `canvas` are the same value. Put it inside a white zone. The dashed sample strip on each gallery screen has a white fill for this reason.
- **Table in a zone.** The zone is the frame. A table inside a card loses its own border and radius and runs edge to edge, so the card drops the gap under its title row and its bottom padding. A table outside a zone keeps its frame.
- **Dividers.** Hairlines only inside a zone: under a title row that is followed by a table or a form, between rows, above a pagination row. No line between zones; the gap of canvas does that.
- **Spacing rhythm** (4 px grid):

| Where                                                       | Value                                         |
| ----------------------------------------------------------- | --------------------------------------------- |
| Page side padding                                           | 16 px on a phone, 24 px from `md`             |
| Page top and bottom padding                                 | 24 px on a phone, 32 px from `md`             |
| Page header to the first zone, and zone to zone             | 24 px (`gap-6`)                               |
| Inside a zone: padding, then between field groups or blocks | 20 px, then 16 px (`FieldGroup` gap is 20 px) |
| Between related rows or items inside a block                | 8 to 12 px                                    |
| Title row to its hairline                                   | 16 px                                         |

- **Who sets the page padding.** A public page sets it on its own root: `mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8`. The workspace shell already pads its `main`, so a landlord or admin page only needs `flex flex-col gap-6`.
- **`PageHeader`** (`src/components/layout/page-header.tsx`). Props: `title`, `description?`, `breadcrumb?`, `actions?`. It renders the breadcrumb, the page's one `h1`, then the description in `text-base` muted, 8 px apart, and puts `actions` at the right from `md` and under the text on a phone. It stands on the canvas with no card. Sign in is the one page that does not use it.
- **Zone maps.** The seven screens at `/dev/ui/screens` are the worked examples of how a page is divided (which parts are zones and which stand on the canvas). Lift the markup from the screen closest to the new page.

## Figma

File: `cdrAcD1PywM8IWdVRt7X0o` (https://www.figma.com/design/cdrAcD1PywM8IWdVRt7X0o). Libraries attached for layout ideas only: Material 3 Design Kit, Simple Design System.

| Page        | Frame or component                                                                                                             | What it holds                                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Foundations | `Foundations/Tokens`                                                                                                           | One swatch bound to each of the 36 variables of the `Tokens` collection                       |
| Foundations | `Foundations/Type`                                                                                                             | Text styles `text-xs` to `text-4xl` plus medium, semibold and bold variants                   |
| Foundations | `Foundations/Shape`                                                                                                            | Radius, the two shadows, spacing steps                                                        |
| Components  | `Button` (set)                                                                                                                 | 5 variants by 3 sizes, with hover, focus and disabled states                                  |
| Components  | `Icon Button`, `Brand/Mark`, `Nav Link`                                                                                        | The header parts                                                                              |
| Screens     | `Shells/Public/Header 1280` and `Header 390`                                                                                   | The public header, guest account area                                                         |
| Components  | `Input`, `Textarea`, `Select`, `Select Menu`                                                                                   | Sizes 32, 40 and 44 px; default, filled, focus, invalid, disabled                             |
| Components  | `Checkbox`, `Radio`, `Switch`                                                                                                  | 20 px box, 20 px circle, 44 by 24 px track; focus, invalid, disabled                          |
| Components  | `Field`                                                                                                                        | Label, control, then help text or the error, for input, textarea, select, checkbox            |
| Components  | `Alert`, `Badge`, `Toast`                                                                                                      | Alert: default, info, success, warning, destructive. Badge: seven variants. Toast: five types |
| Components  | `Skeleton`, `Spinner`, `Separator`                                                                                             | Skeleton shapes line, block, circle; spinner 16, 20, 24 px                                    |
| Screens     | `States / EmptyState`, `ErrorState`, `RateLimitNotice`, `NotFoundState and ForbiddenState`, `ImagePlaceholder`, `LoadingState` | The shared states                                                                             |
| Screens     | `States / Server errors in a form`, `States / Toast in context`                                                                | The AC-6 demo (400, 409, 429, 500) and a toast on a 390 wide phone                            |

**Stale since spec 0004.** The Figma `font` variable and the `Foundations/Type` text styles still say Be Vietnam Pro, four weights and the old sizes (and `Foundations/Shape` still shows a card shadow). Nothing compares them any more, and the code does not follow them. The type of this site is Inter at three weights, as written under Type. Update the file only if it is shared with a designer. The `text-xs-medium` style of Figma is the badge text, which is `text-xs` at weight 500 in code.

The Figma file is on the Starter plan, which allows 3 pages. So there is no `States` or `Shells` page: those frames are sections on `Screens`, named with the prefix `States /`. The shells were built in code (M4) and have no frame.

The file holds M1 and M2 only. Overlays, menus, tables, pagination and shells are built in code and are not drawn here. `/dev/ui` is the living reference for those, and the seven sample screens at `/dev/ui/screens` show them working together on fake data. There is no Figma frame to compare with.

## Component and usage notes

- Filled buttons (`default`, `destructive`) have no hover change in Figma today. A darker hover color needs a new token pair and an entry in the contrast script before it can be used.
- **Shells.** Never draw a page frame by hand. Public pages sit in `PublicShell`, sign in and register in `AuthShell` (the shell gives the `Card`, the page gives `CardHeader` and `CardContent`), landlord pages in `LandlordShell` and admin pages in `AdminShell` (both built on `WorkspaceShell`). A shell owns the one `main` (`id="main"`, the skip link jumps to it), so a page never renders its own `<main>`. Below `md` the public header shows the brand and a 44 by 44 px menu button that opens a sheet with the nav links and the account actions. The workspace side menu is 256 px, collapses to 64 px (icons, with the label kept for screen readers) and becomes a sheet below `lg`.
- **Nav links.** A feature adds its item to `src/components/shells/nav-config.ts` in the same change that ships its page, so no link points at a page that does not exist. Within one list only the item with the longest matching address is the current page. An icon cannot cross from a server component to a client one as a prop, so the workspace shells are client components (`workspace-shells.tsx`) that read the arrays themselves.
- **Account area.** `AccountMenu` reads the session and `AccountMenuView` only draws a state, so the gallery shows loading, guest and user without a backend. A feature adds its link to `ACCOUNT_LINKS` in the change that ships its page.
- **Error and not found.** Every route group has an `error.tsx` and a `not-found.tsx` built on `RouteError` and `NotFoundState`, and an unknown address renders inside `PublicShell`. `global-error.tsx` brings its own `<html>` and `<body>`, so it has no web font and uses the system font.
- **Forms.** Build a field with `FormField` (`src/components/form/form-field.tsx`), never by hand. It gives the label, control, help text and error their ids, sets `aria-invalid` and `aria-describedby`, and lets a server error move focus to the input. After a failed submit, `useFormFailure` places the messages and `FailureNotice` shows what belongs to no input. A field label stays in the foreground color when the field is invalid; only the message is destructive. A form keeps its values as text, and when the Zod schema turns that text into numbers or `null`s, `useForm` gets the output type as its third generic (`useForm<Input, unknown, Output>`), which `FormField` accepts. The sign in and post listing screens under `/dev/ui/screens` are worked examples.
- **Sample screens.** `/dev/ui/screens` holds a listing list, a listing detail, a pricing page, sign in, my listings, post listing and an admin users table, built from the tokens, the base components, the shared states and the shells, on fixed data shaped like the API answers. A feature that ships one of these screens lifts the markup from there (the listing card in `listing-card.tsx`, the tables, the forms) and does not redraw it. The dashed strip at the top of each screen is only for the gallery. The helpers in `sample-format.ts` move to `src/lib/format.ts` when the first feature shows a price.
- **Alert or toast.** A toast (`toast()` from `sonner`) is for a short result such as "Đã lưu". Anything the person must read and act on (quota, trial ended, test payment) is an `Alert` that stays on the page. Only the `destructive` alert uses `role="alert"`; the others are a quiet `status`.
- **Shared states.** Use `EmptyState`, `LoadingState`, `ErrorState`, `RateLimitNotice`, `NotFoundState`, `ForbiddenState` and `ImagePlaceholder` from `src/components/states`. The copy for an empty state comes from the feature. `ErrorState` shows the support code only for a 5xx answer.
- **Sizes.** Checkbox and radio are 20 px, with an invisible 44 px tap area around them. Inside a `Button`, a `Spinner` takes `size="sm"`.
- **Skeleton** uses the `accent` tint, because `muted` is almost invisible on white.
- **Dialog or alert dialog.** A `Dialog` is for a task that needs its own frame (a short form, something to read). An `AlertDialog` is only for confirming something that cannot be undone: the first focus lands on its safe button and a click outside does not close it. A dialog, alert dialog and sheet always have a title (`sr-only` if hidden). The destructive action is `AlertDialogAction variant="destructive"` with words that name the action ("Xóa tin"), never a bare "OK".
- **Sheet.** The phone menu, filters and side details. A dialog or sheet taller than the window scrolls inside itself, never the page behind it.
- **Dropdown menu.** Rows are 40 px high with `text-base` text at weight 500, like the Select menu. Keep the items inside a `DropdownMenuGroup`. A row that deletes or locks uses `variant="destructive"` and a label that says what it does. A button that only has an icon gets an `aria-label` in Vietnamese.
- **Tooltip.** Only a reminder for mouse and keyboard users, never the only place where something is said. `TooltipProvider` is mounted once in `Providers`.
- **Table.** `Table` brings its own rounded, scrolling container, so a wide table scrolls inside it and the page never scrolls sideways. Inside a `Card` the container loses its border and radius, because the zone is the frame. Header cells are muted and weight 500, rows are about 44 px, numbers are right aligned with `tabular-nums`, a selected row uses `data-state="selected"`. Give a table a `TableCaption` (`sr-only` if the page already has a heading). Long text in a cell uses `truncate` with a `title`, or `whitespace-normal`.
- **Tabs.** `variant="line"` (an underline in the primary color on a hairline) for filters above a list, `default` (a pill on a muted track) for switching small panels. A row that is wider than the window scrolls inside itself.
- **Pagination.** Build a list's page links with `ListPagination` (`src/components/list-pagination.tsx`) from `{ page, pageSize, total }`. Pass `hrefFor` when the page is in the URL (links) or `onPageChange` when it is in state (buttons). Pass `size="lg"` on public pages. It draws nothing for a single page.
- **Card.** A `Card` is a zone (see Canvas, zones and spacing). Use the full composition (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`). `CardTitle` is a plain `div`: when the card needs a heading in the outline, put the right heading element inside it with `text-base`.
- **Avatar.** Always give it an `AvatarFallback` with the first letter of the name, or of the email.
- **Contrast pairs.** `PAIRS` in `scripts/check-contrast.mjs` is the one list, and `npm run check` fails when a pair is under its limit. When a change puts a text or icon color on a surface that no pair covers yet (say `text-info` on `bg-muted`), add that pair in the same change. A `-foreground` token with no pair of its own fails the check, so a new token pair cannot slip in unmeasured. A tint such as `bg-destructive/10` is a pair of its own, written as `{ token, alpha, over }`. The script measures token pairs, not text over a photo, so look at those by eye.
- **Focus ring and the sidebar.** The ring is drawn outside the control with a 2 px gap (`ring-offset-2`), in `ring` on the page and in `sidebar-ring` on the side menu. The gap color is the surface, so the ring never sits on the control's own fill, which is why `sidebar-ring` is not measured against `sidebar-primary` (same value).

## Responsive and accessibility direction

- Target is WCAG AA: text 4.5:1, control borders, icons and focus rings 3:1.
- Focus ring: 2 px ring plus 2 px offset in `ring`. A transparent outline sits under it (`outline-hidden`), so it still shows in forced colors mode.
- Text typed in an input, textarea or select trigger is 16 px at every width (`--text-input`), so iPhone does not zoom on focus. It is the one size that does not shrink with the rest of the scale.
- Every page has a header, nav, one `main` and a footer, plus a skip link. The auth shell is the one exception: a brand header, the skip link and the `main`, with no nav and no footer.
- Long names and addresses: one line labels use `truncate`, card titles use `line-clamp-2`, flex children get `min-w-0`.

## Approvals

One dated line for each Figma gate of M1 and M2. The list ends here: from M3 on there is no gate, so no line is added.

- 2026-10-23: **M1** approved. Foundations (`Tokens`, `Type`, `Shape`), `Button` and `Icon Button` sets, `Brand/Mark`, `Nav Link`, and `Shells/Public/Header` at 1280 and 390.
- 2026-10-24: **M2** gate skipped. The engineer asked to write the code right after the frames were drawn ("thực hiện viết code luôn"), so these frames were not reviewed in Figma before the code: form controls, `Field`, `Alert`, `Badge`, `Skeleton`, `Spinner`, `Separator`, `Toast`, the shared states and the server error forms. The code follows them. If a later review changes a frame, Figma wins and the code is changed to match.
