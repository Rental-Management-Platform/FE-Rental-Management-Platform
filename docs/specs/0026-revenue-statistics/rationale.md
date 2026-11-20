# 0026. Revenue statistics: reasoning and options

Build spec: see [index.md](index.md).

## Context

> ⚠️ Premise note: the scope row says "ba tổng khớp nhau" (the three totals match) as if the page had to make them match. The API already guarantees it: the outer total, the total of `byPlan` and the total of `series` come from one query, so they are always equal. The page therefore shows one number three times, and a check that added the rows in the browser would be arithmetic on the answer that this project forbids. The spec keeps the match as a visible fact (the same two numbers in three places) and moves the proof to a step of the verify list, done by hand.

Admins can read every order (spec for #25), but they cannot tell if sales go up or down or which plan sells best. The backend added `GET /orders/revenue` (section 6.38) for that: the money of paid orders by paid date, in Vietnam time, as a total, a list by plan and a series by day or by month. The money is a test payment, because `paid` only means a landlord pressed confirm, and the contract asks screens not to call it real revenue.

Two facts about the API shape the page. First, it reads no `from` and `to` as all time and no `groupBy` as `month`, while the landlord and admin overviews read no params as the last 30 days. Second, `series` is sparse, so a chart needs the empty days and months filled with 0 by the page, and the contract warns that the paid date is not the created date used by the orders list, so two totals for the same range can differ.

Specs 0024 and 0025 built a range bar, a number card, a chart with one or two lines, a text table and a failure state for the other two statistics pages, and both left a follow up for #26: reuse them, decide day or month, and bring back the money numbers that `/admin` gave up. The engineer decided the page opens like the others, on the last 30 days by day.

## Options considered

### Option 1: A dedicated page `/admin/revenue` built from the shared pieces

One request per view (range, grouping), the range and the grouping in the address, two total cards, a chart with two tabs and a table, and a list by plan. The shared chart and table get a few optional props with today's defaults.

**Pros**:
- Reuses almost everything, so the three money and statistics pages look and behave the same.
- One cheap request (about 50 ms), no slowdown of `/admin`.
- The side menu entry "Doanh thu" already exists as a `soon` tool and lights up with one edit.

**Cons**:
- The shared chart and table change (grain, axis width and floor, a footer), so a mistake could reach `/landlord` and `/admin`. AC-15 makes that a checked requirement.
- The page must send its default range explicitly, so it cannot reuse the "no params" convention of the overviews as it is.

### Option 2: Money zones on the `/admin` overview

Add the total and the by plan list to `/admin`, from a second request next to `GET /statistics/overview`.

**Pros**:
- Money at a glance, with no extra page to open.

**Cons**:
- `/admin` already waits about 3 seconds for the overview, and a second request adds a second loading state and a second failure to that page.
- The overview answer has no money, so the page would hold two answers for two ranges and two rules about what follows the range bar.
- Spec 0025 deliberately made `/admin` a page of counts, and the engineer chose to keep the money on its own page.

### Option 3: A revenue page with its own range and chart code

Build the controls, chart and table inside the feature, so the shared pieces stay untouched.

**Pros**:
- No risk for `/landlord` and `/admin`.
- Free to give the money axis and the month labels exactly the shape needed.

**Cons**:
- Two copies of the range bar, chart and table to keep in step, which is the reason the shared pieces were lifted in spec 0025.
- A different look for the third statistics page, which the engineer wanted to avoid when the pieces were shared.

## Rationale

Option 1 fits the forces in the Context. The three pages share a reader, a rhythm and a set of rules (the range in the address, no arithmetic, a table for every chart, failures below usable controls), and the shared pieces were built so that #26 would be mostly composition. The cost is a small, additive change to three shared files, with defaults that keep today's behaviour, and a checked requirement that `/landlord` and `/admin` still work. Option 2 was declined by the engineer for a reason that also holds on the facts: a second read on a page that already takes about 3 seconds buys little. Option 3 trades a risk that tests can cover for duplication that only grows.

Recommended calls made while writing the spec (the engineer may override them):
- **Always send the view.** The page sends `from`, `to` and `groupBy` every time, because the API reads missing days as all time. The runner up, sending nothing for the default, would show all time under a bar that says "30 ngày".
- **Day is the absence of `groupBy` in the address,** and the request still says `day`. The runner up, writing `groupBy=day` in the address, adds a parameter that never changes the view.
- **Two tabs, not two lines,** because an amount in millions would flatten the count to a line at zero (the problem spec 0025 notes for chats and messages). The runner up, one tab, hides the count.
- **The same two API numbers in the card and in both footers,** so the match cannot drift and the page stays free of arithmetic. The runner up, footers added from the rows, would prove the match on screen and break the project rule.
- **A money axis in full numbers on a wider axis,** with a floor of 100.000 for the amount, so an empty range does not read "0 to 4 đồng". The runner up, short words such as "1,5 triệu", needs a new formatter and can read the same for two neighbouring ticks.
- **One fixed sentence about partial months** whenever the page groups by month, instead of working out whether the first or last month is cut. It needs no date arithmetic and is true in every case.
- **Fresh for 1 minute and read again on focus,** unlike the 5 minutes of the overview, because this API takes about 50 ms and a payment can arrive at any moment, while the overview takes about 3 seconds.
- **No link to the orders list,** because a link that carries the dates would filter by created date and show a different total than the one the admin just read.
