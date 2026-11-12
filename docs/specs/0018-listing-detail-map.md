# 0018 · Location pin on listing detail

**Status**: Assumed
**Date**: 2026-11-12
**Authorized by**: the engineer, in chat during /develop

## Owed decision

How the public listing detail page shows the saved point of a property on a map: where it sits, when its code and tiles load, what happens to a point that cannot be right, and what happens when the map fails. Spec 0011 left this open on purpose ("#29 stays dropped", and its Follow up asks a revived #29 to decide for itself whether to check an old stored point).

## Assumption built on

The engineer answered the two product choices in chat on 2026-11-12, and the rest is my assumption.

Answered by the engineer:
- The map shows by itself when the person scrolls to it, not behind a button.
- A stored point outside Thành phố Hồ Chí Minh hides the whole block. The ward box is not checked, because the listing data carries no `bounds`.

Assumed by `/develop`:
- **Where.** Inside `PropertyZone`, as its own part with an `h2` "Vị trí trên bản đồ", right after the part with the name and the address and before the fees.
- **Source of the point.** `listing.property.latitude` and `listing.property.longitude` of `GET /listings/:slugCode` (api-for-frontend.md, 6.20). No new API call. `PropertyZoneData` gains the two fields.
- **Shown only when** both numbers are not `null` and the point is inside one of the two city boxes (`isInsideCity` of spec 0011). Otherwise the page has no part, no heading and no empty box.
- **Loading.** The part is a box of fixed height from the first paint (15 rem on a phone, 20 rem from `md`), so the page does not jump. The map module (Leaflet, its stylesheet and the tiles) is imported only when the box comes within 200 px of the screen, once, and stays loaded. A page whose box is never scrolled to requests none of it. Without JavaScript the box shows the line "Cần bật JavaScript để xem bản đồ."
- **The map.** The same read only `LocationMap` as the listing forms of spec 0011: one pin with the title "Ghim vị trí nhà trọ", opened centred on the point at zoom 17, zoom by the + and − buttons or the keyboard, the mouse wheel scrolls the page, one finger scrolls the page and two fingers move the map, the credit "© OpenStreetMap contributors" always visible, label "Vị trí nhà trọ trên bản đồ".
- **Failure.** If the map module cannot be loaded, the part shows "Không tải được bản đồ" with a "Thử lại" button. If the first tiles do not load, a short note says the map picture is missing. The address in text stays the source of truth.
- **Left out on purpose.** A directions link, `geo` in the JSON-LD, a pin on list pages, a map on the share image, and any search by place.
- **No `/dev/ui` section** (engineer decision of 2026-11-12). The page is checked on a real listing.

## Code area

- `src/features/listing-detail/components/property-zone.tsx` (the new part and the two fields)
- `src/features/location-map/components/listing-location.tsx` (new, the box, the in view loading and the states)
- `src/features/location-map/hooks/use-in-view.ts` (new)
- `src/features/location-map/config.ts` (the height of the box)
- `src/features/location-map/area.ts` (reuse `isInsideCity`)

## Requirements

Seeds from the scope "Done when" (points with a point show a one point map, points without hide the block, the map does not slow the page on a phone):
- **AC-1**: A listing whose property has both coordinates inside the city shows the part "Vị trí trên bản đồ". A property with no point, one coordinate only, or a point outside the two city boxes shows nothing of it.
- **AC-2**: The box has its final height from the first paint. Leaflet, its stylesheet and every tile are requested only after the box nears the screen.
- **AC-3**: The map is read only with the saved point at zoom 17, the + and − buttons, no wheel zoom, and the OpenStreetMap credit always visible.
- **AC-4**: A failed module load shows a message and "Thử lại". Failed tiles show a note. Without JavaScript the box says the map needs it.
- **AC-5**: Fine at 320 px with no sideways scroll, and one finger still scrolls the page over the map.
- **AC-6**: `PropertyZone` still draws from props only. No new request is made by the page itself.

## Ratify

This decision was recorded by /develop, not deliberated. Run `/architect location pin on listing detail`
to deliberate and ratify it. Until then it stays flagged as an owed decision; it does not block marking the feature `done`.
