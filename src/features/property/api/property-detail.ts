import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import { isApiError } from "@/lib/api/errors";
import type { Property } from "@/lib/api/types";
import { propertyDetailKey } from "./properties-key";

/** A failure that takes the whole page, not the form: the property is gone, or is not mine. */
export type PropertyBlock = "not-found" | "forbidden";

/**
 * Which page level state a failed read or save of one property calls for, or `null` for an
 * ordinary failure (a field message, a form message, a retry). A malformed id answers 400
 * `INVALID_ID`, which for the person is the same as a property that does not exist.
 */
export const propertyBlock = (error: unknown): PropertyBlock | null => {
  if (!isApiError(error)) return null;
  if (error.code === "PROPERTY_NOT_FOUND" || error.code === "INVALID_ID") {
    return "not-found";
  }
  return error.code === "NOT_RESOURCE_OWNER" ? "forbidden" : null;
};

/** `GET /properties/:id` (api-for-frontend.md, 6.17): one property of mine, with fees and amenities. */
export const fetchProperty = (
  api: ApiClient,
  id: string,
  signal?: AbortSignal,
) => api.get<Property>(`/properties/${encodeURIComponent(id)}`, { signal });

/**
 * The property as a query. It opens the edit form once, so the two refetches that happen by
 * themselves are off: the form is never rebuilt under the person's typing.
 */
export const propertyDetailQuery = (api: ApiClient, id: string) =>
  queryOptions({
    queryKey: propertyDetailKey(id),
    queryFn: ({ signal }) => fetchProperty(api, id, signal),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
