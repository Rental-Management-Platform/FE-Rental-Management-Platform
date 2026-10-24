# 0005. Rationale: sign up and sign in pages, route gate and permission helper

This is the decision record for [spec 0005](index.md). The build spec is `index.md`. Builds skip this file.

## Context

The backend is finished and the frontend already has the hard part of sign in: spec 0002 built `signIn`, `signUp`, `signOut`, restore on reload, the hint cookie and the end of session reasons, and spec 0003 built the `(auth)` shell, the form pieces and the shared states. What is missing is everything a person can touch. `/login` and `/register` do not exist, so the header buttons point nowhere. Nothing stops a guest from opening a page that needs a login. When the session cannot be checked, the header quietly shows a guest. The only way to try the session at all is a temporary test page, `/dev/session`.

Three facts shape the design. The access token lives only in browser memory and the refresh cookie `rt` is `HttpOnly` with a path limited to `/api/v1/auth`, so the Next.js server never learns who is looking (spec 0001). The backend decides every permission, so any check in the browser only decides what to show. And the sign up rules come from the backend: two account types chosen once, a phone required for landlords, no email verification and no confirm password field.

Leaving this undecided blocks every feature after it. Listing, property and favorite screens all need a login, a redirect and a way to hide controls, and each would invent its own.

## Options considered

### Option 1: Real pages, one client gate in the layouts, a small `Can` helper (chosen)

`/login` and `/register` are real pages in `src/features/auth`. A client component, `RequireSession`, wraps the landlord and admin layouts and any single page that needs a login. `Can` hides a control by permission.

**Pros**:
- One gate and one helper, so later features never write an access check.
- Works with how the session is held: the browser already knows the state.
- A real URL for sign in, which the gate, the password email link (#27) and `?next=` all need.

**Cons**:
- A guest sees a loading state for a moment before the redirect, because the check runs in the browser.
- Two small components that every later feature must remember to use.

### Option 2: A server side redirect from the hint cookie, plus the client check

A `proxy` (the Next.js request hook) reads the `has_session` hint cookie and sends a request with no hint to `/login` before any page renders.

**Pros**:
- No loading flash for a guest who never had a session.
- The redirect happens before the page is built.

**Cons**:
- The hint is only a hint (spec 0002): a dead session still carries it, so the client gate is needed anyway. It would be two mechanisms for one rule.
- It reads a cookie on the server for pages that are otherwise static, and it runs on every request.
- It gives a false feeling of security, when only the backend protects data.

### Option 3: Sign in and sign up as a dialog opened from the header

**Pros**:
- No navigation, the person keeps their place on a listing.

**Cons**:
- The gate, the password email link and a shared `?next=` still need real URLs.
- The sign up form (two cards and up to five fields) is long for a dialog on a phone.
- Every page would need to host the dialog.

### Option 4: Hand written checks in each page, no shared gate

**Pros**:
- Nothing to build now.

**Cons**:
- Each page repeats the loading, redirect and role logic, and one of them will render content for a guest for a frame.
- Rules drift between pages, for example how the lost session message is shown.

## Rationale

Option 1 fits the forces. The server cannot see the session, so the check has to run in the browser, and a client gate is the smallest thing that does that once. Option 2 adds a second check that cannot be trusted alone, and Option 4 spreads the same rule over many pages. Option 3 is a sound idea for a quick sign in, but the sign up form and the URL needs of the gate and of #27 point to pages.

The cost of Option 1, a short loading state for a guest, is acceptable for a demo marketplace where the protected areas are for signed in landlords and admins. The gate renders no children until the state is `user`, so nothing leaks. Putting the gate outside the shell means a guest or a wrong role never sees a menu belonging to another role, which is why it wraps the shell and does not sit inside it.

The single `useAuthRedirect` effect is deliberate: whether a person just signed in, opened `/login` while already signed in, or came from a second tab, one rule moves them on. A redirect written inside each submit handler would leave the other two cases untreated.

## Decisions the engineer made

| Question | Chosen | Note |
|---|---|---|
| Shape of the sign up page | One page, choose the type first | Runner ups: two steps, two URLs |
| Where to go after sign in or sign up | The page the person wanted, else `/` | Runner up: by account type now, which would land on pages that do not exist until #12 and #20 |
| Guest on a page that needs a login | Redirect to `/login` with `next` | Runner up: a blocking page with a button |
| Session cannot be checked | Retry in the account area, retry on gated pages | Runner ups: a site wide strip, or keep showing a guest |
| Password entry | A show and hide button, no confirm field | Runner ups: a confirm field, or both |
| Controls without permission | Always hide | Overrides my recommendation, see below |
| After "Đăng xuất" | Stay on a public page, a gated page goes home | Runner ups: always home, always `/login` |
| The `/dev/session` lab and its debug hook | Delete both | Runner ups: keep the hook, or keep both until `/test` |
| Design source | `design.md` and the sample screens | No Figma, layout decided by `/develop` |
| References section | None | The design rests on the backend contract and specs 0001 to 0004 |

**On "always hide".** I recommended hiding by permission and dimming with a reason only for quota and trial limits, because a hidden control gives a person no reason. The engineer chose to always hide. That is workable here for two reasons: the permissions in the contract follow the account type, so a control missing for a seeker is missing for a good reason, and quota and trial limits are not permissions at all (the backend answers them with their own errors, item #17). The cost to accept is that a person who is missing a control is never told why. `Can` therefore has no disabled mode, and #17 shows its limits as notices on the page.

## Settled by me (RECOMMEND items)

| Decision | Pick | Why | Runner up |
|---|---|---|---|
| Where the gate sits | Outside the shell | A guest or wrong role never sees the other menu | Inside the shell, which flashes the wrong menu |
| Reading `next` on the auth pages | `useSearchParams` inside `<Suspense>` | Keeps the page static with Cache Components | Reading `window.location` in an effect |
| How an auth page moves a `user` away | One `useAuthRedirect` effect | Covers sign in, already signed in and a second tab | A redirect inside each submit handler |
| Blank name and phone in the request | Left out | The contract marks both optional, an empty string is not a promised value | Send `""` |
| Phone field for a seeker | Visible, optional | Matches the contract and the sample screen | Hidden until wanted |
| Copy about the landlord trial | None | The length of the trial is an admin setting, and the figure lives in #17 | A line with the number of days |
| `next` on the header links | Path only | A query such as filters is not worth putting in a link, and reading it needs Suspense in the header | Path plus query |
| `robots` on the auth pages | `noindex, nofollow` | Nothing there belongs in a search result | Default |
| Account type preselected | No | The backend has no default and the choice is final | Preselect seeker |
| Password after a wrong sign in | Keep what was typed | A typo is the common cause | Clear the password |
| Where `PasswordInput` lives | `src/components/form/` | #27 and #28 use it | Inside the auth feature |
| `Can` API | A component with `fallback` and `loading` | A pricing page needs "sign in to buy" for guests and nothing for others | A boolean hook only |
| Messages for a lost session | The three fixed sentences in AC-10 | Plain, and the locked one points to the admin | The backend text |
| Ending a session on a gated page | Decide by the reason, and keep the previous status in a ref only to tell an explicit sign out from an arrival | The reason covers a lost session on a reload too, and the ref is needed for one case only | Pass a reason through the URL |
| Checking the gate before real gated pages exist | Two dev only `dev-check` fixture pages | The group layouts only mount for a real route, and an idle page makes no call that could notice a lost session | Wait for #12 and #20 |
| Text for the gate's "cannot check" state | An optional `message` prop on `ErrorState`, and `LoadingState` as it is | There is no error object to read the text from, and the title prop already exists | A made up `ApiError` |
| The retry on `/login` and `/register` | A notice above the form, and the form stays mounted | Spec 0002 asks every login page for a retry, and a retry must not lose typed values | Replace the form with an error page |
| Email handling | Trim before the check and the send, never lowercase, loose check | The backend trims, lowercases and is the real validator | A strict Zod email check |
| Form attributes | `noValidate` and `method="post"` | Keeps the Vietnamese messages, and a native submit before the script loads must not put the password in the URL | Defaults |

## Cross check (2026-10-25, another model, read only)

An independent pass on a different model read the spec and the related specs and the API contract. It found that the design holds up and listed gaps in decisions. All were applied except one, and one is recorded as a known limitation.

**Applied**
- The gate had no rule for a reload after the session ended (`loading` then `guest(reason)`), the most common real case. It now decides by the reason.
- The gate could not be checked before #12 and #20 add pages, so two dev only fixture pages were added.
- The gate's "cannot check" state had no source for its text, and the auth pages had no retry for `guest('unavailable')` although spec 0002 asks for one. Both are fixed.
- Missing copy, email handling, the meaning of "blank", stale errors after switching cards, where an `accountType` error shows, the focus order of server errors, `next` between the two pages, the sign out toast, and form attributes (including `method="post"`) were all given an answer.
- Small hardening was added without asking: a final origin check in `safeNextPath`, reading `next` at the gate from `window.location` in the effect, a `<Suspense>` leaf for the header links, and the invariant that gated pages fetch no private data on the server.
- An unreachable edge case row was removed.

**Not applied**
- After a sign in with a `next` that points into an area of another role (a seeker signing in with `next=/landlord/...`), the reviewer asked `afterAuthPath` to return `/`. Not done: `ForbiddenState` tells the person why they cannot enter, and the other way would make `afterAuthPath` know the paths of every area.

**Known limitation, moved out of this spec**
- Two tabs can swap accounts through the shared `rt` cookie, and a refresh does not call `GET /auth/me`. This belongs to the session layer (spec 0002), so it is a consequence and a follow up here, not a change.
