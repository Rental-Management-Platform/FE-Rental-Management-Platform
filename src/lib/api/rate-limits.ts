// How long the backend blocks a caller after a 429, from api-for-frontend.md section 3,
// column "Bị chặn trong". Used when the browser cannot read the `Retry-After` header
// (FE and API on different origins).

export interface RateLimitRule {
  method: string;
  /** Path under the API address. `:name` matches exactly one segment. */
  pattern: string;
  blockSeconds: number;
}

const HOUR = 3600;
const QUARTER_HOUR = 900;
const MINUTE = 60;

/** Used for any request that matches no rule below. */
export const DEFAULT_BLOCK_SECONDS = MINUTE;

const rule = (
  method: string,
  patterns: string[],
  blockSeconds: number,
): RateLimitRule[] =>
  patterns.map((pattern) => ({ method, pattern, blockSeconds }));

export const RATE_LIMIT_RULES: readonly RateLimitRule[] = [
  ...rule(
    "POST",
    ["/auth/register", "/auth/forgot-password", "/auth/reset-password"],
    HOUR,
  ),
  ...rule("POST", ["/auth/login", "/auth/change-password"], QUARTER_HOUR),
  ...rule("POST", ["/auth/refresh"], MINUTE),
  ...rule("POST", ["/properties"], HOUR),
  ...rule("PATCH", ["/properties/:id"], HOUR),
  ...rule("DELETE", ["/properties/:id"], HOUR),
  ...rule("POST", ["/properties/:id/listings"], HOUR),
  ...rule("PATCH", ["/listings/:id"], HOUR),
  ...rule("DELETE", ["/listings/:id"], HOUR),
  ...rule("POST", ["/listings/:id/hide", "/listings/:id/show"], HOUR),
  ...rule("POST", ["/listings/:id/images"], HOUR),
  ...rule("POST", ["/orders", "/orders/:id/pay", "/orders/:id/cancel"], HOUR),
  ...rule("POST", ["/landlords/:id/follow", "/listings/:id/favorite"], HOUR),
  ...rule("DELETE", ["/landlords/:id/follow", "/listings/:id/favorite"], HOUR),
  ...rule("PATCH", ["/me/profile"], HOUR),
  // Chat (spec 0012, AC-21). Opening a conversation is 20 an hour and sending is 30 a minute.
  // The five chat reads and `POST /conversations/:id/read` fall to the 60 second default, which
  // is what the contract says for them.
  ...rule("POST", ["/listings/:id/conversations"], HOUR),
  ...rule("POST", ["/conversations/:id/messages"], MINUTE),
  // Landlord reviews (spec 0013, AC-15). Write, edit and delete are 20 an hour each, blocked for an
  // hour. The two reads (`GET /landlords/:id/review` and `/reviews`) fall to the 60 second default,
  // which is what the contract says for them (300 a minute, blocked one minute).
  ...rule("POST", ["/landlords/:id/review"], HOUR),
  ...rule("PATCH", ["/landlords/:id/review"], HOUR),
  ...rule("DELETE", ["/landlords/:id/review"], HOUR),
  // Listing reviews (spec 0014, AC-18). The same three writes for one room: 20 an hour each, blocked
  // for an hour. The two reads (`GET /listings/:id/review` and `/reviews`) fall to the 60 second
  // default, which matches the contract (300 a minute).
  ...rule("POST", ["/listings/:id/review"], HOUR),
  ...rule("PATCH", ["/listings/:id/review"], HOUR),
  ...rule("DELETE", ["/listings/:id/review"], HOUR),
  ...rule(
    "GET",
    [
      "/listings",
      "/listings/:slugCode",
      "/plans",
      "/landlords/:id",
      "/landlords/:id/listings",
      "/me/favorites",
    ],
    MINUTE,
  ),
];

const segmentsOf = (path: string) =>
  path.split(/[?#]/, 1)[0].split("/").filter(Boolean);

// Whole segments only, so `/landlords/:id` does not match `/landlords/:id/listings`.
function matchesPattern(pattern: string, path: string): boolean {
  const want = segmentsOf(pattern);
  const have = segmentsOf(path);
  return (
    want.length === have.length &&
    want.every((segment, i) => segment.startsWith(":") || segment === have[i])
  );
}

/** Seconds the backend blocks a caller after a 429 on this request. */
export function blockSecondsFor(method: string, path: string): number {
  const upper = method.toUpperCase();
  const found = RATE_LIMIT_RULES.find(
    (r) => r.method === upper && matchesPattern(r.pattern, path),
  );
  return found?.blockSeconds ?? DEFAULT_BLOCK_SECONDS;
}
