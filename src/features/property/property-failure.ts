import { describeError, isApiError, type ApiError } from "@/lib/api/errors";

// What a failed delete of a property means for its dialog (spec 0019, AC-12). Pure: no React.
// A 401 and `ACCOUNT_LOCKED` are not here: the session layer ends the session (spec 0002).

export type DeletePropertyFailure =
  /** 409 `PROPERTY_HAS_LISTINGS`: two tabs disagree. The backend's sentence is shown, the list is read again. */
  | { kind: "has-listings"; message: string }
  /** 404 `PROPERTY_NOT_FOUND`: it is already gone, which is what the person wanted. */
  | { kind: "gone" }
  | { kind: "rate-limited"; error: ApiError }
  /** Not yours, not allowed, the network, anything else. */
  | { kind: "message"; message: string };

export function classifyDeletePropertyError(
  error: unknown,
): DeletePropertyFailure {
  if (isApiError(error)) {
    if (error.status === 429) return { kind: "rate-limited", error };
    if (error.code === "PROPERTY_HAS_LISTINGS") {
      return { kind: "has-listings", message: error.message };
    }
    if (error.code === "PROPERTY_NOT_FOUND") return { kind: "gone" };
  }
  return { kind: "message", message: describeError(error).message };
}
