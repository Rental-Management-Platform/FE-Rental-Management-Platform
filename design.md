---
name: rental-management-platform-design-system
source: figma:cdrAcD1PywM8IWdVRt7X0o
character: "Deep teal on white, calm and trustworthy, friendly rather than corporate. Rounded 8 px shapes, quiet borders, one strong accent used only for the main action. Vietnamese text is the first class citizen: Be Vietnam Pro, generous line height, every diacritic intact."
tokens: "Real values live in src/app/globals.css (:root and @theme inline). They are copied from the Figma variables of the Tokens collection, one flat mode named Light, and the names are the same in both places. Never copy a value into this file."
contrast: "Verified when the tokens were chosen (spec 0003): foreground on background 17.85:1, primary-foreground on primary 5.47:1, secondary-foreground on secondary 9.09:1, muted-foreground on muted 6.92:1, accent-foreground on accent 8.41:1, destructive-foreground on destructive 6.47:1, success 5.02:1, warning 8.15:1, info 6.70:1. Control border input on white 4.76:1 (needs 3:1). Focus ring on white 5.47:1 (needs 3:1). The script that keeps this true arrives in milestone M6."
---

# Design system

The look of the whole site: guests on a phone, landlords and admins on a computer. Spec: [0003](docs/specs/0003-design-system-and-ui-foundation/index.md). Everything here is light mode only.

## Build mandate

You are a senior product designer. Every page ships as a complete, professional product surface: brand, real Vietnamese copy, a considered layout with clear hierarchy, all states (empty, loading, error, rate limited), and supporting content. Never a lone form on an empty page. The full list of disqualifiers is in the UI guide of `/develop`.

Rules for any new screen or component:

- **Figma first.** A new component or screen is drawn in the Figma file below and approved before its code is written. Code copies Figma; when they differ, Figma wins.
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

| Page        | Frame or component                           | What it holds                                                               |
| ----------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| Foundations | `Foundations/Tokens`                         | One swatch bound to each of the 36 variables of the `Tokens` collection     |
| Foundations | `Foundations/Type`                           | Text styles `text-xs` to `text-4xl` plus medium, semibold and bold variants |
| Foundations | `Foundations/Shape`                          | Radius, the two shadows, spacing steps                                      |
| Components  | `Button` (set)                               | 5 variants by 3 sizes, with hover, focus and disabled states                |
| Components  | `Icon Button`, `Brand/Mark`, `Nav Link`      | The header parts                                                            |
| Screens     | `Shells/Public/Header 1280` and `Header 390` | The public header, guest account area                                       |

More frames are added by later milestones (form controls, states, overlays, shells, sample screens).

## Component and usage notes

- Filled buttons (`default`, `destructive`) have no hover change in Figma today. A darker hover color needs a new token pair and an entry in the contrast script before it can be used.
- The public header below `md` shows only the brand until the menu sheet is built in milestone M4.

## Responsive and accessibility direction

- Target is WCAG AA: text 4.5:1, control borders, icons and focus rings 3:1.
- Focus ring: 2 px ring plus 2 px offset in `ring`. A transparent outline sits under it (`outline-hidden`), so it still shows in forced colors mode.
- Inputs are 16 px or more, so iPhone does not zoom on focus.
- Every page has a header, nav, one `main` and a footer, plus a skip link (the skip link and footer arrive in M4).
- Long names and addresses: one line labels use `truncate`, card titles use `line-clamp-2`, flex children get `min-w-0`.

## Approvals

One dated line for each gate the engineer approved in Figma before its code was written.

- 2026-10-23: **M1** approved. Foundations (`Tokens`, `Type`, `Shape`), `Button` and `Icon Button` sets, `Brand/Mark`, `Nav Link`, and `Shells/Public/Header` at 1280 and 390.
