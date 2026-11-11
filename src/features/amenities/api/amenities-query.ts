import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Amenity } from "@/lib/api/types";

export const amenitiesKey = ["amenities"] as const;

// The list changes only when an admin edits the catalog (api-for-frontend.md, 6.16), so one read
// is kept for the whole visit; a failed save (`AMENITY_UNKNOWN`) reads it again. The route is
// public: no token, and no session wait. Same shape as `wardsQuery`.
export const amenitiesQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: amenitiesKey,
    queryFn: ({ signal }) =>
      api.get<Amenity[]>("/amenities", { auth: "none", signal }),
    staleTime: Infinity,
  });
