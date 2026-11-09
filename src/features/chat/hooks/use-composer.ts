"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import {
  classifySendError,
  type ComposerLock,
  type SendKind,
} from "../send-errors";
import {
  EMPTY_MESSAGE,
  messageSchema,
  type MessageValues,
} from "../schemas/message-schema";

const FIELDS: readonly Path<MessageValues>[] = ["body"];

/**
 * The state of one message box: the form, what the last failed send said (a message under the box,
 * or a 429 with its countdown), and whether the box is locked. It lives in the component that owns
 * the box, and for the first message dialog that is the component around `Dialog`, so the draft
 * survives closing the dialog, which unmounts its content (spec 0012, AC-4). The draft is never
 * stored anywhere else.
 *
 * Every failure keeps the draft. `kind` says which send this is, because a hidden listing only
 * means something for the first message.
 */
export function useComposer(kind: SendKind) {
  const form = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: EMPTY_MESSAGE,
  });
  const failure = useFormFailure(form.setError, FIELDS);
  const [lock, setLock] = useState<ComposerLock | null>(null);

  // What `useFormFailure` shows is the message of the error. For a few failures the box says it in
  // its own words, and some of them lock it (AC-5, AC-16).
  const report = (error: unknown) => {
    failure.report(error);
    const { message, lock: next } = classifySendError(error, kind);
    if (message !== null) {
      form.setError("root.server", { type: "server", message });
    }
    if (next !== null) setLock(next);
  };

  // "Thử gửi lại": the other person may have been unlocked meanwhile, so the box opens again with
  // the draft in it, and the person sends it when ready.
  const unlock = () => {
    setLock(null);
    failure.clear();
    form.clearErrors("root.server");
  };

  return { form, ...failure, report, lock, unlock };
}

export type Composer = ReturnType<typeof useComposer>;
