"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  MoneyPreview,
  moneyPreviewText,
} from "@/features/listing/components/money-preview";
import { isAbortError } from "@/lib/api/abort";
import type { AdminPlan } from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import {
  CANCEL,
  CREATE_SUBMIT,
  CREATING,
  createdToast,
  DAYS_LABEL,
  DAYS_PLACEHOLDER,
  LIMIT_LABEL,
  LIMIT_PLACEHOLDER,
  NAME_LABEL,
  NAME_PLACEHOLDER,
  PRICE_LABEL,
  PRICE_PLACEHOLDER,
  SAVE_SUBMIT,
  SAVING,
  savedToast,
} from "../admin-plans-text";
import { usePlanMutations } from "../hooks/use-plan-mutations";
import {
  emptyPlan,
  fromPlan,
  planSchema,
  toPlanBody,
  toPlanPatch,
  type PlanInput,
  type PlanValues,
} from "../schemas/plan-schema";

// The form's own paths in screen order, so a message the backend sends for a field this form lacks
// is shown as the form level message and never lost.
const FIELDS: readonly Path<PlanInput>[] = [
  "name",
  "price",
  "maxListings",
  "durationDays",
];

/**
 * The form of a plan, shared by "Thêm gói" and "Sửa gói" (scope #22): `plan` is `null` for a new
 * one. A create sends all four fields and no `isActive`, so the plan is on sale; a save sends only
 * the fields that changed, and sends nothing at all when none did. A name that is taken lands on
 * the name box through `useFormFailure`. The price is read back as money under its box, the one
 * live reading a form may show.
 */
export function PlanForm({
  plan,
  onDone,
  onCancel,
}: {
  plan: AdminPlan | null;
  /** The plan was saved, or nothing needed saving: close the dialog. */
  onDone: () => void;
  onCancel: () => void;
}) {
  const { create, update } = usePlanMutations();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<PlanInput, unknown, PlanValues>({
    resolver: zodResolver(planSchema),
    defaultValues: plan === null ? emptyPlan : fromPlan(plan),
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: PlanValues) => {
    clearFailure();
    try {
      if (plan === null) {
        const created = await create.mutateAsync(toPlanBody(values));
        toast.success(createdToast(created.name));
      } else {
        const patch = toPlanPatch(values, plan);
        if (Object.keys(patch).length > 0) {
          const saved = await update.mutateAsync({ id: plan.id, patch });
          toast.success(savedToast(saved.name));
        }
      }
      onDone();
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (!isAbortError(error)) report(error);
    }
  };

  const creating = plan === null;

  return (
    <form
      noValidate
      method="post"
      aria-label={creating ? "Thêm gói" : "Sửa gói"}
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <FormField control={control} name="name" label={NAME_LABEL}>
          {({ field, aria }) => (
            <Input
              size="lg"
              autoComplete="off"
              placeholder={NAME_PLACEHOLDER}
              {...field}
              {...aria}
            />
          )}
        </FormField>
        <FormField control={control} name="price" label={PRICE_LABEL}>
          {({ field, aria }) => {
            const previewId = `${aria.id}-preview`;
            const preview = moneyPreviewText(field.value);
            return (
              <>
                <Input
                  size="lg"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={PRICE_PLACEHOLDER}
                  {...field}
                  {...aria}
                  aria-describedby={
                    [aria["aria-describedby"], preview ? previewId : undefined]
                      .filter(Boolean)
                      .join(" ") || undefined
                  }
                />
                <MoneyPreview id={previewId} typed={field.value} />
              </>
            );
          }}
        </FormField>
        <FormField control={control} name="maxListings" label={LIMIT_LABEL}>
          {({ field, aria }) => (
            <Input
              size="lg"
              inputMode="numeric"
              autoComplete="off"
              placeholder={LIMIT_PLACEHOLDER}
              {...field}
              {...aria}
            />
          )}
        </FormField>
        <FormField control={control} name="durationDays" label={DAYS_LABEL}>
          {({ field, aria }) => (
            <Input
              size="lg"
              inputMode="numeric"
              autoComplete="off"
              placeholder={DAYS_PLACEHOLDER}
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
          disabled={isSubmitting}
        >
          {CANCEL}
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || secondsLeft > 0}
          aria-busy={isSubmitting}
        >
          {isSubmitting && <Spinner size="sm" />}
          {creating
            ? isSubmitting
              ? CREATING
              : CREATE_SUBMIT
            : isSubmitting
              ? SAVING
              : SAVE_SUBMIT}
        </Button>
      </DialogFooter>
    </form>
  );
}
