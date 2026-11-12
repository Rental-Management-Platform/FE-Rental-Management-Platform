import { z } from "zod";
import { anySignal } from "@/lib/api/abort";
import type { WardBounds } from "@/lib/api/types";
import { LOOKUP_TIMEOUT_MS, NOMINATIM_URL } from "../config";
import type { Pin } from "../pin";
import type { Street } from "../street";

// The two calls to the public Nominatim (spec 0011, AC-8, AC-9, AC-16). Both are plain `fetch`
// calls from the browser with no credentials and no custom header, so there is no CORS
// preflight and nothing from the app's session ever goes to OpenStreetMap.

/** What a search for an address needs: the typed street and the chosen ward. */
export interface SearchTarget {
  addressText: string;
  wardName: string;
  provinceName: string;
  bounds: WardBounds | null;
}

/**
 * `GET /search`: the street, the ward and the province as one text. When the ward has a box,
 * the search is limited to it (`viewbox` with `bounded=1`, corners given as longitude then
 * latitude), so a street outside the ward becomes "not found" instead of a far away hit.
 */
export function searchUrl({
  addressText,
  wardName,
  provinceName,
  bounds,
}: SearchTarget): URL {
  const url = new URL("/search", NOMINATIM_URL);
  url.searchParams.set("q", `${addressText}, ${wardName}, ${provinceName}`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "vn");
  url.searchParams.set("accept-language", "vi");
  if (bounds) {
    url.searchParams.set(
      "viewbox",
      `${bounds.minLongitude},${bounds.maxLatitude},${bounds.maxLongitude},${bounds.minLatitude}`,
    );
    url.searchParams.set("bounded", "1");
  }
  return url;
}

/** `GET /reverse`: the address nearest to a point, with the parts split out. */
export function reverseUrl({ latitude, longitude }: Pin): URL {
  const url = new URL("/reverse", NOMINATIM_URL);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("accept-language", "vi");
  return url;
}

// Nominatim sends the coordinates as text. Anything that does not fit is a failed lookup.
const searchSchema = z.array(z.object({ lat: z.string(), lon: z.string() }));

// A point with no address answers 200 with `{ "error": ... }` and no `address`: no road.
const reverseSchema = z.object({
  address: z
    .object({
      house_number: z.string().optional(),
      road: z.string().optional(),
    })
    .optional(),
});

async function getJson<T>(
  url: URL,
  schema: z.ZodType<T>,
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    credentials: "omit",
    signal: anySignal(signal, AbortSignal.timeout(LOOKUP_TIMEOUT_MS)),
  });
  if (!response.ok) throw new Error(`Nominatim answered ${response.status}`);
  return schema.parse(await response.json());
}

/** The points of a search, best first. A row whose numbers do not parse is left out. */
export async function searchAddress(
  target: SearchTarget,
  signal: AbortSignal,
): Promise<Pin[]> {
  const rows = await getJson(searchUrl(target), searchSchema, signal);
  return rows.flatMap(({ lat, lon }) => {
    const latitude = Number(lat);
    const longitude = Number(lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude)
      ? [{ latitude, longitude }]
      : [];
  });
}

export async function reverseStreet(
  pin: Pin,
  signal: AbortSignal,
): Promise<Street> {
  const body = await getJson(reverseUrl(pin), reverseSchema, signal);
  return {
    houseNumber: body.address?.house_number ?? null,
    road: body.address?.road ?? null,
  };
}
