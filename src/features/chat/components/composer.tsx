"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { useWatch } from "react-hook-form";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { isAbortError } from "@/lib/api/abort";
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
 * AC-14). While a send is in flight the button is locked with `aria-disabled` and the box is
 * `readOnly`, never `disabled`, so focus stays where it was. A double click sends one message:
 * a create call is not safe to repeat.
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

  return (
    <form
      noValidate
      method="post"
      aria-label="Soạn tin nhắn"
      onSubmit={onSubmit}
      className="flex flex-col gap-3"
    >
      <FormField
        control={control}
        name="body"
        label="Nội dung tin nhắn"
        hideLabel
      >
        {({ field, aria }) => (
          <Textarea
            placeholder={placeholder}
            readOnly={isSubmitting}
            {...field}
            {...aria}
          />
        )}
      </FormField>
      <FailureNotice failure={failure} message={errors.root?.server?.message} />
      <Button
        type="submit"
        size="lg"
        className="self-end"
        disabled={length === 0 || length > MESSAGE_MAX || secondsLeft > 0}
        aria-disabled={isSubmitting || undefined}
        aria-busy={isSubmitting}
      >
        {isSubmitting && <Spinner size="sm" />}
        {isSubmitting ? "Đang gửi" : "Gửi"}
      </Button>
    </form>
  );
}
