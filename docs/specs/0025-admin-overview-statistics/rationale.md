# 0025. Rationale: admin overview statistics

The decision record for [index.md](index.md). The build does not read this file.

## Context

> ⚠️ Premise note: this spec carries three pieces that could be separate specs: the admin screen, a second line on the shared chart, and the removal of the old dashboard code. They are kept together because the chart change has one caller (this screen), the lifted pieces exist only to serve it, and the cleanup is what makes the new page the only overview. If #26 needs another change to the chart or the shared pieces, that spec amends this one, as 0024 is amended here.

Today `/admin` is a page of eight tool cards, each with a small number from its own request (listings hidden by admins, accounts and locked accounts, paid orders and revenue as test payments). It was built in spec 0008 when the backend had no statistics. On 2026-11-18 the contract gained section 6.43, `GET /statistics/overview`. One call returns seven blocks: the state of accounts by type and lock state with new registrations, the landlords on a plan, on trial or expired, the listings by state with the number visible to guests and new listings by ward, views, six more interest numbers, three counts of what admins hid, and a series per day with ten columns. The backend computes every number, every percent change and the days with nothing, and the frontend only shows them. The same day the scope moved #40 into Slice 7 with #39 and #26, because the three pages share a chart and a range control, settled in spec 0024.

Several forces shape the screen:
- The contract is strict about meaning. Period numbers carry a previous value and a percent that is null when the previous value is 0. State numbers (accounts, landlords, listing states, the hidden counts) have no history and must not get an arrow. The two review counts are different things and must not be added. The ward list is for the current period only.
- These numbers count every existing row, unlike the landlord screen, which counts only what is publicly visible. They will not add up across landlords and must not be set side by side as one figure.
- The server runs about sixteen queries and takes about 3 seconds when the platform has tens of thousands of listings. A page that reads again on every focus would spend that for nothing.
- Part of the answer ignores the range (the state numbers and the hidden counts) and part follows it (everything with a previous value, the ward list, the series). One range bar over all of it would suggest that the account counts move with the range.
- The series has ten columns. Spec 0024 drew one line per tab with the `primary` token and left two things open for #40: how many series colours the chart needs and how ten columns are shown. The project has no chart colour tokens, only semantic ones, and `info` already exists and is measured.
- The ward list can hold about 168 rows and the contract says not to cut it.
- Accessibility is WCAG AA: a table beside each chart, and a change or a second line must not rely on colour alone.
- The engineer's rules apply: zones and item cards on the canvas, tokens only, Vietnamese only, no help text under fields, short notes only, no `/dev/ui` step since 2026-11-12, and a 44 px control on a phone.
- The old `/admin` cards showed revenue and paid orders as test payments. Section 6.43 has no money, so those two numbers have no source on the new page until #26.

If nothing is decided, the work is guessed at build time: a range bar over state numbers that do not move, a chart that cannot show ten columns, an arrow on a count of locked accounts, a screen that reads for 3 seconds on every focus, and two overview pages with numbers that disagree.

## Options considered

### Option 1: One overview screen on `/admin`, "now" zones above the range bar, range numbers below, shared pieces reused (chosen)

Replace the body of `/admin` with a screen built from one `GET /statistics/overview` read keyed by the range in the address. The strip and the three state zones sit above the range bar, the eleven cards, the chart and the ward list below it. The shared range bar, number card, change note, zone and chart of spec 0024 are reused, the chart gets a second line, and the old card code is deleted.

**Pros**:
- The range bar controls exactly what sits under it, so nobody wonders whether account counts moved.
- One read and one cache entry per range; the screen is mostly composition of pieces that already exist.
- The address holds the range, so a refresh or a shared link keeps it, as on `/landlord`.
- It matches scope row #40 and what the engineer decided for the landlord page (the page replaces the cards and the menu is the only door).

**Cons**:
- The shared chart changes (a `lines` prop) and the landlord screen is edited to use lifted pieces, so `/landlord` can regress.
- The admin loses the tool cards and the revenue numbers on `/admin` until #26.
- The page differs in order from `/landlord` (state first, range below), so the two overview pages are not the same shape.

### Option 2: Keep the cards and put the statistics on a new route

Leave `/admin` as it is and add a route such as `/admin/thong-ke` with the statistics and a menu item.

**Pros**:
- No change to spec 0008, the card numbers or the cache marks of the three write hooks, and nothing to delete.
- The admin keeps the card shortcuts and the revenue numbers.

**Cons**:
- It goes against scope row #40, which replaces the body of `/admin`, and against what the engineer chose for `/landlord`.
- Two overview pages and two sets of numbers (the cards and the statistics) that can disagree for a moment.
- The first page after sign in stays a list of links.

### Option 3: Statistics above the cards on `/admin`

Put the statistics screen first and keep the tool cards below it on the same page.

**Pros**:
- Shortcuts and the revenue numbers stay, with the new numbers on top.
- No new route and no menu change.

**Cons**:
- A very long page: nine blocks plus eight cards, and a phone user scrolls past everything to reach a card the menu already links.
- The cards repeat numbers the statistics already show (hidden listings, accounts, locked accounts), from separate requests that can disagree.
- It keeps all the card code that the landlord side already removed, and two ways in to every tool.

## Rationale

Option 1 fits the forces. The contract already does the hard part (every number, every percent, filled days), so the page is a display problem, and the display pieces exist from spec 0024. The one genuinely new design question was how to lay out numbers that ignore the range next to numbers that follow it. Putting the first group above the bar and the second below it answers that without a word of explanation: the bar controls what is under it. The strip goes first because it is the only part an admin acts on, and the contract itself says to give it its own band apart from the cards that have arrows.

Option 2 only avoids edits to older specs, which are small and listed in the amendments table, and it contradicts the scope row and the engineer's decision for `/landlord`. Option 3 keeps the card code and the duplicate numbers, and the page would be too long on a phone. The cost of Option 1, losing revenue on `/admin`, is real, but the numbers have no source in section 6.43, and a second request just to keep two cards would bring back the dashboard code this change removes. #26 is the right place for money.

The chart is the one place that needs a real extension. Six tabs of one or two lines keep the same look as the landlord page, group the columns the way the contract suggests, and let an admin compare landlords and tenants on one chart. The cost is a shared scale, so a much smaller line looks flat; the tooltip, the legend and the table carry the exact numbers. The `info` token already exists and is measured, so no colour token is added; a dash on the second line and a visible legend mean colour is not the only difference. A shared `lines` prop (one or two) keeps one chart component for both pages, with the landlord page drawing one line exactly as before.

A 5 minute cache with no read on focus follows from the server cost and from what an admin does here: look, act in the moderation pages, come back. The write hooks mark the entry out of date, so the strip is right on return. An explicit refresh button was left out to keep the page quiet, and stays in Follow-up.

Settled in the interview, with the runner up:
- **Page order**: the strip and the three state zones above the range bar, then the bar, the cards, the chart and the wards. Runner up: the bar first as on `/landlord`, which is consistent across the two pages but puts numbers that ignore the range under a bar that does not control them.
- **Daily chart**: six tabs with up to two lines each. Runner up: ten tabs with one line each, which needs no chart change and has no flat line problem but scrolls sideways on a phone; third, six small charts always visible, which shows everything at once but costs six chart instances.
- **Ward list**: the top 10 as bars with "Xem tất cả" opening the full table. Runner up: a full searchable table with 20 rows a page, which hides nothing but needs a search box and paging for a list that is mostly read once.
- **Notes**: "Lượt xem theo ngày tính từ 16/11/2026" on the views card and one line that these counts include hidden and locked rows. Left out: "new counts can differ from the change in totals" and "old saves and follows can drop later" (the landlord page does not say the second either).
- **Refreshing**: a 5 minute cache and no read on focus. Runner ups: the same plus an "Đọc lại" button with the time of the read, and the landlord page's 60 seconds with a read on focus.
- **Table columns**: the columns of the chosen tab (one or two). Runner up: all ten columns, as spec 0024 lists all four of its own, which would be too wide.
- **The strip at zero**: a muted "Không có" with no link, and one sentence when all three are 0. Runner up: always a link, so the strip never changes shape.
- **Cleanup**: delete the dashboard feature and its `/dev/ui` section. Runner up: keep `ToolCardView` only for `/dev/ui`, which leaves a component nothing draws.
- **References**: none.

Cross check (another model, 2026-11-20): it raised 18 decision gaps and 7 soundness points and judged the design close to buildable. Five points needed no change after reading the code: `SeriesTable` and `MetricCard` already take what AC-9 and AC-11 need, only three hooks ever used `dashboardKey`, the project has no test runner, the query defaults already fit (they are now pinned in AC-4), and the 429 branch stays as shared code with its test marked optional. The rest were applied: the exact strip calls and the permission read from `ADMIN_TOOLS`, a busy line for any read that runs while an answer is drawn, one `aria-busy` region, `useShownAnswer`, the shape of `lines`, the strip and state zones staying on a failed range, number and bar rules, the exact strings, the scroll of the tab list at 320 px, the ward table opening under the top 10, the midnight note, and a safer order for the cleanup task. One proposal was not taken as given: the reviewer wanted a 403 to replace the whole screen, bar included; it stays a card below the bar, as on `/landlord`, so the two pages behave the same.

Decided without a question (small calls, the engineer may override in review):
- A 403 `PERMISSION_DENIED` goes straight to the forbidden state, with no token refresh. Spec 0024 needed the refresh because a landlord token issued before `statistic:read` existed lacked it; an admin token carries `statistic:manage`, which includes `statistic:report`, and the admin type cannot be edited.
- No money on `/admin`, as above. The empty state of spec 0024 is not repeated: the platform always has at least the admin account, so a quiet platform shows zeros.
- The second line uses the `info` token and a dash, with a visible legend, and no new colour token. Runner up: a new `--chart-2` token, which needs its own contrast pair and an edit to `globals.css` for one line.
- Tabs follow the card order, so the first tab "Người dùng mới" is the one chosen at the start. Runner up: "Lượt xem" first, as on the landlord page.
- The row "Hiện nhưng khách không thấy" carries a quiet line naming the three causes, because the contract does not split them and the label alone is cryptic. It belongs to the row, not to the notes the engineer limited.
- The two card groups have visible headings on the canvas (spec 0008 and 0024 draw group headings on the canvas), which also gives the "Mức quan tâm" note a place and the page a heading order.
- The strip rows are links only when the session holds the permission of the target page (spec 0008 hides what a person cannot use). An admin holds every permission today.
- A failure replaces only the blocks below the bar. The strip and the state zones ignore the range, so they stay from the kept answer. This changed after the cross check: the first version used one rule (no old numbers anywhere under a failure), and it made the bar jump up the page.
- The `group` and `description` of `Tool` are removed with the cards, because after both overviews lose their cards nothing reads them; the type check confirms it at build time.
- The open tables of the chart and the ward zone are kept while the range changes and reset when the zone mounts again, as spec 0024 does for the chart.
- "và N phường khác" counts rows of the list, so it adds no counts and keeps the "no arithmetic on a statistic" invariant.
- A catalog rename does not mark this entry out of date, so an old ward name can show for up to 5 minutes. The cost of the extra coupling is higher than the cost of the stale name.
- The failure state, the range hook and the shared words are lifted out of `landlord-stats` instead of being copied, because two copies would drift and #26 would need a third.
