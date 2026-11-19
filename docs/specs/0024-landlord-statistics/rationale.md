# 0024. Rationale: landlord statistics

The decision record for [index.md](index.md). The build does not read this file.

## Context

> ⚠️ Premise note: this spec carries three decisions that could be separate specs: the landlord screen, the shared stats pieces (range bar, number card, change note, chart) and a forced token refresh in the session. They are kept together because the shared pieces have no second user until #40, the refresh has one caller, and splitting would make three specs for one thin thread. If #40 or #26 need to change a shared piece, that spec amends this one, as 0008 was amended by later work.

Today `/landlord` is a page of link cards, each with a small number, built in spec 0008 when the backend had no statistics at all. On 2026-11-16 the engineer asked for a landlord overview with real statistics and no link cards, rejected computing charts in the browser (the lists only hold running totals, no history), and built the API instead. On 2026-11-18 the contract gained section 6.42, `GET /me/statistics`. One call returns nine blocks: the state of the landlord's listings and plan, views with the top five listings, saves and followers, two separate rating scores, chat with a reply rate, money spent (test payments), and a series per day. The backend computes every number, every percent change and the days with nothing, and the frontend only shows them.

Several forces shape the screen:
- The contract is strict about meaning. Period numbers carry a previous value and a percent that is null when the previous value is 0. State numbers have no history and must not get an arrow. The reply rate changes in points, not percent. The two rating scores must never be combined, the top five can sum to less than the views number, and views by day only exist since 2026-11-16.
- The statistics API is for landlords only. A landlord who was already signed in has a token without the new permission and gets a 403 until the next refresh, and the contract says to refresh and read once more. The session layer renews a token only near its expiry and offers no way to force it.
- Three pages will draw charts and pick a range: this one, the admin overview (#40) and the revenue page (#26). The project has no chart library, no chart colour tokens, and `design.md` has no chart rules. Whatever is built first sets the habit for the other two.
- Accessibility is WCAG AA. The scope asks for a text table beside each chart, and a change must not rely on colour alone. The chart has up to 366 points.
- The UI rules of the project apply: zones on the canvas, item cards on the canvas, tokens only, Vietnamese only, no help text under a field, a control height of 44 px on a phone. The engineer works without a `/dev/ui` step since 2026-11-12, so new UI is checked on the real route.
- The landlord first sees `/landlord` after sign in, so it is the first page of the product for them. A wall of zeros for a new landlord would be a poor first impression, and the old cards had a "start here" cue that the new page must replace.
- Three older decisions touch the same ground: the tool list and the menu (0008), the number on the chat card (0012) and the membership entry shared by the cards (0020).

If nothing is decided, the work is guessed at build time: a chart library picked by whoever builds first, a range control that is not shared, a 403 that shows an error to a working landlord, and arrows drawn on numbers that have no previous value.

## Options considered

### Option 1: One statistics screen on `/landlord`, shared stats pieces, shadcn chart on recharts (chosen)

Replace the body of `/landlord` with a screen built from one `GET /me/statistics` read, keyed by the range kept in the address. The range bar, number card, change note and chart live in `src/components/stats/` and know nothing about a landlord. The chart is the shadcn `chart` component on recharts. A small `refreshToken()` is added to the session for the first 403.

**Pros**:
- It follows the project's own route for shared UI (the shadcn CLI) and gives axes, a tooltip, resizing and a keyboard layer without owning them.
- One read and one cache entry per range, so the screen is simple and the rate limit is not a concern.
- #40 and #26 become mostly composition of pieces that already exist.
- The address holds the range, so a refresh or a shared link keeps it, as the admin lists already do.

**Cons**:
- A new dependency (`recharts` and its peer `react-is`), a client only chart that waits for its width, and chart colour tokens to maintain.
- The session layer, a shared and carefully built part, gets a new action.
- It drops the tool cards from `/landlord`, so a phone user has one more tap to reach a tool.

### Option 2: The same screen with hand drawn SVG charts

Same page, same shared pieces, but the chart is our own SVG component with pure functions for scales and ticks, a tooltip and keyboard handling written by us.

**Pros**:
- No dependency, no peer problem, and full control of colours, tokens and screen reader text.
- Pure functions for the scales and ticks fit the functional style of the project and are easy to test.

**Cons**:
- About 250 lines to own for one line chart, and more for #40 and #26 (several series, bars by month), including the tooltip, the keyboard and the thinning of 366 labels, which a library already solves.
- It breaks the project habit of taking shared UI from the shadcn CLI, so the next person has no example to follow.

### Option 3: Keep the cards on `/landlord` and put the statistics on a new route

Leave `/landlord` as it is and add `/landlord/thong-ke` (or similar) with the statistics, with a menu item.

**Pros**:
- No change to spec 0008, the card numbers or the cache entries of 0012 and 0020, and no card code to delete.
- A landlord keeps the card shortcuts.

**Cons**:
- It goes against scope row #39, which replaces the body of `/landlord` and makes the menu the only door, and against what the engineer asked on 2026-11-16.
- Two overview pages and two sets of numbers (the card counts and the statistics) that can disagree for a moment.
- The first page after sign in stays a list of links, which is the thing the engineer wanted to stop showing.

## Rationale

Option 1 fits the forces. The contract already does the hard part (every number, every percent, filled days), so the page is a display problem, and the work worth sharing is the display: how a change is drawn, how a range is chosen, how a chart reads for a keyboard user. Building those as small neutral pieces now costs little more than building them inside one screen, and #40 and #26 would otherwise copy them. The chart library is the one place where owning code does not pay: three pages need axes, a tooltip and a keyboard layer, and the project already routes shared UI through the shadcn CLI, so recharts through the `chart` component is the aligned and boring choice. It is the more popular one too, but that is not the reason; the reason is that Option 2 grows with every page that draws a chart.

The engineer asked for the replacement and for the menu to be the only door, which rules out Option 3, whose only real benefit is avoiding edits to older specs. Those edits are small and listed in the Amendments table, and 0008 already carries a note that its landlord half is replaced.

The forced refresh is a real change to a shared layer, so it was put to the engineer. The alternative (ask the landlord to sign in again) is simpler but ignores the contract advice and shows a failure to a landlord who did nothing wrong, once, right after a deploy. The refresh joins the one already in flight and is capped at once per read, so it cannot loop and cannot spend the 60 refreshes a minute.

Settled in the interview, with the runner up:
- **Page order**: results first, then current state. The range bar only changes the top part, so it sits next to it. Runner up: state first, because hidden listings need action.
- **Range control**: four presets plus a custom range with two date pickers. Runner up: presets only, which is simpler but cannot look at one month or a past campaign. The range lives in the address (`from`, `to`); a preset writes two dates and "30 ngày" writes none, so the default stays a clean address and the same as the API default. Runner up: React state, which loses the range on a refresh.
- **One chart and a switcher** for the four daily columns, because views are far larger than the rest and one scale would flatten saves, followers and chats. Runner up: a small chart in each number card, which shows everything at once but is too small to read and needs four tables.
- **Change note**: an arrow, a signed percent and words, green for a rise and red for a fall, muted for money. Runner up: one neutral colour, which needs no new contrast pair but is slower to scan. Words and arrow carry the meaning, so colour is only help.
- **Empty state**: for a landlord with no listing, a message and two links replace the blocks; the plan strip stays. Runner up: all blocks with zeros and a banner.
- **Design source**: the existing `design.md` and current UI. `design.md` has no chart rules, so this spec fixes the chart style and Follow-up asks for a note in `design.md` once #40 settles the colours.

Cross check (another model, 2026-11-20): it raised 18 gaps and 7 soundness points and judged the design close to buildable. One gap did not hold: it said an old token would hide the screen before the 403 path could run, but the session's `permissions` come from `GET /auth/me`, which reads the database, and only the token's own copy is old, so the gate passes and the first read answers 403, which is the case the refresh is for. AC-1 now names that source. The other 17 gaps were applied as listed (cache key normalisation, the preset when no params, today and hydration, retry and abort, `isPlaceholderData`, units, chart edge cases, tab and draft state, the empty state strip, every membership state, and the payment refresh), and the contrast pairs moved into the tasks that introduce the colours.

Decided without a question (small calls, the engineer may override in review):
- The views note ("Lượt xem theo ngày tính từ 16/11/2026") sits on the views card and is always shown, as the scope row asks; the runner up was to show it only when the range starts before that day, which is less noise after mid December.
- The preset set is 7, 30, 90 and 365 days. Calendar months were left out to keep the bar short; a custom range covers them.
- `staleTime` is 60 seconds with the previous answer kept while a new range loads, because the answer is about ten queries on the server and the numbers do not need to be live.
- The chart is an area with no grouping. A bar chart would be too dense at 366 points, and grouping into weeks would be arithmetic in the browser.
- The plan strip is drawn from `membership` of this answer, with no second request, by exporting the strip as a view of a prop.
- Top listings link to the edit page, not the public page, because a landlord reads statistics to manage; a badge says when a listing is not public.
- The statistics are marked out of date after a listing write, like the membership entry, so counts do not lag after a post or a hide.
- The landlord only card code is deleted now and the shared card code stays, because the admin cards still use it until #40.
- The custom range is two `DatePicker` fields and plain state with a pure `validateRange`, not React Hook Form: two fields and one button do not need it, and the admin orders filter bar also uses `DatePicker` and `Field` with no form library (it applies on each pick, while this bar waits for "Áp dụng" so a half chosen pair is never sent).
- The chart leaf loads lazily with `ssr: false`, so recharts stays out of the first script of `/landlord`.
