"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Path } from "react-hook-form";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import {
  EMPTY_MESSAGE,
  messageSchema,
  type MessageValues,
} from "../schemas/message-schema";

const FIELDS: readonly Path<MessageValues>[] = ["body"];

/**
 * The state of one message box: the form, and what the last failed send said (a message under
 * the box, or a 429 with its countdown). It lives in the component that owns the box, and for the
 * first message dialog that is the component around `Dialog`, so the draft survives closing the
 * dialog, which unmounts its content (spec 0012, AC-4). The draft is never stored anywhere else.
 */
export function useComposer() {
  const form = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: EMPTY_MESSAGE,
  });
  const failure = useFormFailure(form.setError, FIELDS);
  return { form, ...failure };
}

export type Composer = ReturnType<typeof useComposer>;
