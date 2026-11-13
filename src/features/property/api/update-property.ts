import type { QueryClient } from "@tanstack/react-query";
import { listingsOfMineKey } from "@/features/listing/api/owner-listing";
import type { ApiClient } from "@/lib/api/client";
import type { Property, Uuid } from "@/lib/api/types";
import type { PropertyPatch } from "../schemas/property-patch";
import { propertiesKey, propertyDetailKey } from "./properties-key";

/**
 * `PATCH /properties/:id` (api-for-frontend.md, 6.17): the property after the change. The body
 * holds changed fields only (spec 0019, AC-14), and a `fees` or `amenityKeys` in it replaces the
 * whole list.
 */
export const updateProperty = (api: ApiClient, id: Uuid, body: PropertyPatch) =>
  api.patch<Property>(`/properties/${encodeURIComponent(id)}`, body);

/**
 * What to do with the cache after a save (spec 0019, AC-14, AC-17). The answer is written into
 * the detail entry, so the form and a later visit start from what was saved. The property lists
 * (and with them the picker of the post listing form) and every loaded listing are marked out of
 * date and read when they are next used: the person stays on this page, so nothing is read now.
 */
export function refreshAfterPropertySave(
  queryClient: QueryClient,
  saved: Property,
): void {
  queryClient.setQueryData(propertyDetailKey(saved.id), saved);
  void queryClient.invalidateQueries({
    queryKey: propertiesKey,
    refetchType: "none",
  });
  // Every listing the browser has loaded carries the name and address of its property.
  void queryClient.invalidateQueries({
    queryKey: listingsOfMineKey,
    refetchType: "none",
  });
}
