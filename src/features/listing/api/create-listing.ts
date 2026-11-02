import type { ApiClient } from "@/lib/api/client";
import type { OwnerListingDetail, Uuid } from "@/lib/api/types";
import { POST_TIMEOUT_MS } from "../schemas/picked-photos";

/**
 * `POST /properties/:propertyId/listings` (api-for-frontend.md, 6.18): the new listing with its
 * photos, shown at once. Since 2026-11-02 the call takes `multipart/form-data` only (the text
 * fields and 1 to 5 `images`), and the backend saves all of it or none. The client sets the
 * `Content-Type` with its boundary. The property goes in the path and never in the body. Five
 * photos can be 25 MiB, so this call has its own time limit (spec 0006, AC-6).
 */
export const createListing = (
  api: ApiClient,
  propertyId: Uuid,
  form: FormData,
) =>
  api.post<OwnerListingDetail>(
    `/properties/${encodeURIComponent(propertyId)}/listings`,
    form,
    { timeoutMs: POST_TIMEOUT_MS },
  );
