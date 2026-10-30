import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Page, PropertyListItem } from "@/lib/api/types";

// The picker offers the first 50 properties only, a known limit (spec 0006). A paginated list
// in #12 passes its own page, so it gets its own cache entry.
const PICKER_PAGE = { page: 1, pageSize: 50 } as const;

/**
 * `GET /properties` (api-for-frontend.md, 6.17): the landlord's own properties, with the
 * `fullAddress` the backend joined. The session clears the cache when it changes, so the key
 * needs no user id.
 */
export const propertiesQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: ["properties", "mine", PICKER_PAGE],
    queryFn: ({ signal }) =>
      api.get<Page<PropertyListItem>>("/properties", {
        query: PICKER_PAGE,
        signal,
      }),
  });
