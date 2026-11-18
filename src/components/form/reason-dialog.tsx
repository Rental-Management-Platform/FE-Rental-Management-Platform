"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { REASON_MAX, reasonSchema } from "@/components/form/reason-schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { isAbortError } from "@/lib/api/abort";
import { useFormFailure } from "@/lib/forms/use-form-failure";

export interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** One sentence of consequence. It goes in the header, never under the field. */
  description: string;
  confirmLabel: string;
  tone?: "default" | "destructive";
  /** An example of a reason, such as "Ví dụ: Đăng tin giả mạo". */
  placeholder: string;
  /**
   * Sends the reason (trimmed, 1 to 500 characters). Resolving means the owner closes the dialog.
   * A thrown error stays inside: the field message, the form message or the 429 countdown, with
   * the typed text kept and the button ready to send again. To close on an answer such as "the
   * account is gone", the owner catches that error itself, shows its toast and resolves.
   */
  onSubmit: (reason: string) => Promise<void>;
  /** From `useReturnFocus`: the dialog has no trigger of its own, it opens from a row or a button. */
  onCloseAutoFocus: (event: Event) => void;
}

const FIELDS = ["reason"] as const;

/**
 * The one dialog that asks for a required written reason (lock and unlock an account, hide and
 * unhide a listing or a review). The owner holds `open`, and the form lives inside `DialogContent`
 * so every opening starts empty. The only text near the field is a live count of the typed
 * characters. While a request runs the dialog cannot be closed (not by Escape, not by a click
 * outside, not by "Hủy"), and a second press sends nothing.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = "default",
  placeholder,
  onSubmit,
  onCloseAutoFocus,
}: ReasonDialogProps) {
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Escape and a click outside must not close it while a request runs.
        if (pending && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ReasonForm
          title={title}
          confirmLabel={confirmLabel}
          tone={tone}
          placeholder={placeholder}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          onPendingChange={setPending}
        />
      </DialogContent>
    </Dialog>
  );
}

function ReasonForm({
  title,
  confirmLabel,
  tone,
  placeholder,
  onSubmit,
  onCancel,
  onPendingChange,
}: {
  title: string;
  confirmLabel: string;
  tone: "default" | "destructive";
  placeholder: string;
  onSubmit: (reason: string) => Promise<void>;
  onCancel: () => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );
  const [pending, setPending] = useState(false);
  // State lags a render behind a fast second press, so a ref says "a request is running" at once.
  const inFlight = useRef(false);
  const typed = useWatch({ control, name: "reason" });

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const send = async ({ reason }: { reason: string }) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    onPendingChange(true);
    clearFailure();
    try {
      await onSubmit(reason);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (!isAbortError(error)) report(error);
    } finally {
      inFlight.current = false;
      setPending(false);
      onPendingChange(false);
    }
  };

  return (
    <form
      noValidate
      method="post"
      aria-label={title}
      onSubmit={(event) => void handleSubmit(send, clearFailure)(event)}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <FormField
          control={control}
          name="reason"
          label="Lý do"
          description={`${typed.trim().length}/${REASON_MAX}`}
        >
          {({ field, aria }) => (
            <Textarea
              rows={4}
              autoComplete="off"
              placeholder={placeholder}
              {...field}
              {...aria}
            />
          )}
        </FormField>
      </FieldGroup>
      <FailureNotice failure={failure} message={errors.root?.server?.message} />
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onCancel}
          disabled={pending}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          size="lg"
          variant={tone === "destructive" ? "destructive" : "default"}
          disabled={pending || secondsLeft > 0}
          aria-busy={pending}
        >
          {pending && <Spinner size="sm" />}
          {pending ? "Đang gửi" : confirmLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
