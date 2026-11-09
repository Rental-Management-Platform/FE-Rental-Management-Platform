"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type Path } from "react-hook-form";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { classifyReviewError, type ReviewAction } from "../review-errors";
import { reviewSchema, type ReviewValues } from "../schemas/review-schema";

// The inputs in screen order, so a server message for one of them lands under it.
const FIELDS: readonly Path<ReviewValues>[] = ["stars", "comment"];

/**
 * The state of one review form: the values, what the last failed send said (a message under a
 * field, a form level message, or a 429 with its countdown). It lives in the component that owns
 * the form, so the draft survives what happens around it: for a new review that is the write block,
 * which is above the part that swaps the form for the pinned row or the hint, so a refetch of
 * `mine` never clears what the person typed (spec 0013, AC-7). The draft is never stored anywhere
 * else.
 *
 * `action` says which write this form sends, because a few codes mean something different for
 * each (AC-14). Every failure keeps the draft.
 */
export function useReviewForm(
  defaultValues: DefaultValues<ReviewValues>,
  action: Exclude<ReviewAction, "delete">,
) {
  const form = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues,
  });
  const failure = useFormFailure(form.setError, FIELDS);

  // What `useFormFailure` shows is the message of the error: a field message under its input, the
  // countdown of a 429, or the message of anything else. For a few failures the form says it in its
  // own words (AC-14).
  const report = (error: unknown) => {
    failure.report(error);
    const { message } = classifyReviewError(error, action);
    if (message !== null) {
      form.setError("root.server", { type: "server", message });
    }
  };

  // Drops the last failure: the notice, the countdown and the form level message.
  const clearFailure = () => {
    failure.clear();
    form.clearErrors("root.server");
  };

  return { form, ...failure, report, clearFailure };
}

export type ReviewFormState = ReturnType<typeof useReviewForm>;
