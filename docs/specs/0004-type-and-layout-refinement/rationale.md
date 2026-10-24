# 0004. Rationale: type and layout refinement

The build spec is [index.md](index.md). This file holds the reasoning, the options and the evidence behind it. A build never needs it.

## Context

Spec 0003 gave the project its design system: Be Vietnam Pro in four weights, a type scale from 12 to 36 px, white pages with white bordered cards, and four shells. After milestone M5 built the seven sample screens, the engineer reviewed them in the browser and said they look cluttered: the text is big and thick, and it is hard to see where one area ends and the next begins. The engineer also said the font may change if that helps.

The complaints have three separate causes, and they point at three levers. Size: headings run 24 to 36 px against components at 14 px, and a price is 30 px. Weight: headings are 600 to 700, and labels, buttons, badges and table heads are all 500, so many bold shapes sit side by side. Zoning: the page is white, the cards are white, and the borders are a pale grey, so areas have almost the same color and read as one surface; spacing inside and between blocks follows no single rhythm.

The constraints that stay: WCAG AA contrast (checked by a script in `npm run check`), inputs at 16 px so iPhone does not zoom on focus, control heights of 32, 40 and 44 px, Vietnamese stacked marks that must never be clipped, and a Figma file that is a frozen reference since milestone M3. The font family was drawn in Figma in milestone M1, so a change of font touches something spec 0003 says must match.

Not deciding leaves every later feature copying screens the engineer already finds hard to read, and the rework grows with each page built.

## Options considered

### Option 1: Change the tokens, the base styles and the shared Card in place, then divide each screen into zones

Change the font, the weights and the scale where they are defined (`layout.tsx`, `globals.css`, a few shared components), add a `canvas` background and a `PageHeader`, tune `Card` into the zone, and rebuild the seven screens on that. Roll it out thread first.

**Pros**:
- Fixes all three causes at their source, and later pages inherit the result.
- Most of the change is a handful of tokens, so it is small, quick to review and easy to adjust.
- The sample screens become a correct worked example before real features copy them.

**Cons**:
- It touches the look of everything at once, so a layout may shift at some width until it is checked.
- Several decisions at once (font, scale, weight, zones) make the first review heavier.

### Option 2: Keep the current type and only add zoning

Add the canvas and cards and leave font, size and weight as they are.

**Pros**:
- Smallest change, no font swap, nothing stale in Figma.

**Cons**:
- Leaves unsolved the complaint the engineer put first: text that is big and thick.

### Option 3: Keep Be Vietnam Pro and only use lighter weights

Drop 700, use 400 to 600, shrink the scale, and keep the font.

**Pros**:
- Keeps a font drawn for Vietnamese and nothing in Figma changes for the font.

**Cons**:
- The letterforms stay wide and full, which is part of the heavy look; the font is four static files, so each weight is a separate download.

### Option 4: Redraw the type and zones in Figma first, then code them

Treat it like milestones M1 and M2: new frames, a gate, then code.

**Pros**:
- The engineer approves on a drawing before any code.

**Cons**:
- Contradicts the decision to stop using Figma from M3, adds a gate and delay, and the engineer already asked to judge in the browser.

## Rationale

Option 1 is the only one that answers all three causes the engineer named. Option 2 skips the type complaint, Option 3 leaves the font shape out of the answer, and Option 4 reverses a decision the engineer made on purpose and slows a change that a few tokens can show in minutes.

**Font: Inter, with Be Vietnam Pro at lighter weights as the runner up.** Inter has the `vietnamese` subset and a weight axis from 100 to 900 (read from Next's font data in the repo), so one file serves every weight and the range can stop at 600. Be Vietnam Pro is static, so each weight is its own file. Inter is also the most common UI font, which means its Vietnamese marks and small sizes are well exercised. Whether it looks calmer than Be Vietnam Pro at the same size is a visual judgment, so it is decided now and judged in the browser; the whole font lives in one variable, so going back is a single edit. Source Sans 3 (narrower, smaller looking, good for dense admin tables) and Noto Sans (the widest mark coverage, similar width to Be Vietnam Pro) were weighed and not chosen.

**Weights: 400, 500, 600.** Dropping 700 and stopping the font range at 600 makes the limit hard to break. Hierarchy then comes from size and color more than from weight, which is the direct answer to "too many bold things next to each other". The lightest option (500 for headings and buttons, 400 for labels) was the runner up; it risks making field labels and table heads sink, so it was not chosen.

**Scale: body 15, small 13, headings about a quarter smaller.** Most components already use `text-sm`, so moving the scale tokens shrinks them without editing components. Body at 15 keeps phone reading comfortable; 14 everywhere was rejected because it would hurt phone reading and widen the gap to the 16 px inputs, and two densities was rejected because it adds a density layer to every shell. Inputs keep 16 px through their own token, because that limit comes from a real device behavior, not taste.

**Zones: grey canvas with white bordered cards, using `Card` itself.** The engineer said areas are hard to tell apart, and a contrast between a grey page and white boxes shows a boundary without shadows or heavy lines. A canvas of `#F1F5F9` is visible against white without being gray enough to hurt text contrast, and the contrast pairs already measured for `muted` apply to it. `Card` already has a title, description and action slot, so tuning it avoids a second, near identical `Zone` component; only the page head is new, as `PageHeader`. Bands with dividers on a white page, and dividers with space only, were rejected: the first draws weak boundaries around tables and forms, the second is the state the engineer is complaining about.

**Figma: left alone.** The file has been a frozen reference since M3. Updating the font variable and the type styles would add a Figma step to a change the engineer wants to judge in the browser, so the font variable and type styles are dropped from the comparison and marked stale.

## Evidence

Census of the code at the time of the decision (2026-10-24):

| Fact | Value |
|---|---|
| Weight classes in `src` | `font-medium` 43, `font-semibold` 16, `font-normal` 9, `font-bold` 6 |
| Base heading styles | h1 700, h2 to h4 600 |
| Size classes in `src` | `text-sm` 107, `text-base` 26, `text-xs` 19, `text-lg` 18, `text-xl` 9, `text-3xl` 6, `text-2xl` 5, `text-4xl` 2, and a few `md:` steps |
| Font loading | Be Vietnam Pro, static, four weights, subsets `vietnamese` and `latin` |
| Files that set `text-base` for typed text | `input.tsx`, `textarea.tsx`, `select.tsx` |
| Files that set a card shadow | `card.tsx` (`shadow-sm`) |
| Page surfaces | `body` white, `SidebarInset` white, public footer `bg-muted` |

Font candidates checked in `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json`:

| Font | Vietnamese subset | Weight axis |
|---|---|---|
| Be Vietnam Pro | yes | none, static files for 100 to 900 |
| Inter | yes | variable, 100 to 900 |
| Noto Sans | yes | variable, 100 to 900 |
| Source Sans 3 | yes | variable, 200 to 900 |
| Roboto, Open Sans, Nunito Sans, Plus Jakarta Sans, Manrope, Lexend, Mulish | yes | variable |
| DM Sans, Albert Sans | no | variable, so not usable here |

The Next.js font docs (`node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md`) allow a weight range such as `'100 900'` on a variable font and say only the weight axis is fetched unless `axes` is set.
