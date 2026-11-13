"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { isAbortError } from "@/lib/api/abort";
import type { Property, PropertyBody } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { createProperty } from "../api/create-property";
import { propertiesKey } from "../api/properties-key";
import { usePropertyForm } from "../hooks/use-property-form";
import {
  EMPTY_PROPERTY,
  toPropertyBody,
  type PropertyValues,
} from "../schemas/property-schema";
import { PropertyFields } from "./property-fields";

const SUBMIT_LABEL = "Tạo nhà trọ";

// The create property form: the five zones (`PropertyFields`) with the notice and the submit row
// under them (api-for-frontend.md, 6.17; specs 0017, 0011 and 0019).
export function PropertyForm({
  onCreated,
}: {
  onCreated: (property: Property) => void;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (body: PropertyBody) => createProperty(api, body),
    // The listing form's picker would miss the new property. A plain "out of date" mark is not
    // enough: the picker would still mount from the old list, and `?propertyId=` is read once
    // at mount, so the new property would not be chosen. The old list is dropped instead, and
    // the picker waits for a fresh one. Not returned, so the result does not wait for the read.
    onSuccess: () => {
      void queryClient.resetQueries({ queryKey: propertiesKey });
    },
  });
  const state = usePropertyForm({ defaultValues: EMPTY_PROPERTY });
  const {
    form: {
      handleSubmit,
      formState: { errors, isSubmitting },
    },
    location,
    failure,
    secondsLeft,
    clearFailure,
    handleFailure,
  } = state;

  const onSubmit = async (values: PropertyValues) => {
    clearFailure();
    // A lookup still running must not write into the address the landlord is sending (AC-14).
    location.abortLookups();
    try {
      const property = await create.mutateAsync(toPropertyBody(values));
      toast.success("Đã tạo nhà trọ", { description: property.name });
      onCreated(property);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): there is nothing to show.
      if (isAbortError(error)) return;
      await handleFailure(error, values, SUBMIT_LABEL);
    }
  };

  return (
    <form
      noValidate
      method="post"
      aria-label="Thêm nhà trọ"
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      className="flex flex-col gap-6"
    >
      <PropertyFields state={state} />

      <div className="flex flex-col gap-4">
        <FailureNotice
          failure={failure}
          message={errors.root?.server?.message}
        />
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || secondsLeft > 0}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <Spinner size="sm" />}
            {isSubmitting ? "Đang tạo nhà trọ" : SUBMIT_LABEL}
          </Button>
        </div>
      </div>
    </form>
  );
}
