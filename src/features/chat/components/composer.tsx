"use client";

import {
  useEffect,
  useId,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useWatch } from "react-hook-form";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { isAbortError } from "@/lib/api/abort";
import { cn } from "@/lib/utils";
import type { Composer as ComposerState } from "../hooks/use-composer";
import {
  EMPTY_MESSAGE,
  MESSAGE_MAX,
  messageLength,
} from "../schemas/message-schema";

interface ComposerProps {
  composer: ComposerState;
  /**
   * Does the send and resolves when the server has the message. A rejection keeps the draft and
   * shows what went wrong under the box. A success clears the draft.
   */
  onSend: (body: string) => Promise<unknown>;
  placeholder?: string;
  /**
   * Puts the cursor in the box when it appears, but only on a device with a mouse
   * (`(pointer: fine)`). On a touch screen it stays off, so the keyboard does not cover the
   * conversation the moment it opens (spec 0012, AC-8).
   */
  focusWhenMouse?: boolean;
}

/**
 * The message box, shared by the first message dialog and the conversation page (spec 0012,
 * AC-14).
 *
 * * Enter: with a mouse, Enter sends and Shift+Enter is a new line. On a touch screen Enter is
 *   always a new line, and the "Gửi" button sends. Enter never sends while an input method is
 *   still composing a word (Telex, VNI), because then it only confirms the word.
 * * Length: counted in Unicode characters of the trimmed text, from 1 to 1000, with the count
 *   always shown and turning red past the limit. The count is not in a live region: it changes at
 *   every key.
 * * The box grows with its text up to about five lines, then scrolls inside itself.
 * * While a send is in flight the button is locked with `aria-disabled` and the box is `readOnly`,
 *   never `disabled`, so focus stays where it was. A double click sends one message: a create
 *   call is not safe to repeat.
 */
export function Composer({
  composer,
  onSend,
  placeholder,
  focusWhenMouse = false,
}: ComposerProps) {
  const { form, failure, secondsLeft, report, clear } = composer;
  const {
    control,
    handleSubmit,
    clearErrors,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = form;
  const draft = useWatch({ control, name: "body" });
  const length = messageLength(draft);
  const tooLong = length > MESSAGE_MAX;
  const sendable = length >= 1 && !tooLong && secondsLeft === 0;
  const counterId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  // Set in the handler itself, so two clicks that both pass validation cannot both send.
  const inflight = useRef(false);

  useEffect(() => {
    if (focusWhenMouse && window.matchMedia("(pointer: fine)").matches) {
      setFocus("body");
    }
  }, [focusWhenMouse, setFocus]);

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  // The form's own handler, so the ref is read in an event and never while rendering.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(async ({ body }) => {
      if (inflight.current) return;
      inflight.current = true;
      clearFailure();
      try {
        await onSend(body);
        reset(EMPTY_MESSAGE);
      } catch (error) {
        // The session changed under the request: there is nothing to show.
        if (!isAbortError(error)) report(error);
      } finally {
        inflight.current = false;
      }
    }, clearFailure)(event);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    // An input method that is composing a word reports it, and old browsers report keyCode 229.
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    // A touch screen has no Shift key for a new line, so there Enter is the new line.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    event.preventDefault();
    if (sendable && !isSubmitting) formRef.current?.requestSubmit();
  };

  return (
    <form
      ref={formRef}
      noValidate
      method="post"
      aria-label="Soạn tin nhắn"
      onSubmit={onSubmit}
      className="flex flex-col gap-3"
    >
      <FailureNotice failure={failure} message={errors.root?.server?.message} />
      <div className="flex flex-col gap-1">
        <FormField
          control={control}
          name="body"
          label="Nội dung tin nhắn"
          hideLabel
        >
          {({ field, aria }) => (
            // The box and the button share a row and sit on the same bottom edge, whatever the
            // height of the box. An error or the count then falls under both.
            <div className="flex items-end gap-2">
              <Textarea
                placeholder={placeholder}
                readOnly={isSubmitting}
                onKeyDown={onKeyDown}
                className="max-h-34 min-h-11 min-w-0 flex-1 overflow-y-auto"
                {...field}
                {...aria}
                aria-invalid={aria["aria-invalid"] ?? (tooLong || undefined)}
                aria-describedby={
                  [aria["aria-describedby"], counterId]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
              />
              <Button
                type="submit"
                size="lg"
                className="shrink-0"
                disabled={!sendable}
                aria-disabled={isSubmitting || undefined}
                aria-busy={isSubmitting}
              >
                {isSubmitting && <Spinner size="sm" />}
                {isSubmitting ? "Đang gửi" : "Gửi"}
              </Button>
            </div>
          )}
        </FormField>
        {/* Past the limit the form is not submitted (the button is off), so a message that waits
            for a submit would never show. The line is drawn here, beside the count, and both are
            read with the box. */}
        <p
          id={counterId}
          className={cn(
            "flex justify-between gap-3 text-xs",
            tooLong ? "text-destructive" : "text-muted-foreground",
          )}
        >
          <span>{tooLong && `Tin nhắn dài tối đa ${MESSAGE_MAX} ký tự.`}</span>
          <span>
            {length}/{MESSAGE_MAX}
          </span>
        </p>
      </div>
    </form>
  );
}
