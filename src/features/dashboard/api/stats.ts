import { queryOptions } from "@tanstack/react-query";
import type { StatKey } from "@/components/shells/workspace-tools";
import type { ApiClient } from "@/lib/api/client";
import type { Page, PermissionKey } from "@/lib/api/types";

// Every number on a dashboard card comes from one small request made in the browser with the
// access token (spec 0008, AC-7). A request is a "source"; a card names the sources it needs,
// and two cards that need the same source share one request because the query key is the same.
// The session clears the cache when it changes, so the key needs no user id.
export const dashboardKey = ["dashboard"] as const;

export type CountSource = "properties";
export type SourceName = CountSource;

// What a source keeps in the cache. A list answer is cut down to its `total` before it is
// stored, so the cache never holds another person's email or phone (spec 0008, "Security model").
// Every source gives the same type, so a card can read the values of all its sources as one list.
export type SourceValue = { source: CountSource; total: number };

// The permission the API of a source needs. A source is requested only when the person holds it,
// and a person without it gets no request and no slot (spec 0008, "Value sourcing").
export const SOURCE_PERMISSION: Record<SourceName, PermissionKey> = {
  properties: "property:read",
};

// The sources each number needs, in the order its lines are written. A number with no source
// yet has no slot.
export const SOURCES_OF: Record<StatKey, readonly SourceName[]> = {
  propertyCount: ["properties"],
  quota: [],
  myListings: [],
  plan: [],
  hiddenListings: [],
  users: [],
  paidOrders: [],
  revenue: [],
};

type Reader = (api: ApiClient, signal: AbortSignal) => Promise<SourceValue>;

// A list call asks for one row, because only `total` is read.
const COUNT_PAGE = { page: 1, pageSize: 1 } as const;

const READERS: Record<SourceName, Reader> = {
  properties: async (api, signal) => {
    const page = await api.get<Page<unknown>>("/properties", {
      query: COUNT_PAGE,
      signal,
    });
    return { source: "properties", total: page.total };
  },
};

export const sourceQuery = (api: ApiClient, source: SourceName) =>
  queryOptions({
    queryKey: [...dashboardKey, source],
    queryFn: ({ signal }) => READERS[source](api, signal),
  });
