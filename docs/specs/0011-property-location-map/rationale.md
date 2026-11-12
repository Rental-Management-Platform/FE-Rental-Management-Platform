# 0011. Rationale: property location map

The decision record for [index.md](index.md). The build does not read this file.

## Context

> ⚠️ Premise note: The scope row says the pin should jump as the landlord types the address. The public Nominatim server forbids search as you type (its policy says you must not build autocomplete on the client), allows 1 request per second for the whole app, and has thin house number data in Vietnam. So this spec runs one lookup when the landlord leaves the address field, and treats the pin by hand as the main path. The same row also says #33 needs #32 (the searchable ward picker). It does not: the map only needs the ward code and its catalog entry, which any ward picker gives.

Scope item #33 is the map half of the property form. The backend is done and, since 2026-11-05, it checks the coordinates it receives: the point must be inside one of two city boxes, and inside the chosen ward's box plus about 500 m. It does not find coordinates from an address and calls no map service, so turning an address into a point, and a point into an address, is the frontend's job (contract 6.17). The ward catalog (`GET /wards`) now carries each ward's `bounds`, or `null` for a ward an admin added.

Forces that shaped the design:
- The pin is optional. A landlord with no map at hand must still be able to save the property, so the map and its helpers cannot be a gate.
- The scope asks that the page is not slowed before the map is opened, and that the map works on a phone and with a keyboard.
- The form is a client component behind a sign in, so there is no search engine concern, and a library that touches `window` is fine as long as it loads in the browser.
- The backend rules are exact, so a pin that the browser accepts should never be refused by the backend. That is why the browser checks the raw ward box and not the box plus margin.
- This is a demo with a deadline and no budget. A key, an account or a card is a cost in setup and a risk on the day.
- Both OpenStreetMap public services are shared and best effort, with written rules (a visible credit, a Referer, no autocomplete, 1 request per second).
- An old property can hold a point saved before the rules existed, outside the city or far from its ward, and the API returns it as stored. The app must not silently fix or send it.
- The edit property form does not exist until #12, so this spec builds a picker that #12 can reuse and shows the old point state on the reference page.
- Alpha workflow and a demo deadline: care goes into what a landlord sees and into failures that could block saving, not into infrastructure.

If nothing is decided, the map library, the tile source, the lookup rules and the treatment of out of place points get invented during the build, and #12 inherits whichever was chosen first.

## Options considered

### Option 1: Leaflet and react-leaflet loaded on demand, OpenStreetMap tiles, public Nominatim, no key (chosen)

A flat raster map with one draggable pin, drawn from the public OpenStreetMap tile server, with address search and reverse lookup from the public Nominatim server, all called from the browser. The map module downloads only when the landlord opens it.

**Pros**:
- No key, no account, no cost, nothing to configure or leak.
- Leaflet is the smallest fit for one pin on a street map, with keyboard support and touch handling built in. Both libraries match this project's React 19.
- Fails soft: the pin is optional and the number fields always work.
- One constants file and one lookup module to replace when moving to a paid provider.

**Cons**:
- Tiles are best effort and can be blocked under heavy use. Nominatim allows 1 request per second for the whole app.
- Vietnamese house number data is thin, and new ward names may be missing.
- `react-leaflet` has the Hippocratic License 2.1, which is not an OSI license.

### Option 2: MapLibre GL JS with react-map-gl, vector tiles and geocoding from MapTiler

A vector map (smooth zoom, tilt) using MapLibre 6.16 and react-map-gl 8.1.3 (React `>=16.3`, MapLibre optional peer), with a MapTiler key for the style, tiles and geocoding.

**Pros**:
- A nicer, smoother map, and one provider for tiles and search.
- MapTiler's free plan needs no card to start, and its search has no 1 request per second rule like Nominatim.

**Cons**:
- Much heavier than Leaflet for one pin, and it needs WebGL.
- Needs an API key that ends up in the browser, and the free plan is for non commercial use and pauses when the quota is used (the figures come from third party pages; the official pricing page did not show the search limits).
- Its data is also OpenStreetMap based, so the address quality gain is unproven.

### Option 3: Goong tiles and geocoding

A Vietnam focused provider with a Google like API, used for both the map and the address search.

**Pros**:
- Likely better Vietnamese address data (my expectation; I could not verify it).
- One provider for both.

**Cons**:
- Needs an account and a key. Priced per request: $3.50 per 1,000 forward lookups, $1.50 per 1,000 reverse, and $3 per 1,000 map loads. The pricing page shows a one time $100 credit and also "$0 free credit/month", so the free part is unclear.
- A demo can run out of credit, and the setup adds a step before anything works.

### Option 4: Google Maps JavaScript API

The most familiar map in Vietnam, with the Places and Geocoding services.

**Pros**:
- Best known data and the best address search.

**Cons**:
- Needs a Google Cloud project with billing enabled and a key, and is not free in practice. The wrong choice for a coursework demo.

## Decision calls made while writing (the RECOMMEND items)

| Question | Pick | Why | Runner up |
|---|---|---|---|
| How the map module loads | a dynamic `import()` from the button handler, in a small state hook | the Next.js guide shows it for libraries, and a failed download becomes plain state with "Thử lại", with no error boundary class (the project writes functions, not classes) | `next/dynamic` with `ssr: false` (also documented, but a load failure then needs an error boundary) |
| How lookups are called | `useMutation`, one shot per trigger | they are user triggered, not cached data, and the project rule is that mutations never retry (retries would break the 1 request per second rule) | `useQuery` with `enabled: false` |
| The pin icon | a `divIcon` with an inline SVG and token colours | Leaflet's default icon looks up image files by a path that bundlers break, and this keeps colours on the design tokens | a PNG icon copied into `public/` |
| Which box the browser checks | the raw ward `bounds` | the backend always accepts a point inside it, so a browser pass is never a backend refusal | the box plus the 0.0045 degree margin (accepts more, risks an edge case rounding failure) |
| Coordinate precision | 6 decimals, and the area check repeated after rounding | about 0.1 m is more than a pin needs, and rounding after the check could push an edge point out | the full float Leaflet gives |
| The forward lookup text | `q` = address, ward name, province, with `viewbox` and `bounded=1` when the ward has a box | the box limits results to the ward, which turns "outside the ward" into "not found" | structured `street`, `city` parameters |
| Lookup pacing | one in flight, 1.1 seconds apart, 8 second timeout | stays under the public server's 1 request per second with a small margin | 2 seconds (safer, slower) |
| Wheel and double click | wheel zoom off, double click zoom off | the page never gets trapped, and a double click cannot place a surprise pin | wheel zoom on when the map has focus |
| Map height | 20 rem on a phone, 25 rem from `md` | tall enough to see streets, short enough to leave page to scroll on a phone | taller on desktop |
| Where the zone sits | third zone, after "Địa chỉ" | the ward must be chosen first and the address typed, so the map reads as the next step; #11 adds its zones after | before the address |
| Number fields visibility | shown while the map is open | closed with no pin, the zone should be one button | always shown |
| Reading a typed number | a dot or a comma, shown with a dot | Vietnamese keyboards often type a comma, and the API needs a dot | accept only a dot |
| Street text content | only house number and road | the full OpenStreetMap name can carry old district names that no longer exist | the whole `display_name` |
| Schema shape | `createPropertySchema(wards)`, a pure function | the ward box is data, and a static schema cannot hold it | check the box in the submit handler |
| Nominatim base address and tile address | constants, not environment variables | they are not secrets or per machine settings, and a swap is a code change either way | env variables read through `src/lib/env.ts` |
| Read only map in the listing forms | no area check, no ward box, opened by a button | the point is shown as stored and the person cannot change it there | always shown, or text only |
| Ward catalog type | a new `CatalogWard` with `bounds`, the nested `Ward` unchanged | the contract says only the catalog has `bounds`, so one type must not pretend otherwise | add an optional `bounds` to `Ward` |

## Rationale

Option 1 fits the forces. The pin is optional and the project is a demo with no budget, so a map that needs no key, account or card removes the whole class of setup problems, and the soft failure design (number fields, a hint that can be wrong, a map that can be blocked) means the weak parts of free public services cannot stop a landlord from saving. Leaflet draws exactly what is needed, one pin on a flat map, and loads only when opened, which meets the scope's "do not slow the page" line. The backend rules are exact and strict, so putting the same two checks in the browser (the city boxes and the raw ward box) turns most errors into messages next to the pin before a request is sent.

The engineer picked each of these on its own (Leaflet, react-leaflet, OpenStreetMap tiles, Nominatim, button triggered lookup that never moves a hand placed pin, the hint with a "Dùng địa chỉ này" button (replaced on 2026-11-12, see the update below), keep the pin and explain when the search finds nothing in the ward, remove the pin when a ward change leaves it outside, one finger scroll with two finger map, a button that opens a small read only map in the listing forms), and all matched my recommendations. No preference was overridden.

Options 2 to 4 are not wrong, only worse for now. MapLibre adds weight and a key for a prettier map that one pin does not need. Goong and Google cost money or setup, and Goong's better Vietnamese data is only an expectation. The price of Option 1 is real and written in Consequences: the free services are shared and can disappear, so the swap point is kept to two files.

## Update of 2026-11-12: the street field fills itself

**What changed and why.** The first version showed the nearest street as a hint with a button "Dùng địa chỉ này" and never wrote into the form on its own. The engineer asked for the opposite while the build was under way (M1): when the pin is chosen, the street field should fill in by itself, and typing the address should move the pin (that half was already AC-8). The reasons given were speed and fewer steps for the landlord. The earlier worry, that OpenStreetMap data in Vietnam is thin and an automatic fill could be wrong or erase typed text, still stands, so it is handled by rules and not by a button.

**Decision calls (picked with the engineer, both matched the recommendation):**

| Question | Pick | Why | Runner up |
|---|---|---|---|
| Does editing the address move a pin the landlord placed by hand? | No. Only the button "Tìm địa chỉ trên bản đồ" moves it | fixing one typo in the text must not throw away a pin placed on the exact spot; the lookup by address is usually only as exact as the street | the last action always wins (address and pin always agree, but a precise pin can be replaced by a rough result) |
| An answer with a road but no house number | fill only an empty field; otherwise keep the text and say so | OpenStreetMap often lacks house numbers, and a street alone would erase the number the landlord typed | always fill the road (simpler, loses numbers) |

**Reversed later the same day.** Trying the first version, the engineer asked for the opposite on both calls above: wherever the pin is picked, the address changes to that place (no protection for typed text, and a road alone replaces it too), and a typed address reaches the map only through a button, now named "Tìm vị trí trên bản đồ" (no search on leaving the field or on opening the map, so a pin placed by hand is no longer a special case). Kept from the calls below: an answer is dropped when the person edited the field while it was on its way, and a fill starts no lookup. The two rows above are history; `index.md` holds the current rules. The engineer asked for this to be changed directly, without a new `/architect` run, so `/develop` edited the spec.

**Calls made while writing (the RECOMMEND items):**

| Question | Pick | Why | Runner up |
|---|---|---|---|
| The person edits the field while the answer is on its way | drop the answer | their text is the newest truth, and an overwrite under their cursor is the worst surprise | apply it anyway |
| Does a fill start the address search? | no, it is a write from code and fires no blur | otherwise a click could loop into a search and back, and each step costs a request on a shared limit | start the search and let the pin settle |
| Telling the landlord the field changed | a visible note in the live region: "Đã điền địa chỉ theo điểm ghim: …, có thể chưa đúng, hãy kiểm tra lại." | an automatic change must be seen and heard, and the doubt about the data is stated | no note |
| The fill after a lookup result or typed numbers | none, only after a click or a drag | those two already come from an address or from numbers the person chose; filling again would fight them | fill after every pin change |

**Other corrections made in the same pass (not part of the request, found while building).** (1) The ward boxes get their own query because the shared ward cache is seeded without `bounds` by the home page (spec 0016, AC-10). (2) `location-field.tsx` lives in the property feature because it needs the form types. (3) The `/dev/ui` section and its acceptance criterion were removed, following the engineer's decision of 2026-11-12 that new UI is no longer drawn there first.

## Evidence: the web check of 2026-11-05

Read once during the design conversation from the official pages and registry entries; nothing fetches them again.

| Fact | Source |
|---|---|
| `react-leaflet` 5.0.0: peers `react` `^19.0.0`, `react-dom` `^19.0.0`, `leaflet` `^1.9.0`; license Hippocratic-2.1 | npm registry entry |
| `leaflet` latest stable 1.9.4, BSD-2-Clause | npm registry entry |
| `maplibre-gl` 6.16.0, BSD-3-Clause; `react-map-gl` 8.1.3 with `react` `>=16.3.0` and optional `maplibre-gl` and `mapbox-gl` peers | npm registry entries |
| OSM tiles: no key; "best effort", no SLA, access can be blocked without notice; visible credit "© OpenStreetMap contributors" that is not hidden; a Referer on web pages; a distinct User-Agent for apps; honour caching headers (at least 7 days if the cache cannot read them); no bulk download or prefetch; heavy use may be blocked | OSM tile usage policy |
| Nominatim public server: absolute maximum 1 request per second for the whole app; autocomplete forbidden on the client; a valid Referer or User-Agent identifying the app; cache results; clear credit; user triggered reverse lookups are fine for a moderate number of users, systematic grids are forbidden | Nominatim usage policy |
| Goong: forward lookup $3.50, reverse $1.50, map loads $3.00 per 1,000 requests (under 100,000 a month); a one time $100 registration credit, while the table header says "$0 FREE CREDIT/month" (conflict) | Goong pricing page |
| MapTiler Cloud: free plan for non commercial use, logo required, service pauses at quota; figures for the monthly allowance came from third party pages only | MapTiler terms page, via search; not fetched |
| Next.js: `ssr: false` works only inside a Client Component; libraries can be loaded on demand with `import()` in a handler | `node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md` |

Agent Skills searched for Leaflet and react-leaflet on 2026-11-05: none for react-leaflet; the best Leaflet ones were `zenobi-us/dotfiles@leaflet-mapping` (73 installs), `agents-inc/skills@web-maps-leaflet` (30) and `terminalskills/skills@leaflet` (28). The engineer declined all three. No MCP server was searched for.

## References

**Project sources**:
- `AGENTS.md`: the stack, the Tracer Bullet approach, the rules on env, forms, tokens and the contrast script.
- `api-for-frontend.md`, sections 6.15 (ward `bounds`) and 6.17 (coordinate rules, `COORDINATE_OUT_OF_AREA`, `COORDINATE_FAR_FROM_WARD`).
- Spec 0001 (two data paths, the site's `Referrer-Policy` in `next.config.ts`), spec 0003 and 0004 (zones and tokens), spec 0006 (the listing forms), spec 0010 (its Follow-up about old points).
- `docs/scope/landlord.md`, item #33.

**Practices & standards**:
- Load a heavy, optional widget only when the person asks for it.
- A third party failure never blocks the main task (graceful degradation).
- WCAG 2.2: success criterion 2.5.7 (a dragging movement needs a single pointer alternative) and 2.5.8 (target size), which is why the number fields and the click exist.
- The OpenStreetMap Foundation usage rules for tiles and Nominatim, named above.

**Links** (web verified):
- OpenStreetMap tile usage policy: https://operations.osmfoundation.org/policies/tiles/
- Nominatim usage policy: https://operations.osmfoundation.org/policies/nominatim/
- Goong pricing: https://goong.io/pricing-plans/
- react-leaflet on the npm registry: https://registry.npmjs.org/react-leaflet/latest
- leaflet on the npm registry: https://registry.npmjs.org/leaflet/latest
- maplibre-gl on the npm registry: https://registry.npmjs.org/maplibre-gl/latest
- react-map-gl on the npm registry: https://registry.npmjs.org/react-map-gl/latest
