"use client";

import { useId, useRef, type FormEvent } from "react";
import { Controller, useWatch } from "react-hook-form";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldTitle } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { isAbortError } from "@/lib/api/abort";
import { cn } from "@/lib/utils";
import type { ReviewFormState } from "../hooks/use-review-form";
import {
  COMMENT_MAX,
  commentLength,
  type ReviewValues,
} from "../schemas/review-schema";
import { StarInput } from "./star-input";

type ReviewFormProps = {
  state: ReviewFormState;
  /** `create` is a new review. `edit` is the pinned row opened for editing (spec 0013, AC-9). */
  mode: "create" | "edit";
  /**
   * Sends the values and resolves when the server has them. A rejection keeps the draft and shows
   * what went wrong. What follows a success (clearing, focus, the announcement) is the caller's.
   */
  onSubmit: (values: ReviewValues) => Promise<unknown>;
  /** Only the editor has it: drops the draft and closes. */
  onCancel?: () => void;
};

const LABELS = {
  create: { aria: "Viết đánh giá", send: "Đăng đánh giá", busy: "Đang đăng" },
  edit: { aria: "Sửa đánh giá", send: "Lưu thay đổi", busy: "Đang lưu" },
} as const;

/**
 * The review form, for a new review and for the editor (spec 0013, AC-7). The stars have no value
 * at the start. The comment is a textarea that counts Unicode characters of the trimmed text, with
 * the count always shown and turning `destructive` past 1000. The count is not in a live region,
 * because it changes at every key.
 *
 * While a request is in flight the button is locked with `aria-disabled` and the fields are
 * `readOnly`, never `disabled`, so focus stays where it was. A double click sends once: a create
 * call is not safe to repeat. Past the limit, and while a 429 counts down, the button is off.
 * Every failure keeps the draft.
 */
export function ReviewForm({
  state,
  mode,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const { form, failure, secondsLeft, report, clearFailure } = state;
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;
  const comment = useWatch({ control, name: "comment" });
  const length = commentLength(comment);
  const tooLong = length > COMMENT_MAX;
  const waiting = secondsLeft > 0;
  const starsId = useId();
  const counterId = useId();
  const labels = LABELS[mode];
  // Set in the handler itself, so two clicks that both pass validation cannot both send.
  const inflight = useRef(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async (values) => {
      if (inflight.current) return;
      inflight.current = true;
      clearFailure();
      try {
        await onSubmit(values);
      } catch (error) {
        // The session changed under the request: there is nothing to show.
        if (!isAbortError(error)) report(error);
      } finally {
        inflight.current = false;
      }
    }, clearFailure)(event);
  };

  return (
    <form
      noValidate
      method="post"
      aria-label={labels.aria}
      onSubmit={submit}
      className="flex flex-col gap-4"
    >
      <FailureNotice failure={failure} message={errors.root?.server?.message} />

      <Controller
        control={control}
        name="stars"
        render={({ field, fieldState }) => {
          const error = fieldState.error?.message;
          const errorId = `${starsId}-error`;
          return (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldTitle id={starsId}>Số sao</FieldTitle>
              <StarInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                labelId={starsId}
                describedBy={error ? errorId : undefined}
                invalid={fieldState.invalid}
                readOnly={isSubmitting}
              />
              {error && <FieldError id={errorId}>{error}</FieldError>}
            </Field>
          );
        }}
      />

      <div className="flex flex-col gap-1">
        <FormField
          control={control}
          name="comment"
          label="Nhận xét (không bắt buộc)"
        >
          {({ field, aria }) => (
            <Textarea
              readOnly={isSubmitting}
              {...field}
              {...aria}
              aria-invalid={aria["aria-invalid"] ?? (tooLong || undefined)}
              aria-describedby={
                [aria["aria-describedby"], counterId]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
            />
          )}
        </FormField>
        {/* Past the limit the button is off, so the form is never sent and a message that waits
            for a submit would never show. The sentence is drawn here, beside the count. */}
        <p
          id={counterId}
          className={cn(
            "flex justify-between gap-3 text-xs",
            tooLong ? "text-destructive" : "text-muted-foreground",
          )}
        >
          <span>{tooLong && `Nhận xét dài tối đa ${COMMENT_MAX} ký tự.`}</span>
          <span>
            {length}/{COMMENT_MAX}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          size="lg"
          disabled={tooLong || waiting}
          aria-disabled={isSubmitting || undefined}
          aria-busy={isSubmitting}
        >
          {isSubmitting && <Spinner size="sm" />}
          {isSubmitting ? labels.busy : labels.send}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            aria-disabled={isSubmitting || undefined}
            onClick={() => {
              if (!isSubmitting) onCancel();
            }}
          >
            Hủy
          </Button>
        )}
      </div>
    </form>
  );
}
