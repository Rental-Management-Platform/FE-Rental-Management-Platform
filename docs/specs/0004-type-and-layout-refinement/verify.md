# Verify: type and layout refinement · spec 0004 · updated 2026-10-24

_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones. Open each page with `npm run dev` (port 5173). Probe sizes and weights with `getComputedStyle` in the browser console._

## UI / manual

- [x] Open `/dev/ui` at 320 px wide. The line "Nguyễn Thị Hồng Nhung, đường Lê Văn Việt, phường Hiệp Phú" shows with no missing glyph and no clipped mark at the h1, h2, h3, h4 and body sizes → AC-1
- [x] On `/dev/ui`, `getComputedStyle(document.body).fontFamily` starts with the Inter family name → AC-1
- [x] On `/dev/ui`, read the computed weight of body text (400), h1 to h4 (600), a button, a label, a tab, a badge and a table head (500), a card title (600). No element has a weight above 600 → AC-2
- [x] Open `/dev/ui/screens/listings` at 390 and at 1280. Body is 15 px, a `text-sm` element 13 px, h1 24 px then 28 px, and every heading line height is at least 1.25 times its size → AC-3
- [x] Type into the search input, a textarea and a select trigger at 390 and at 1280. The typed text is 16 px at both widths → AC-3
- [x] Open each of the seven screens (they use the public, auth and workspace shells). `getComputedStyle(document.body).backgroundColor` is `rgb(241, 245, 249)` every time → AC-4
- [x] The public header and footer, the workspace top bar and every zone card are white. The workspace content area and the sign in page stand on the grey canvas → AC-4
- [x] A zone has a 1 px border, 12 px radius, no shadow and 20 px padding (16 px for `size="sm"`). A zone that holds a table or a form has a hairline under its title row → AC-4
- [x] Each of the six screens outside the auth shell has exactly one `h1`, drawn by `PageHeader`. At 1280 the actions sit at the right of the text, at 390 they sit under it → AC-5
- [x] Listing list: the filters zone has no title row, and the item cards, results heading row and pagination stand on the canvas → AC-6
- [x] Listing detail: breadcrumb, title and address in the page header; the image on the canvas; price and facts, description, property (three parts, each with its own h2) and contact as zones. At 1280 the contact zone is sticky on the right, at 390 it comes right after the facts → AC-6
- [x] Pricing: the three plan cards stand on the canvas and "Cần biết trước khi mua" is one white zone → AC-6
- [x] Sign in: the auth card is the one zone, its title is the `h1`, and the page has no `PageHeader` → AC-6
- [x] My listings (1440): the quota notice stands on the canvas; one table zone has the status tabs as its title row, with the hairline under them and a table with no frame of its own. Delete the last "Admin đã ẩn" row: the empty tab fills the same zone without a dashed border → AC-6
- [x] Post listing (1440): "Thông tin chính" and "Giá, diện tích và ngày vào ở" are two zones, each a labelled group with a hairline under its title row. The notice and the submit row stand on the canvas under them, and the tips zone sits at the side from `xl` → AC-6
- [x] Admin users (1440): a filters zone (search, two selects, the accent help line) and a table zone (count in the title row, frameless table, pagination under a hairline). Switch the sample state to empty, loading, error and rate limited: each fills the table zone and works → AC-6
- [x] Page side padding is 16 px on a phone and 24 px from `md`. The gap between the page header and the first zone, and between two zones, is 24 px → AC-6
- [x] Open `/dev/ui` and the sample strip of any screen. The strip has a white fill and reads on the canvas. The "Nền, vùng và đầu trang" section shows the canvas, a zone and a `PageHeader` → AC-4, AC-5
- [x] Public controls stay 44 px high and the header menu button 44 by 44 px. Dense desktop rows stay at least 32 px. The focus ring is unchanged (Tab through the public header and one landlord screen) → AC-8
- [x] At 320 px no screen scrolls sideways: the seven screens and `/dev/ui`. `document.documentElement.scrollWidth` equals `clientWidth` on each → AC-8
- [x] No hydration warning and no console error on `/` and `/dev/ui` → AC-8
- [x] Open `design.md`: it records Inter, the three weights, the scale and its roles, the canvas token, the zone rules, the spacing rhythm and `PageHeader`, and it says the Figma `font` variable and `Foundations/Type` styles are stale → AC-9
- [x] Open spec 0003: an "Amended by 0004" note sits at the Summary, AC-2, AC-3, the Font and Type scale bullets, the elevation bullet and the one font family invariant. Its AC-2 comparison no longer includes the `font` variable → AC-9

## Value sourcing (one step per row of the Value sourcing table)

- [x] Body font: in a production build, the Network tab on `/dev/ui` loads one Inter file per subset (`vietnamese`, `latin`) from the site itself, and no request goes to Google at run time → AC-1
- [x] Text weight: search the source for `font-normal`, `font-medium`, `font-semibold` and the base heading styles only. The weights grep of AC-2 prints nothing → AC-2
- [x] Sizes and line heights: edit `--text-base` alone in `globals.css` and reload; body text and every `text-base` element change size with no component edit. Revert it → AC-3
- [ ] Input text size: at 390 wide, focus an input on an iPhone sized viewport. Typed text is 16 px and the page does not zoom → AC-3
- [x] Page background: set `--canvas` to another color. The page background under all four shells follows, and no `.tsx` file holds a raw color. Revert it → AC-4
- [x] Zone: change `--card-spacing` on one `Card` through its class. Padding follows and no shadow appears. Check that a `bg-muted` box placed straight on the canvas shows only its border, and that the sample strip does not have that problem → AC-4
- [x] Page and zone padding and gaps: measure the spacing rhythm table values on the listing list at 390 and 1280 → AC-6
- [x] `PageHeader`: render it with and without `description`, `breadcrumb` and `actions`. The title is always the one `h1` → AC-5
- [x] The seven screens' rows, labels and copy are unchanged from the sample data of spec 0003 (compare against `sample-data.ts`) → AC-6
- [x] Contrast gate: set `--canvas` to `#94A3B8` and run `npm run check`. It fails and names the pair. Restore the value → AC-7
- [ ] Figma: open the Figma file. Its `font` variable and `Foundations/Type` styles still say Be Vietnam Pro, and `design.md` says so. Nothing compares them → AC-9

## Commands

- [x] `grep -rnE "font-(bold|extrabold|black|thin|extralight|light)|font-\[[0-9]+\]" src --include="*.ts" --include="*.tsx"` → prints nothing → AC-2
- [x] `grep -rniE "Be_Vietnam|be-vietnam" src` → prints nothing → AC-1
- [x] In the browser console on each of the seven screens: `document.querySelectorAll('[data-slot=card] [data-slot=card]').length` → 0 → AC-6
- [x] On a screen with a table zone: `getComputedStyle(document.querySelector('[data-slot=card] [data-slot=table-container]')).borderTopWidth` → `0px` → AC-6
- [x] `npm run check` → passes, including the `canvas` pairs in `PAIRS` → AC-7, AC-8
- [x] `npm run build` → passes → AC-8

## Acceptance-criteria coverage

- AC-1 covered by the 320 px Vietnamese line, the font family probe, the Network check and the Be Vietnam Pro grep
- AC-2 covered by the computed weight probe, the weights grep and the text weight step
- AC-3 covered by the 390 and 1280 size probe, the typed text step and the `--text-base` edit step
- AC-4 covered by the body background probe, the white bar and zone checks, the zone look step and the canvas edit step
- AC-5 covered by the one `h1` step, the `/dev/ui` section step and the `PageHeader` props step
- AC-6 covered by the seven per screen steps, the padding and gap step, the sample rows step and the two card in card and table border commands
- AC-7 covered by the `#94A3B8` failure step and `npm run check`
- AC-8 covered by the 44 px and focus ring step, the 320 px step, the console step, `npm run check` and `npm run build`
- AC-9 covered by the `design.md` step, the spec 0003 notes step and the Figma step
