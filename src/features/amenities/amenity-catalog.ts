import type { UseQueryResult } from "@tanstack/react-query";
import type { Amenity } from "@/lib/api/types";

/**
 * The state of the amenity catalog as the amenity box of a form sees it. A parent form reads the
 * catalog once with `useAmenities` and hands the box this value, so the box does not call the
 * network itself and `/dev/ui` can show every state with a value made by hand (spec 0017, AC-11
 * and AC-13).
 */
export type AmenityCatalog =
  | { status: "loading" }
  | { status: "error"; error: unknown; retry: () => void }
  | { status: "ready"; amenities: readonly Amenity[] };

/**
 * A query result as a catalog state. Data wins over an error: when a read again fails but the
 * list from before is still there, the boxes stay. With no data yet, an error becomes the
 * "error" state, and a retry that is running reads as "loading" again (TanStack clears the error
 * of a query that has no data when it fetches).
 */
export function amenityCatalogOf(
  query: Pick<
    UseQueryResult<Amenity[]>,
    "data" | "isError" | "error" | "refetch"
  >,
): AmenityCatalog {
  if (query.data) return { status: "ready", amenities: query.data };
  if (query.isError) {
    return {
      status: "error",
      error: query.error,
      retry: () => {
        void query.refetch();
      },
    };
  }
  return { status: "loading" };
}
