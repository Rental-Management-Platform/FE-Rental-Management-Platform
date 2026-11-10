import { queryOptions } from "@tanstack/react-query";
import type { ApiClient } from "@/lib/api/client";
import type { Ward } from "@/lib/api/types";

export const wardsKey = ["wards"] as const;

// The list changes only when an admin edits the catalog (api-for-frontend.md, 6.15), so one
// read is kept for the whole visit. The route is public: no token, and no session wait.
export const wardsQuery = (api: ApiClient) =>
  queryOptions({
    queryKey: wardsKey,
    queryFn: ({ signal }) =>
      api.get<Ward[]>("/wards", { auth: "none", signal }),
    staleTime: Infinity,
  });
