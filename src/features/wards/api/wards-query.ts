import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { CatalogWard, Ward } from "@/lib/api/types";

export const wardsKey = ["wards"] as const;
// The same list with each ward's `bounds`, under its own key (spec 0011). The `["wards"]` entry
// cannot be trusted to hold them: the home page seeds it from `getWards()`, which leaves the
// boxes out on purpose (spec 0016, AC-10), and a seeded entry never goes stale. Under `wardsKey`
// as a prefix, so an admin's catalog edit that drops `["wards"]` drops this one too.
export const wardBoundsKey = [...wardsKey, "bounds"] as const;

// The list changes only when an admin edits the catalog (api-for-frontend.md, 6.15), so one
// read is kept for the whole visit. The route is public: no token, and no session wait.
export const wardsQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: wardsKey,
    queryFn: ({ signal }) =>
      api.get<Ward[]>("/wards", { auth: "none", signal }),
    staleTime: Infinity,
  });

// Read only when the landlord opens the map: the whole list with the boxes is about 41 KB.
export const wardBoundsQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: wardBoundsKey,
    queryFn: ({ signal }) =>
      api.get<CatalogWard[]>("/wards", { auth: "none", signal }),
    staleTime: Infinity,
  });
