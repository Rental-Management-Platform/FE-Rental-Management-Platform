import type { ApiClient } from "@/lib/api/client";
import type { LandlordProfile } from "@/lib/api/types";

// Both calls need a login, take no body, and answer 200 with the profile read again after the
// write (api-for-frontend.md, 6.32). Calling twice is safe, so a double click cannot make a wrong
// count.

/** `POST /landlords/:id/follow` (`follow:create`). */
export const followLandlord = (api: ApiClient, landlordId: string) =>
  api.post<LandlordProfile>(`/landlords/${landlordId}/follow`);

/** `DELETE /landlords/:id/follow` (`follow:delete`). */
export const unfollowLandlord = (api: ApiClient, landlordId: string) =>
  api.delete<LandlordProfile>(`/landlords/${landlordId}/follow`);
