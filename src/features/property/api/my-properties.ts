import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Page, PropertyListItem } from "@/lib/api/types";
import { propertiesKey } from "./properties-key";

/** Ten rows a page. The picker of the post listing form reads 50 and has its own entry. */
export const MY_PROPERTIES_PAGE_SIZE = 10;

export const myPropertiesPageKey = (page: number) =>
  [
    ...propertiesKey,
    "mine",
    { page, pageSize: MY_PROPERTIES_PAGE_SIZE },
  ] as const;

/**
 * `GET /properties` (api-for-frontend.md, 6.17): the landlord's own properties with the
 * `fullAddress` the backend joined and the `listingCount`. The session clears the cache when it
 * changes, so the key needs no user id.
 */
export const fetchMyProperties = (
  api: ApiClient,
  page: number,
  signal?: AbortSignal,
) =>
  api.get<Page<PropertyListItem>>("/properties", {
    query: { page, pageSize: MY_PROPERTIES_PAGE_SIZE },
    signal,
  });

/** One page of the list. The previous page stays on screen while the next one loads. */
export const myPropertiesQuery = (api: ApiClient, page: number) =>
  queryOptions({
    queryKey: myPropertiesPageKey(page),
    queryFn: ({ signal }) => fetchMyProperties(api, page, signal),
    placeholderData: keepPreviousData,
  });
