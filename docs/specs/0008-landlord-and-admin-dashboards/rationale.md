# 0008. Rationale: landlord and admin dashboards

The decision record for [index.md](index.md). The build does not read this file.

## Context

Today a person who signs in is sent to the public home page, whatever their account type. The landlord area has a side menu with two items, the admin menu is empty, and `/landlord` and `/admin` have no page of their own. The only way to reach a tool is to type its address, and the only pages that exist under those two paths are the `dev-check` fixtures.

The frontend is built in slices, and the backend is done. Most tools of each area arrive later: of the landlord tools only "Thêm nhà trọ" and "Đăng tin" exist, and of the admin tools none (#20 to #26 are planned). A page that lists only what exists would be nearly empty for a landlord and fully empty for an admin. This is a demo project with a deadline, and its owner wants to see the whole planned picture and to click through each feature right after it ships, with no typed address.

Several forces shape the design:
- The menu already follows one rule: a feature adds its link in the same change that ships its page, so no link points to a missing page (spec 0003). A dashboard that lists unbuilt tools needs the same discipline, or the two drift apart.
- Permissions come from the session and can change while a person is signed in (an admin edits them). Hiding is a convenience, and the backend decides.
- Two scope items have no page of their own. Photos (#10) live inside the edit listing page, and the plan and quota notice (#17) is a strip at the top of the my listings page. A card for either would open a page that another card already opens.
- Every useful number already exists in the contract: list answers carry `total`, and `GET /me/membership` and `GET /orders/revenue` carry the rest. The scope forbids statistics outside the contract. The access token lives only in browser memory, so these reads must happen in the browser.
- Spec 0004 says a page area is a card zone on the canvas and a card never sits inside another card. A card that stands for one item sits directly on the canvas.
- Landlords and admins choose their account type at sign up (or are created by a seed), so the right landing page is a function of the account type. The sign in redirect was written to be extended (spec 0005 says a later feature may edit that one function).
- The current page logic of the menu marks an item current when the page is under its address. An item for `/landlord` would then be current on every landlord page.

If nothing is decided, each feature keeps adding menu items one by one, an admin has nothing to click until #20 ships, and the owner keeps typing addresses to check each feature.

## Options considered

### Option 1: One shared tool list for cards and menu, numbers per card in the browser (chosen)

A single list per area holds every tool, ready or soon. The dashboard draws all of them. The side menu is built from the ready ones. Each card with a number runs its own small query in the browser, so a failing number only affects its own slot. Numbers also show on dimmed cards.

**Pros**:
- Cards and menu cannot disagree, and a finished feature turns both on with one edit.
- The admin dashboard has real content now, and the number code is exercised end to end before any admin page exists.
- One failing request never spreads, and a card still opens when its number fails.

**Cons**:
- The list is hand edited, so a forgotten flip leaves a dimmed card.
- Up to 3 or 4 requests per visit, and a dimmed card can show a number for something that cannot be opened yet.
- Labels and descriptions for unbuilt tools are guesses.

### Option 2: A dashboard list of its own, with the menu still hand edited

The dashboard keeps its own list of all tools. `nav-config.ts` stays as it is, and each feature edits both.

**Pros**:
- No change to the menu code or its rules.
- The dashboard can be built without touching shared shell files.

**Cons**:
- Two places to edit for every feature, and nothing stops them drifting (a card turned on whose menu item was forgotten, or the reverse).
- The "same change as its page" rule would have to be checked by eye in two files.

### Option 3: A summary strip of numbers above plain cards

Three or four number tiles sit at the top, independent of the tools. The cards below carry no numbers.

**Pros**:
- Works from day one for both areas and the numbers stay together, like a classic dashboard.
- The cards stay simple.

**Cons**:
- A number is no longer next to the tool it belongs to, so the page needs a second layer of explanation.
- A tile that is not a link has no clear action, and a tile that is a link repeats the card below it.

### Option 4: No dashboard yet, only menu items as features ship

Keep the current approach: each feature adds its menu item, and the sign in redirect stays as it is.

**Pros**:
- Nothing to build now.

**Cons**:
- The admin has an empty menu until #20, and the owner has no overview of the planned picture.
- Landing on the public home page after sign in stays wrong for landlords and admins.

## Rationale

Option 1 fits the forces best. The project already treats the menu as a list that a feature extends in the same change as its page, so making that list the single source for the dashboard cards too keeps one rule instead of two (Option 2 duplicates it). Showing unbuilt tools as dimmed cards gives the owner the whole picture and a clear place to click after each feature ships, which is the stated goal of a demo project with a deadline (Option 4 gives neither). Putting each number on the card of the tool it belongs to keeps the page easy to read, and it makes the number code run now, even for admin, because the numbers do not depend on a page that is not built (Option 3 would also work today, but it splits a number from its tool).

A card that needs a number must never lose its link because of it, and the session keeps the token in memory, so each number is a small browser query with its own loading and error state. Reading only `total` or a few fields keeps the requests light (`pageSize=1`) and the cache free of other people's emails.

The engineer chose each of these during the design conversation: numbers on every card even when dimmed (runner up: only on live cards), one list feeding both (runner up: two lists), sign in lands by account type with `?next=` still first (runner ups: always the dashboard, or leave the home page), no card for photos (runner up: a card that opens "Tin của tôi"), six landlord cards (runner up: eight), admin groups by how often a tool is needed (runner up: by subject), soon cards that are plain text and not focusable (runner up: focusable with `aria-disabled`), a first steps highlight, a retry button inside the failed slot, References off, and the `dev-check` pages left alone.

## Calls the architect made

Each pick has a one line reason and the runner up. The engineer may override any of them in review.

| Call | Pick | Why | Runner up |
|---|---|---|---|
| Where the tool list lives | `src/components/shells/workspace-tools.ts` | It is shared code. The shells and `nav-config.ts` read it, and a shared component must not import a feature | In `src/features/dashboard`: the shell would then depend on a feature |
| "Tổng quan" current state | Optional third argument `exactHrefs` on `currentHrefOf` | `/landlord` would otherwise be current on every landlord page, including the edit listing page that no other item owns yet. The two public callers stay untouched | Change the signature for all callers, or special case the two addresses inside the shell |
| Cards and groups | Groups are `h2` headings on the canvas, each tool is an item card | Spec 0004: a card never sits inside another card, and an item card sits on the canvas | A group as a zone with tiles inside: breaks the rule |
| Ready card link | A stretched link on the label, retry button above it | The whole card is a target, and a button is never inside a link | A link around the whole card: puts the retry button inside a link |
| Query keys and freshness | `["dashboard", name]`, default stale time, fetch again on each visit and window focus | The numbers change when a landlord posts a listing, and the default behaviour refreshes them with no cross feature invalidation | Reuse `propertiesKey` or a 60 second stale time: more coupling, or stale numbers right after posting |
| What the cache keeps | Query functions return only the number | `GET /users` with `pageSize=1` still returns one person's email and phone, and the cache should not hold it | `select` on the query: the cache would still hold the full answer |
| Permission and a soon tool | Hidden wins over dimmed | A person who cannot use a tool should not see a "coming soon" card for it | Dim without permission: leaks the existence of tools they cannot use |
| A number without its permission | No request, no slot | The API would answer 403 anyway, and a failed request would flash an error | Request and hide on 403 only: noisy |
| Revenue on the dashboard | Every paid order, no date range | It needs no extra decision, and it equals the unfiltered total on the orders screen (contract 6.38). Ranges belong to #26 | The current month: adds a range decision that #26 owns |
| Card grid | One column below `sm`, two from `sm`, three from `xl` | Desktop first, and the workspace main area is narrower than the window because of the side menu | A fixed three columns: too cramped on a laptop with the menu open |
| Card copy and page text | Drafts in the spec, in Vietnamese | Owners rename them when they turn a tool on | Ask for every line now: low value for unbuilt tools |
| Account menu link | "Khu chủ trọ" and "Quản trị" | A signed in person on a public page needs a way back, because the redirect only runs after sign in | None: the person types the address |
| Tools and cards for #10 and #17 | No separate cards | Neither has a page of its own (see Context) | A card that opens the same page as another card |

## Notes for the build

- The dashboards are the first real pages of each area. The `dev-check` fixtures stay until #12 and #20 remove them, so the menu logic must not mark "Tổng quan" current on `/landlord/dev-check` or `/admin/dev-check`.
- An admin has `state: expired` in `GET /me/membership`, but the admin dashboard never calls it. A landlord with `expired` still has a working dashboard: the numbers say so in words, and the tools stay clickable, because the contract allows hiding, editing and deleting listings after the trial ends.
- Scope row #31 listed a card for #17 and #10. This spec shows their numbers on "Gói và đơn của tôi" and "Tin của tôi" instead.
