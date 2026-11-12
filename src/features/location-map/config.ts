// Every constant of the location map in one place, so a change of map or search provider later
// touches this file and `api/nominatim.ts` only (spec 0011, "Configuration required").

/** The two boxes the backend accepts a point in (api-for-frontend.md, 6.17). Edges count as inside. */
export const CITY_BOXES = [
  // The mainland, with the old Bình Dương and Bà Rịa Vũng Tàu.
  {
    minLatitude: 10.2,
    maxLatitude: 11.7,
    minLongitude: 106.2,
    maxLongitude: 107.7,
  },
  // Côn Đảo.
  {
    minLatitude: 8.4,
    maxLatitude: 8.9,
    minLongitude: 105.9,
    maxLongitude: 106.9,
  },
] as const;

/** The view when there is no pin and the ward has no box. */
export const CITY_VIEW = {
  latitude: 10.7769,
  longitude: 106.7009,
  zoom: 11,
} as const;

/** The zoom when the map centres on a pin that was already there. */
export const PIN_ZOOM = 17;
/** The zoom after a lookup found an address. */
export const LOOKUP_ZOOM = 18;

export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const TILE_MAX_ZOOM = 19;
export const COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";
/** The credit in the attribution corner. It is always shown (spec 0011, AC-16). */
export const ATTRIBUTION_HTML = `&copy; <a href="${COPYRIGHT_URL}" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors`;

export const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
/** The public Nominatim allows one request a second for the whole app. */
export const LOOKUP_GAP_MS = 1100;
export const LOOKUP_TIMEOUT_MS = 8000;

/** About 0.1 m. The same number of decimals the form shows and the request sends. */
export const PIN_DECIMALS = 6;

/** The two map heights of the skeleton, the map and the read only map (20 rem, 25 rem from `md`, 15 rem). */
export const MAP_HEIGHT_CLASS = "h-80 md:h-[25rem]";
export const READ_ONLY_MAP_HEIGHT_CLASS = "h-60";
/** The map of the public listing page (spec 0018): 15 rem on a phone, 20 rem from `md`. */
export const LISTING_MAP_HEIGHT_CLASS = "h-60 md:h-80";
