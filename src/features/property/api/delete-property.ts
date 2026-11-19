import type { QueryClient } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Uuid } from "@/lib/api/types";
import { propertiesKey } from "./properties-key";

/**
 * `DELETE /properties/:id` (api-for-frontend.md, 6.17): 204. A property that still has listings
 * answers 409 `PROPERTY_HAS_LISTINGS`, whatever their status.
 */
export const deleteProperty = (api: ApiClient, id: Uuid) =>
  api.delete<void>(`/properties/${encodeURIComponent(id)}`);

/**
 * What to read again after a write to a property (delete now, save in the edit form). Every
 * cached property read lives under `propertiesKey`: the page that is open is read again now, and
 * the others (the picker of the post listing form, an edit page) are marked out of date and read
 * when they are next used.
 */
export async function refreshAfterPropertyWrite(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: propertiesKey });
}
