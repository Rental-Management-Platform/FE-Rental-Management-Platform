"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isAbortError } from "@/lib/api/abort";
import type { CatalogWard } from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import {
  CREATE_SUBMIT,
  CREATING,
  PROVINCE_CODE_LABEL,
  PROVINCE_CODE_PLACEHOLDER,
  PROVINCE_NAME_LABEL,
  PROVINCE_NAME_PLACEHOLDER,
  SAVE_SUBMIT,
  SAVING,
  WARD_CODE_LABEL,
  WARD_CODE_PLACEHOLDER,
  WARD_NAME_LABEL,
  WARD_NAME_PLACEHOLDER,
  wardCreatedToast,
  wardSavedToast,
} from "../admin-catalog-text";
import { isCodeTaken } from "../catalog-failure";
import { useCatalogMutations } from "../hooks/use-catalog-mutations";
import {
  emptyWard,
  fromWard,
  toWardBody,
  toWardPatch,
  wardCreateSchema,
  wardEditSchema,
  type WardCreateValues,
  type WardEditValues,
} from "../schemas/catalog-schema";
import { FormButtons } from "./form-buttons";

// The forms' own paths in screen order, so a message the backend sends for a box a form lacks is
// shown as the form level message and never lost.
const CREATE_FIELDS: readonly Path<WardCreateValues>[] = [
  "code",
  "name",
  "provinceCode",
  "provinceName",
];
const EDIT_FIELDS: readonly Path<WardEditValues>[] = ["name", "provinceName"];

/**
 * "Thêm phường, xã" (scope #23): the code and the province code are typed once and are the keys of
 * the row, so they are boxes here and never in the edit form. There is no box for the map box
 * (`bounds`): the API takes none, and a ward added here has none. A code that exists, a seeded one
 * too, lands on the code box (`CATALOG_CODE_TAKEN`); every other message lands on its own box
 * through `useFormFailure`.
 */
export function WardCreateForm({
  province,
  onDone,
  onCancel,
}: {
  /** The province the first ward of the list has, offered as the starting values. */
  province: Pick<CatalogWard, "provinceCode" | "provinceName"> | undefined;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { addWard } = useCatalogMutations();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<WardCreateValues>({
    resolver: zodResolver(wardCreateSchema),
    defaultValues: emptyWard(province),
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    CREATE_FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: WardCreateValues) => {
    clearFailure();
    try {
      const created = await addWard.mutateAsync(toWardBody(values));
      toast.success(wardCreatedToast(created.name));
      onDone();
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (isAbortError(error)) return;
      if (isCodeTaken(error)) {
        setError(
          "code",
          { type: "server", message: error.message },
          { shouldFocus: true },
        );
      } else {
        report(error);
      }
    }
  };

  return (
    <form
      noValidate
      method="post"
      aria-label="Thêm phường, xã"
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <FormField control={control} name="code" label={WARD_CODE_LABEL}>
          {({ field, aria }) => (
            <Input
              size="lg"
              inputMode="numeric"
              autoComplete="off"
              placeholder={WARD_CODE_PLACEHOLDER}
              {...field}
              {...aria}
            />
          )}
        </FormField>
        <FormField control={control} name="name" label={WARD_NAME_LABEL}>
          {({ field, aria }) => (
            <Input
              size="lg"
              autoComplete="off"
              placeholder={WARD_NAME_PLACEHOLDER}
              {...field}
              {...aria}
            />
          )}
        </FormField>
        <FormField
          control={control}
          name="provinceCode"
          label={PROVINCE_CODE_LABEL}
        >
          {({ field, aria }) => (
            <Input
              size="lg"
              inputMode="numeric"
              autoComplete="off"
              placeholder={PROVINCE_CODE_PLACEHOLDER}
              {...field}
              {...aria}
            />
          )}
        </FormField>
        <FormField
          control={control}
          name="provinceName"
          label={PROVINCE_NAME_LABEL}
        >
          {({ field, aria }) => (
            <Input
              size="lg"
              autoComplete="off"
              placeholder={PROVINCE_NAME_PLACEHOLDER}
              {...field}
              {...aria}
            />
          )}
        </FormField>
      </FieldGroup>
      <FailureNotice failure={failure} message={errors.root?.server?.message} />
      <FormButtons
        submitting={isSubmitting}
        waiting={secondsLeft > 0}
        label={CREATE_SUBMIT}
        busyLabel={CREATING}
        onCancel={onCancel}
      />
    </form>
  );
}

/**
 * Renaming a ward (scope #23): only the two names. The keys are in the text of the dialog, never
 * boxes. A save sends only what changed and sends nothing when nothing did. A new name changes the
 * address of every property and listing of the ward, and the backend rebuilds their search.
 */
export function WardEditForm({
  ward,
  onDone,
  onCancel,
}: {
  ward: CatalogWard;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { renameWard } = useCatalogMutations();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<WardEditValues>({
    resolver: zodResolver(wardEditSchema),
    defaultValues: fromWard(ward),
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    EDIT_FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: WardEditValues) => {
    clearFailure();
    try {
      const patch = toWardPatch(values, ward);
      if (Object.keys(patch).length > 0) {
        const saved = await renameWard.mutateAsync({ code: ward.code, patch });
        toast.success(wardSavedToast(saved.name));
      }
      onDone();
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (!isAbortError(error)) report(error);
    }
  };

  return (
    <form
      noValidate
      method="post"
      aria-label="Sửa phường, xã"
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <FormField control={control} name="name" label={WARD_NAME_LABEL}>
          {({ field, aria }) => (
            <Input
              size="lg"
              autoComplete="off"
              placeholder={WARD_NAME_PLACEHOLDER}
              {...field}
              {...aria}
            />
          )}
        </FormField>
        <FormField
          control={control}
          name="provinceName"
          label={PROVINCE_NAME_LABEL}
        >
          {({ field, aria }) => (
            <Input
              size="lg"
              autoComplete="off"
              placeholder={PROVINCE_NAME_PLACEHOLDER}
              {...field}
              {...aria}
            />
          )}
        </FormField>
      </FieldGroup>
      <FailureNotice failure={failure} message={errors.root?.server?.message} />
      <FormButtons
        submitting={isSubmitting}
        waiting={secondsLeft > 0}
        label={SAVE_SUBMIT}
        busyLabel={SAVING}
        onCancel={onCancel}
      />
    </form>
  );
}
