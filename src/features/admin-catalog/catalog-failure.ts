// What went wrong with a write on the catalog, as the page needs to tell it (scope #23). Pure: no
// React, no router.

import { describeError, isApiError, type ApiError } from "@/lib/api/errors";

export type CatalogFailure =
  /** 429: the wait counts down and the buttons stay off until it ends. */
  | { kind: "rate-limited"; error: ApiError }
  /** 409 `CATALOG_IN_USE`: a property names it, so it can only be renamed. */
  | { kind: "in-use" }
  /** 404 `NOT_FOUND`: another admin deleted it first. */
  | { kind: "gone" }
  /** Anything else: the message of the answer, and the support code for a 5xx. */
  | { kind: "message"; message: string; requestId: string | null };

/** Sorts a failed delete into what the dialog does about it. */
export function classifyCatalogError(error: unknown): CatalogFailure {
  if (isApiError(error)) {
    if (error.status === 429) return { kind: "rate-limited", error };
    if (error.code === "CATALOG_IN_USE") return { kind: "in-use" };
    if (error.status === 404 && error.code === "NOT_FOUND") {
      return { kind: "gone" };
    }
  }
  const { message, requestId } = describeError(error);
  return { kind: "message", message, requestId };
}

/**
 * 409 `CATALOG_CODE_TAKEN`: the code of a ward or the key of an amenity exists already, a seeded
 * one too. It has no `errors[]` entry, but it points at exactly one box, which the form puts it
 * on. The box is `code` in one form and `key` in the other, so the form does it, not the shared
 * table of codes and fields.
 */
export const isCodeTaken = (error: unknown): error is ApiError =>
  isApiError(error) && error.code === "CATALOG_CODE_TAKEN";
