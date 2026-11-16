import { isApiError } from "@/lib/api/errors";

/**
 * The two refusals the backend gives when a membership gates a listing (api-for-frontend.md,
 * section 7, step 0 and step 6): no trial and no plan, or the limit of the plan is reached. They
 * are messages for the landlord, not system errors (spec 0020, AC-8 and AC-9).
 */
export type QuotaRefusalCode = "MEMBERSHIP_REQUIRED" | "LISTING_QUOTA_REACHED";

export interface QuotaRefusal {
  code: QuotaRefusalCode;
  /** The backend's own Vietnamese sentence, shown as it came. */
  message: string;
}

/** The refusal an error is, or `null` for any other failure. */
export function quotaRefusalOf(error: unknown): QuotaRefusal | null {
  if (!isApiError(error)) return null;
  switch (error.code) {
    case "MEMBERSHIP_REQUIRED":
    case "LISTING_QUOTA_REACHED":
      return { code: error.code, message: error.message };
    default:
      return null;
  }
}
