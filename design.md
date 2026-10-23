---
name: rental-management-platform-design-system
source: figma:cdrAcD1PywM8IWdVRt7X0o (M1 and M2 only, a frozen reference)
character: "Deep teal on white, calm and trustworthy, friendly rather than corporate. Rounded 8 px shapes, quiet borders, one strong accent used only for the main action. Vietnamese text is the first class citizen: Be Vietnam Pro, generous line height, every diacritic intact."
tokens: "Real values live in src/app/globals.css (:root and @theme inline). The tokens that existed at the end of M2 were copied from the Figma variables of the Tokens collection, one flat mode named Light, with the same names. A token added from M3 on lives in globals.css alone, and its contrast pair is added to the contrast script in the same change. Never copy a value into this file."
contrast: "Kept true by scripts/check-contrast.mjs, which runs in npm run check. It reads the tokens from src/app/globals.css and fails when a text pair is under 4.5:1 or a control border, icon or focus ring pair is under 3:1. The pairs are listed in PAIRS in that file and shown, with their measured ratio, on /dev/ui. Never copy a ratio into this file."
---

# Design system

The look of the whole site: guests on a phone, landlords and admins on a computer. Spec: [0003](docs/specs/0003-design-system-and-ui-foundation/index.md). Everything here is light mode only.

## Build mandate

You are a senior product designer. Every page ships as a complete, professional product surface: brand, real Vietnamese copy, a considered layout with clear hierarchy, all states (empty, loading, error, rate limited), and supporting content. Never a lone form on an empty page. The full list of disqualifiers is in the UI guide of `/develop`.

Rules for any new screen or component:

- **Code directly, no Figma.** From M3 on, build in code on the existing design system: no new Figma frame and no approval gate. The layout of each screen is decided by `/develop` from the spec, the scope text, the API contract and this file, and the engineer reviews it in the browser. Figma was the source for M1 and M2 only, and it stays as a frozen reference.
- **Tokens only.** Colors, radius, type and shadows come from `src/app/globals.css` through semantic classes (`bg-primary`, `text-muted-foreground`). No raw color, no `bg-red-700`, no hex in a `.tsx` file.
- **Components from `src/components/ui`.** Add them with the shadcn CLI (`npx shadcn@latest add <name>`), one at a time, never `add --all`, never `--overwrite` without approval. After adding, review the file and edit it to match the rules in spec 0003 ("Edits after adding shadcn files").
- **`className` is for layout.** Do not restyle a component from outside. Use its variants (`default`, `secondary`, `outline`, `ghost`, `destructive`) and sizes (`sm`, `default`, `lg`).
- **Vietnamese only.** Every visible and screen reader string is Vietnamese. Money and area use `vi-VN`, dates use `Asia/Ho_Chi_Minh`.
- **Status is never color alone.** Pair color with words, and optionally an icon.
- **Public pages use the `lg` control size** (44 px high) at every width. Dense desktop rows are at least 32 px.

## Character and direction

- Teal `primary` is for the main action and the current place (active nav link). Everything else is quiet: white surfaces, slate text, thin `border` lines.
- Shapes: 8 px radius for controls and small surfaces, 12 px for cards, full round for pills.
- Depth: two levels only. `shadow-sm` for cards, `shadow-md` for menus and dialogs. Prefer a hairline border to a shadow.
- Type: one family, Be Vietnam Pro, weights 400, 500, 600, 700. Scale `text-xs` to `text-4xl` is set in `globals.css`. Headings never get a line height under 1.25, so stacked marks (ễ, ợ) are never clipped.
- Motion: 150 ms on color, shadow and opacity. With reduced motion the durations become 0.01 ms, never `none`.
- Brand mark: a white house (lucide `House`) on a teal rounded square, shown next to the site name.

## Composition patterns

- **Public pages** (mobile first): sticky header (brand, nav links, account area), one `main`, a footer. Content width `max-w-6xl` with 16 px side padding on a phone and 24 px from `md` up. Below `md` the header shows the brand and a 44 by 44 px menu button that opens a sheet with the nav links and the account actions.
- **Sign in and register**: a minimal centered frame, brand on top, one card up to `max-w-sm`.
- **Landlord and admin** (desktop first): a side menu (256 px, collapses to 64 px, becomes a sheet below `lg`) and a top bar with the account menu.
- **Lists**: search and filters on top, the collection, then pagination. Always design the empty, loading, error and rate limited states with it.
- **Forms**: `FieldGroup` and `Field` from shadcn, a visible label for every input, the server error under its own field.

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

The Figma file is on the Starter plan, which allows 3 pages. So there is no `States` or `Shells` page: those frames are sections on `Screens`, named with the prefix `States /`. The shells were built in code (M4) and have no frame.

The file holds M1 and M2 only. Overlays, menus, tables, pagination and shells are built in code and are not drawn here. `/dev/ui` is the living reference for those; there is no Figma frame to compare with.

## Component and usage notes

- Filled buttons (`default`, `destructive`) have no hover change in Figma today. A darker hover color needs a new token pair and an entry in the contrast script before it can be used.
- **Shells.** Never draw a page frame by hand. Public pages sit in `PublicShell`, sign in and register in `AuthShell` (the shell gives the `Card`, the page gives `CardHeader` and `CardContent`), landlord pages in `LandlordShell` and admin pages in `AdminShell` (both built on `WorkspaceShell`). A shell owns the one `main` (`id="main"`, the skip link jumps to it), so a page never renders its own `<main>`. Below `md` the public header shows the brand and a 44 by 44 px menu button that opens a sheet with the nav links and the account actions. The workspace side menu is 256 px, collapses to 64 px (icons, with the label kept for screen readers) and becomes a sheet below `lg`.
- **Nav links.** A feature adds its item to `src/components/shells/nav-config.ts` in the same change that ships its page, so no link points at a page that does not exist. Within one list only the item with the longest matching address is the current page. An icon cannot cross from a server component to a client one as a prop, so the workspace shells are client components (`workspace-shells.tsx`) that read the arrays themselves.
- **Account area.** `AccountMenu` reads the session and `AccountMenuView` only draws a state, so the gallery shows loading, guest and user without a backend. A feature adds its link to `ACCOUNT_LINKS` in the change that ships its page.
- **Error and not found.** Every route group has an `error.tsx` and a `not-found.tsx` built on `RouteError` and `NotFoundState`, and an unknown address renders inside `PublicShell`. `global-error.tsx` brings its own `<html>` and `<body>`, so it has no web font and uses the system font.
- **Forms.** Build a field with `FormField` (`src/components/form/form-field.tsx`), never by hand. It gives the label, control, help text and error their ids, sets `aria-invalid` and `aria-describedby`, and lets a server error move focus to the input. After a failed submit, `useFormFailure` places the messages and `FailureNotice` shows what belongs to no input. A field label stays in the foreground color when the field is invalid; only the message is destructive.
- **Alert or toast.** A toast (`toast()` from `sonner`) is for a short result such as "Đã lưu". Anything the person must read and act on (quota, trial ended, test payment) is an `Alert` that stays on the page. Only the `destructive` alert uses `role="alert"`; the others are a quiet `status`.
- **Shared states.** Use `EmptyState`, `LoadingState`, `ErrorState`, `RateLimitNotice`, `NotFoundState`, `ForbiddenState` and `ImagePlaceholder` from `src/components/states`. The copy for an empty state comes from the feature. `ErrorState` shows the support code only for a 5xx answer.
- **Sizes.** Checkbox and radio are 20 px, with an invisible 44 px tap area around them. Inside a `Button`, a `Spinner` takes `size="sm"`.
- **Skeleton** uses the `accent` tint, because `muted` is almost invisible on white.
- Figma has one more text style than the type scale: `text-xs-medium`, used by badges.
- **Dialog or alert dialog.** A `Dialog` is for a task that needs its own frame (a short form, something to read). An `AlertDialog` is only for confirming something that cannot be undone: the first focus lands on its safe button and a click outside does not close it. A dialog, alert dialog and sheet always have a title (`sr-only` if hidden). The destructive action is `AlertDialogAction variant="destructive"` with words that name the action ("Xóa tin"), never a bare "OK".
- **Sheet.** The phone menu, filters and side details. A dialog or sheet taller than the window scrolls inside itself, never the page behind it.
- **Dropdown menu.** Rows are 40 px high with 16 px text, like the Select menu. Keep the items inside a `DropdownMenuGroup`. A row that deletes or locks uses `variant="destructive"` and a label that says what it does. A button that only has an icon gets an `aria-label` in Vietnamese.
- **Tooltip.** Only a reminder for mouse and keyboard users, never the only place where something is said. `TooltipProvider` is mounted once in `Providers`.
- **Table.** `Table` brings its own rounded, scrolling container, so a wide table scrolls inside it and the page never scrolls sideways. Header cells are muted, rows are about 44 px, numbers are right aligned with `tabular-nums`, a selected row uses `data-state="selected"`. Give a table a `TableCaption` (`sr-only` if the page already has a heading). Long text in a cell uses `truncate` with a `title`, or `whitespace-normal`.
- **Tabs.** `variant="line"` (an underline in the primary color on a hairline) for filters above a list, `default` (a pill on a muted track) for switching small panels. A row that is wider than the window scrolls inside itself.
- **Pagination.** Build a list's page links with `ListPagination` (`src/components/list-pagination.tsx`) from `{ page, pageSize, total }`. Pass `hrefFor` when the page is in the URL (links) or `onPageChange` when it is in state (buttons). Pass `size="lg"` on public pages. It draws nothing for a single page.
- **Card.** Use the full composition (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`). `CardTitle` is a plain `div`: when the card needs a heading in the outline, put the right heading element inside it.
- **Avatar.** Always give it an `AvatarFallback` with the first letter of the name, or of the email.
- **Contrast pairs.** `PAIRS` in `scripts/check-contrast.mjs` is the one list, and `npm run check` fails when a pair is under its limit. When a change puts a text or icon color on a surface that no pair covers yet (say `text-info` on `bg-muted`), add that pair in the same change. A `-foreground` token with no pair of its own fails the check, so a new token pair cannot slip in unmeasured. A tint such as `bg-destructive/10` is a pair of its own, written as `{ token, alpha, over }`. The script measures token pairs, not text over a photo, so look at those by eye.
- **Focus ring and the sidebar.** The ring is drawn outside the control with a 2 px gap (`ring-offset-2`), in `ring` on the page and in `sidebar-ring` on the side menu. The gap color is the surface, so the ring never sits on the control's own fill, which is why `sidebar-ring` is not measured against `sidebar-primary` (same value).

## Responsive and accessibility direction

- Target is WCAG AA: text 4.5:1, control borders, icons and focus rings 3:1.
- Focus ring: 2 px ring plus 2 px offset in `ring`. A transparent outline sits under it (`outline-hidden`), so it still shows in forced colors mode.
- Inputs are 16 px or more, so iPhone does not zoom on focus.
- Every page has a header, nav, one `main` and a footer, plus a skip link. The auth shell is the one exception: a brand header, the skip link and the `main`, with no nav and no footer.
- Long names and addresses: one line labels use `truncate`, card titles use `line-clamp-2`, flex children get `min-w-0`.

## Approvals

One dated line for each Figma gate of M1 and M2. The list ends here: from M3 on there is no gate, so no line is added.

- 2026-10-23: **M1** approved. Foundations (`Tokens`, `Type`, `Shape`), `Button` and `Icon Button` sets, `Brand/Mark`, `Nav Link`, and `Shells/Public/Header` at 1280 and 390.
- 2026-10-24: **M2** gate skipped. The engineer asked to write the code right after the frames were drawn ("thực hiện viết code luôn"), so these frames were not reviewed in Figma before the code: form controls, `Field`, `Alert`, `Badge`, `Skeleton`, `Spinner`, `Separator`, `Toast`, the shared states and the server error forms. The code follows them. If a later review changes a frame, Figma wins and the code is changed to match.
