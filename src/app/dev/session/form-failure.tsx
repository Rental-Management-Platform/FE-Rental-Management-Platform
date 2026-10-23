"use client";

import { useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { describeError, fieldErrors, isApiError } from "@/lib/api/errors";
import { applyFieldErrors } from "@/lib/forms/apply-field-errors";
import { formatWait } from "@/lib/format";
import { useCountdown } from "@/lib/use-countdown";

/**
 * What a lab form does with the error its submit threw: field messages go under their
 * inputs, anything else becomes the form level message, and a 429 starts the countdown.
 * `fields` lists the form's own paths, so a message for a missing input is not lost.
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

interface FailureNoticeProps {
  /** The error thrown, or null. */
  failure: unknown;
  /** From `useCountdown(failure)`. */
  secondsLeft: number;
  /** The form level message, if there is one. */
  message: string | undefined;
}

// The form level message, the wait after a 429, and the support code after a 5xx.
export function FailureNotice({
  failure,
  secondsLeft,
  message,
}: FailureNoticeProps) {
  const { requestId } = describeError(failure);
  // "khoảng" only when the seconds came from the table, not from `Retry-After`.
  const approximate = isApiError(failure) && !failure.retryAfterExact;

  if (!message && secondsLeft === 0 && !requestId) return null;

  return (
    <div className="flex flex-col gap-1 text-sm">
      {message && (
        <p role="alert" className="text-destructive">
          {message}
        </p>
      )}
      {secondsLeft > 0 && (
        <output aria-live="polite">
          Hãy thử lại sau {formatWait(secondsLeft, { approximate })}.
        </output>
      )}
      {requestId && <p>Mã hỗ trợ: {requestId}</p>}
    </div>
  );
}
