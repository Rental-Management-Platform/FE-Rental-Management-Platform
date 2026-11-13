import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Profile, UpdateProfileBody } from "@/lib/api/types";

/** The cache entry of the profile of the person who is signed in. A save writes its answer here. */
export const profileKey = ["profile"] as const;

/**
 * `GET /me/profile` (api-for-frontend.md, 6.35): the seven fields of the person in the token.
 * There is no id: the profile is always the caller's own. `gcTime: 0` drops it when the page is
 * left, so each visit reads again and an email and a phone number never wait in the cache.
 * The two refetches that happen by themselves are off, so the form is never rebuilt under the
 * person's typing.
 */
export const profileQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: profileKey,
    queryFn: ({ signal }) => api.get<Profile>("/me/profile", { signal }),
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

/**
 * `PATCH /me/profile`: the profile after the change. The body holds changed fields only, and only
 * `name` and `phone`: anything else is a 400.
 */
export const updateProfile = (api: ApiClient, body: UpdateProfileBody) =>
  api.patch<Profile>("/me/profile", body);
