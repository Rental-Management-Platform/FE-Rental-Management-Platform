import type { UseQueryOptions } from "@tanstack/react-query";
import type { StatKey } from "@/components/shells/workspace-tools";
import { getUnread } from "@/features/chat/api/chat-api";
import { chatKeys } from "@/features/chat/api/chat-keys";
import { UNREAD_STALE_MS } from "@/features/chat/api/chat-queries";
import type { ApiClient } from "@/lib/api/client";
import type {
  Membership,
  Page,
  PermissionKey,
  RevenueResponse,
  UnreadSummary,
} from "@/lib/api/types";

// Every number on a dashboard card comes from one small request made in the browser with the
// access token (spec 0008, AC-7). A request is a "source"; a card names the sources it needs,
// and two cards that need the same source share one request because the query key is the same.
// The session clears the cache when it changes, so the key needs no user id.
export const dashboardKey = ["dashboard"] as const;

// A source that is a list call: only its `total` is kept.
export type CountSource =
  | "properties" // landlord: GET /properties
  | "hiddenByAdmin" // landlord: GET /me/listings?status=hidden_by_admin
  | "moderation" // admin: GET /moderation/listings?status=hidden_by_admin
  | "users" // admin: GET /users
  | "lockedUsers"; // admin: GET /users?status=locked
export type SourceName = CountSource | "membership" | "revenue" | "unreadChat"; // landlord: GET /me/conversations/unread-count (the page header indicator reads it too)

type CountValue = {
  [S in CountSource]: { source: S; total: number };
}[CountSource];

// What a source keeps in the cache. A list answer is cut down to its `total` before it is
// stored, so the cache never holds another person's email or phone (spec 0008, "Security model").
// Every source gives this one type, so a card can read the values of all its sources as a list.
export type SourceValue =
  | CountValue
  | { source: "membership"; membership: Membership }
  | ({ source: "revenue" } & Pick<RevenueResponse, "paidCount" | "paidAmount">)
  | ({ source: "unreadChat" } & Pick<UnreadSummary, "unreadConversations">);

// What a source keeps in the cache under its key. The chat count is the API answer itself, because
// the indicator in the page header reads the same entry (spec 0012, AC-19); `select` turns it
// into a `SourceValue` for the card.
type CachedSource = SourceValue | UnreadSummary;

const isUnreadSummary = (cached: CachedSource): cached is UnreadSummary =>
  !("source" in cached);

const toSourceValue = (cached: CachedSource): SourceValue =>
  isUnreadSummary(cached)
    ? { source: "unreadChat", unreadConversations: cached.unreadConversations }
    : cached;

// The permission the API of a source needs. A source is requested only when the person holds it,
// and a person without it gets no request and no slot (spec 0008, "Value sourcing").
export const SOURCE_PERMISSION: Record<SourceName, PermissionKey> = {
  properties: "property:read",
  hiddenByAdmin: "listing:read",
  membership: "subscription:read",
  moderation: "listing:moderate",
  users: "user:read",
  lockedUsers: "user:read",
  revenue: "order:report",
  unreadChat: "conversation:read",
};

// The sources each number needs, in the order its lines are written.
export const SOURCES_OF: Record<StatKey, readonly SourceName[]> = {
  propertyCount: ["properties"],
  quota: ["membership"],
  myListings: ["membership", "hiddenByAdmin"],
  plan: ["membership"],
  unreadChat: ["unreadChat"],
  hiddenListings: ["moderation"],
  users: ["users", "lockedUsers"],
  // Both money cards read the one answer of `GET /orders/revenue`, so it is one request.
  paidOrders: ["revenue"],
  revenue: ["revenue"],
};

type Reader = (api: ApiClient, signal: AbortSignal) => Promise<SourceValue>;

// A list call asks for one row, because only `total` is read.
const COUNT_PAGE = { page: 1, pageSize: 1 } as const;

// A list answer cut down to its `total`: the rows, with their emails and phones, are dropped.
const totalReader =
  (
    source: CountSource,
    path: string,
    query: Record<string, string> = {},
  ): Reader =>
  async (api, signal) => {
    const page = await api.get<Page<unknown>>(path, {
      query: { ...COUNT_PAGE, ...query },
      signal,
    });
    return { source, total: page.total };
  };

// `unreadChat` has no reader here: it reads the chat key through `sourceQuery`.
const READERS: Record<Exclude<SourceName, "unreadChat">, Reader> = {
  // GET /properties (6.17): the landlord's own properties.
  properties: totalReader("properties", "/properties"),
  // GET /me/listings (6.18): the landlord's own listings that an admin hid.
  hiddenByAdmin: totalReader("hiddenByAdmin", "/me/listings", {
    status: "hidden_by_admin",
  }),
  // GET /moderation/listings (6.29): the listings of everyone that an admin hid.
  moderation: totalReader("moderation", "/moderation/listings", {
    status: "hidden_by_admin",
  }),
  // GET /users (6.34): every account, and the locked ones.
  users: totalReader("users", "/users"),
  lockedUsers: totalReader("lockedUsers", "/users", { status: "locked" }),
  // GET /me/membership (6.25): the trial or the plan, the limit and what is left of it.
  membership: async (api, signal) => ({
    source: "membership",
    membership: await api.get<Membership>("/me/membership", { signal }),
  }),
  // GET /orders/revenue (6.38) with no dates: every paid order. Its only parameters are `from`,
  // `to` and `groupBy`; `page`, `pageSize` and `status` are rejected.
  revenue: async (api, signal) => {
    const { paidCount, paidAmount } = await api.get<RevenueResponse>(
      "/orders/revenue",
      { signal },
    );
    return { source: "revenue", paidCount, paidAmount };
  },
};

export const sourceQuery = (
  api: ApiClient,
  source: SourceName,
): UseQueryOptions<CachedSource, Error, SourceValue> =>
  source === "unreadChat"
    ? // The same key and the same reader as `unreadQueryOptions` of chat, so the card and the
      // indicator are one request and one cache entry. No second key (spec 0012, AC-19).
      {
        queryKey: chatKeys.unread(),
        queryFn: ({ signal }) => getUnread(api, signal),
        staleTime: UNREAD_STALE_MS,
        select: toSourceValue,
      }
    : {
        queryKey: [...dashboardKey, source],
        queryFn: ({ signal }) => READERS[source](api, signal),
        select: toSourceValue,
      };
