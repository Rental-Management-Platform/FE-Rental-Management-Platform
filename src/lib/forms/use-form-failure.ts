"use client";

import { useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { describeError, fieldErrors } from "@/lib/api/errors";
import { applyFieldErrors } from "@/lib/forms/apply-field-errors";
import { useCountdown } from "@/lib/use-countdown";

/**
 * What a form does with the error its submit threw: field messages go under their inputs
 * (and focus moves to the first of them), anything else becomes the form level message, and
 * a 429 starts the countdown. `fields` lists the form's own paths, so a message for a missing
 * input is not lost. Show the result with `FailureNotice`; the owner of the form disables its
 * submit button while `secondsLeft` is above 0.
 */
export function useFormFailure<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  const [failure, setFailure] = useState<unknown>(null);
  const secondsLeft = useCountdown(failure);

  const report = (error: unknown) => {
    setFailure(error);
    if (Object.keys(fieldErrors(error)).length > 0) {
      applyFieldErrors(setError, error, fields);
    } else {
      setError("root.server", {
        type: "server",
        message: describeError(error).message,
      });
    }
  };

  const clear = () => setFailure(null);

  return { failure, secondsLeft, report, clear };
}
