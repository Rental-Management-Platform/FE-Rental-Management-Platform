"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isAbortError } from "@/lib/api/abort";
import type { Amenity } from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import {
  AMENITY_KEY_LABEL,
  AMENITY_KEY_PLACEHOLDER,
  AMENITY_NAME_LABEL,
  AMENITY_NAME_PLACEHOLDER,
  amenityCreatedToast,
  amenitySavedToast,
  CREATE_SUBMIT,
  CREATING,
  SAVE_SUBMIT,
  SAVING,
} from "../admin-catalog-text";
import { isCodeTaken } from "../catalog-failure";
import { useCatalogMutations } from "../hooks/use-catalog-mutations";
import {
  amenityCreateSchema,
  amenityEditSchema,
  emptyAmenity,
  fromAmenity,
  toAmenityBody,
  toAmenityPatch,
  type AmenityCreateValues,
  type AmenityEditValues,
} from "../schemas/catalog-schema";
import { FormButtons } from "./form-buttons";

const CREATE_FIELDS: readonly Path<AmenityCreateValues>[] = ["key", "name"];
const EDIT_FIELDS: readonly Path<AmenityEditValues>[] = ["name"];

/**
 * "Thêm tiện ích" (scope #23): the key is typed once and is the stable key the landlord forms send
 * as `amenityKeys`, so it is a box here and never in the rename form. A key that exists, a seeded
 * one too, lands on the key box (`CATALOG_CODE_TAKEN`).
 */
export function AmenityCreateForm({
  onDone,
  onCancel,
}: {
  onDone: () => void;
  onCancel: () => void;
}) {
  const { addAmenity } = useCatalogMutations();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AmenityCreateValues>({
    resolver: zodResolver(amenityCreateSchema),
    defaultValues: emptyAmenity,
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    CREATE_FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: AmenityCreateValues) => {
    clearFailure();
    try {
      const created = await addAmenity.mutateAsync(toAmenityBody(values));
      toast.success(amenityCreatedToast(created.name));
      onDone();
    } catch (error) {
      // The session changed under the request (a sign out in this tab): nothing to show.
      if (isAbortError(error)) return;
      if (isCodeTaken(error)) {
        setError(
          "key",
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
      aria-label="Thêm tiện ích"
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <FormField control={control} name="key" label={AMENITY_KEY_LABEL}>
          {({ field, aria }) => (
            <Input
              size="lg"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={AMENITY_KEY_PLACEHOLDER}
              {...field}
              {...aria}
            />
          )}
        </FormField>
        <FormField control={control} name="name" label={AMENITY_NAME_LABEL}>
          {({ field, aria }) => (
            <Input
              size="lg"
              autoComplete="off"
              placeholder={AMENITY_NAME_PLACEHOLDER}
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
 * Renaming an amenity (scope #23): only the name, because the key cannot change. A save sends the
 * name when it changed and sends nothing when it did not.
 */
export function AmenityEditForm({
  amenity,
  onDone,
  onCancel,
}: {
  amenity: Amenity;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { renameAmenity } = useCatalogMutations();
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<AmenityEditValues>({
    resolver: zodResolver(amenityEditSchema),
    defaultValues: fromAmenity(amenity),
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    EDIT_FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: AmenityEditValues) => {
    clearFailure();
    try {
      const patch = toAmenityPatch(values, amenity);
      if (patch !== null) {
        const saved = await renameAmenity.mutateAsync({
          key: amenity.key,
          patch,
        });
        toast.success(amenitySavedToast(saved.name));
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
      aria-label="Sửa tiện ích"
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <FormField control={control} name="name" label={AMENITY_NAME_LABEL}>
          {({ field, aria }) => (
            <Input
              size="lg"
              autoComplete="off"
              placeholder={AMENITY_NAME_PLACEHOLDER}
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
