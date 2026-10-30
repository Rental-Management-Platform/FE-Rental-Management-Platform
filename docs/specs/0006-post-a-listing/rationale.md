# 0006. Rationale: post and edit a listing form for the landlord area

This is the decision record for [spec 0006](index.md). The build spec is `index.md`. Builds skip this file.

## Context

The backend is finished and the frontend now has a working landlord path up to one point: a landlord can sign in (spec 0005) and create a property (#6, which stops at a result view). Nothing lets that landlord post a room, and no screen can correct one. The scope puts post and edit in one item on purpose, because both fill the same six fields with the same limits.

Four facts shape the design. The list of "my listings" (#12) and the public pages (#8, #9) do not exist yet, so the form has nowhere to send a person afterwards and nothing to open the edit page from. Quota and trial limits are answered by the backend as `MEMBERSHIP_REQUIRED` and `LISTING_QUOTA_REACHED`, but the screens that explain them belong to #17. The move in date is a date without a time, and the project shows dates in `Asia/Ho_Chi_Minh`, so a careless conversion through UTC moves it by a day. And an edit may only send the fields that changed, with `null` to clear the deposit and the date.

Leaving this undecided blocks #12, which opens this same form to edit, and #8 and #9, which have nothing to look at without a listing.

## Options considered

### Option 1: One shared form, flat routes under `/landlord/listings`, a shadcn date picker (chosen)

`/landlord/listings/new` posts and `/landlord/listings/[id]/edit` edits. One `ListingForm` and one schema serve both. The property is chosen in the form (or preset by `?propertyId=`). The move in date uses the shadcn calendar in a popover.

**Pros**:
- One set of rules for both pages, and the same cluster of addresses as the list page of #12.
- No property detail page is needed, because the property is a field of the form.
- The chain "create a property, then post into it" works now through a link and a query value.

**Cons**:
- A calendar adds two packages and two shadcn files to edit and to keep inside the contrast gate.
- The property select holds only the 50 newest properties.

### Option 2: Routes nested under the property (`/landlord/properties/[propertyId]/listings/new`)

The address mirrors the API path.

**Pros**:
- The property is fixed by the address, so there is no select and no empty state to build on this page.

**Cons**:
- It needs a property page that does not exist, or a list of properties to open it from (#12).
- Posting from a menu item still needs a way to pick the property, so the select returns anyway.

### Option 3: Two separate forms, one to post and one to edit

**Pros**:
- Each form is simpler to read on its own.

**Cons**:
- The six fields, the limits, the messages and the preview lines would be written twice and drift apart.
- #12 would have to know which of two forms to open.

### Option 4: Post only, and leave edit to #12

**Pros**:
- A smaller first slice.

**Cons**:
- The scope row puts edit here, and an edit of a listing hidden by an admin is the main way to fix it.
- #12 would then build a form instead of a list.

## Rationale

Option 1 fits the forces. Post and edit share fields, limits and messages, so one form is the smaller and safer thing (Option 3 duplicates it, Option 4 postpones half of it). Flat addresses fit a world where the property is just a field and the next item (#12) adds a list at `/landlord/listings` beside them, which Option 2 cannot do without a property page. Putting the result view in place, with the public path as text, keeps the thread whole today without linking to pages that do not exist yet.

The engineer chose the shadcn date picker over the native date input I recommended. It is consistent across browsers and matches the rest of the design system, at the cost of two packages and some edits. The design takes the risk out of the one real danger, a date shifted by a time zone, by building the string from the calendar's local parts and showing it through a helper that reads the string without a zone.

Edits send only what changed so a save never overwrites a field the person did not touch, and the "nothing changed" case never spends one of the 60 hourly writes.

## Decisions the engineer made

| Question | Chosen | Note |
|---|---|---|
| Where the form lives | Flat `/landlord/listings/new` and `/landlord/listings/[id]/edit` | Runner up: nested under the property |
| After posting | A result zone in place | Runner ups: go to the public page, or a toast and a cleared form |
| A link to the public page | The path as text until #9 | Runner up: a link now, dead until #9 |
| More than 50 properties | The 50 newest | Runner up: load every page |
| Entering money | Digits with a preview line | Runner ups: digits only, or separators while typing |
| Move in date control | The shadcn date picker | Overrides my recommendation, see below |
| Years in the picker | One year back to three ahead | Runners up: today onwards, every date the API takes |
| Edit page extras | Read only property, a status label, the admin reason | Runner up: the form alone |
| After saving an edit | Stay, toast, reset the form | Runner up: the same result view as posting |
| Joining #6 and #7 | A button in #6 and a menu item | Runner up: the menu item only |
| Leaving with typed text | Ask on closing or reloading | Overrides my recommendation, see below |
| Someone else's or a missing listing | Two separate states | Runner up: one "not found" state |
| Save with nothing changed | No request, a toast | Runner ups: disable save, or send an empty PATCH |
| Skills and MCP for `react-day-picker` | Skipped, recorded as declined | The shadcn skill is already installed |
| Design source | `design.md`, spec 0004 and the sample screen | No Figma, layout decided by `/develop` |
| References section | None | The design rests on the contract and specs 0001 to 0005 |

**On the date picker.** I recommended the browser's own date input: no package, a real picker on phones, and a value already shaped as `YYYY-MM-DD`. The engineer chose the shadcn calendar. That is workable. The costs to accept are two packages, two files to edit by spec 0003, new contrast pairs, and the care needed so the day never moves.

**On the leave warning.** I recommended no prompt, because the Next.js App Router has no way to stop a change of route, so a prompt covers only closing the tab and reloading, and the browser decides its words. The engineer chose to ask anyway. It is cheap and catches the most common loss, a reload. The cost to accept is that a click on a link inside the site is still not guarded.

## Settled by me (RECOMMEND items)

| Decision | Pick | Why | Runner up |
|---|---|---|---|
| Preselect when there is one property | Yes | It saves a click and cannot be wrong | Always show the empty select |
| "Đăng tin khác" | Clear the text, keep the property | A landlord with several rooms in one house posts in a row | Clear everything |
| Property help line | The `fullAddress` of the chosen property | Shows what the room's address will be, with no extra call | Nothing |
| Property list while loading or failing | A page level state, not an error inside the select | The form is useless without it, and the empty state must replace the form | A disabled select as in #6 |
| Cache keys | `["properties", "mine", { page: 1, pageSize: 50 }]` and `["listing", "mine", id]` | The `mine` part keeps them apart from the public reads of later items, and the page and size keep a paginated list of #12 from sharing one entry | Plain keys |
| Staleness of the property list | The default (fresh on mount) | A property made a minute ago must be listed | A long `staleTime` as for wards |
| Refetch on focus and on reconnect for the edit page | Off, and the form is seeded once | A refetch must never replace typing | On with a merge |
| Invalidate after both creates | `["properties"]` | `listingCount` and the list change | Nothing, until #12 |
| Form reset after a save | `reset` to the answer | The form is clean and the next diff starts from the server copy | Keep values and clear dirty |
| How "changed" is decided | Parsed form value against the last server copy | `22.5` and `22,5` are the same | Compare typed text |
| Loaded date outside the picker's years | Show it and keep it | An old date must not vanish or be rewritten | Reject it |
| "Today" in the calendar | Do not pass `timeZone`. Pass `today` (the day in `Asia/Ho_Chi_Minh` from `Intl` parts) only if the installed version has that prop | With `timeZone` the library reads picked dates as dates in that zone, and a `Date` built on a device in another zone could move by a day, which is the bug the design avoids | Always the device day |
| Where the status label lives | `src/features/listing/components/listing-status-badge.tsx` | #12 reuses it in the list | Inside the edit page |
| Status label words | The sample screens' labels, plus one for `isPublic` false | One wording across the sample and the real page | Invent new words |
| The cause of `isPublic: false` | One neutral label with a reason line | The cause needs the membership (#17) | Guess one |
| The edit `id` and `?propertyId` | Read both in a client leaf inside `<Suspense>` (`useParams`, `useSearchParams`) | The project has `cacheComponents` on, and this keeps the page shell static | Await `params` in the page, or read `window.location` |
| Description box | Six rows, no counter | The hint states the limit | A character counter |
| Tips zone copy | Four short lines, shown from `xl` | Matches the sample screen | None |
| Result zone shows deposit and date | No | The result is a receipt of what matters (title, address, price, area, path) | Show all fields |

## Cross check (2026-10-30, another model, read only)

An independent pass on a different model (Opus) read the spec, the API contract, specs 0003 to 0005 and the code of #6. It found that the design holds up against the contract and listed gaps in decisions. The main findings were checked against the code before they were applied, and all were applied by the engineer's pick.

**Applied**
- How the form is seeded: the preselected property goes in the starting values (so the form is not dirty at the start), the loading, error and empty states show only while there is no data, and a later failed refetch never replaces a typed form.
- After `PROPERTY_NOT_FOUND`: the choice is cleared only when the property is gone from the fresh list, and the typed text stays.
- Edit: the form is seeded once, the last server copy lives in a ref and in the query cache, and focus and reconnect refetches are off.
- The edit page had two `h1`s (`NotFoundState` and `ForbiddenState` each carry one), `ForbiddenState` has no title prop, and the public path was named in AC-9 but not shown anywhere. All three are fixed.
- Save errors on edit: `NOT_RESOURCE_OWNER` gives `ForbiddenState`, `LISTING_NOT_FOUND` and `INVALID_ID` give `NotFoundState`, with no property handling.
- The date picker: `ref` and `onBlur` reach the trigger so focus on an error works, the placement of "Bỏ chọn", closing on pick, clamping by `startMonth` and `endMonth`, and the `timeZone` approach was replaced by a `today` prop.
- The money preview joins the input's `aria-describedby`. `ListingStatusBadge` owns its words (the code under `/dev` may not be imported) and moves into M1, because the result view needs it. The quota errors are said to go through `FailureNotice`. The cache key carries the page and size. `formatCount` stays in the sample file.
- Wording fixes made without asking: the zone map amendment (the breadcrumb is removed), the menu icon, and the non breaking space that `formatMoney` puts before the sign.

**Left as a known limit**
- Typing `22.5` over a saved `22,5` marks the form dirty although a save finds no change.
- `NOT_RESOURCE_OWNER` on a post cannot come from the page itself (the property must be in the person's own list). The handling stays because it costs nothing.

**Unchecked until build**
- Whether the installed `react-day-picker` has a `today` prop, and whether reading `useParams` under `cacheComponents` needs the `<Suspense>` as written. `npm run build` confirms the second.
