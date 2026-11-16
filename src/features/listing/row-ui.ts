import type { QuotaRefusal } from "@/features/membership/refusal";
import type { ApiError } from "@/lib/api/errors";

// What one row of "Tin của tôi" holds on its own, apart from the server data (spec 0019,
// "State lives in"): whether a write is running, and the line under the row about the last one.

export type RowNotice =
  /** The state moved under the page, so the press did nothing. Not an error. */
  | { kind: "warning"; message: string }
  /** A refusal the person can act on (no plan, limit reached), with the way out. Not an error (spec 0020, AC-8). */
  | ({ kind: "blocked" } & QuotaRefusal)
  /** The call failed. Nothing was sent again by itself. */
  | { kind: "error"; message: string }
  /** A 429: the buttons of the row stay locked while the wait counts down. */
  | { kind: "rate-limited"; error: ApiError };

export interface RowUi {
  pending: boolean;
  notice: RowNotice | null;
}

export const IDLE_ROW: RowUi = { pending: false, notice: null };
