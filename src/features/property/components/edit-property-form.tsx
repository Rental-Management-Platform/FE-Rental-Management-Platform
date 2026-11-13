"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLeaveWarning } from "@/features/listing/hooks/use-leave-warning";
import { isAbortError } from "@/lib/api/abort";
import type { Property } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { propertyBlock, type PropertyBlock } from "../api/property-detail";
import {
  refreshAfterPropertySave,
  updateProperty,
} from "../api/update-property";
import { usePropertyForm } from "../hooks/use-property-form";
import {
  toPropertyInput,
  toPropertyPatch,
  type PropertyPatch,
} from "../schemas/property-patch";
import type { PropertyValues } from "../schemas/property-schema";
import { PropertyFields } from "./property-fields";

const SUBMIT_LABEL = "Lưu thay đổi";

interface EditPropertyFormProps {
  /**
   * The property as the first answer sent it. It seeds the form once: when this prop changes
   * later (the cache holds a newer copy), the form keeps what the person typed.
   */
  property: Property;
  /** The property is gone or not mine: the page replaces the form with that state. */
  onBlocked: (block: PropertyBlock) => void;
}

// The edit form: the five zones of the create form (`PropertyFields`), filled with the saved
// property, and the call that saves only what changed (api-for-frontend.md, 6.17; spec 0019,
// AC-13 to AC-16). A save leaves the person on the page with the form holding what was saved.
export function EditPropertyForm({
  property,
  onBlocked,
}: EditPropertyFormProps) {
  const api = useApi();
  const queryClient = useQueryClient();
  const update = useMutation({
    mutationFn: (body: PropertyPatch) => updateProperty(api, property.id, body),
  });

  // The last copy the server sent: what a save is compared with. It starts as the seed and is
  // replaced by each answer, so a second save only sends what changed since the first. It is
  // state, not the `property` prop: a refetch can bring a newer copy that the form never showed,
  // and comparing with it would send the person's untouched fields over someone else's change.
  const [serverCopy, setServerCopy] = useState(property);
  const [initial] = useState(() => toPropertyInput(property));
  // What the pin started from, so a saved pin the person leaves alone is not checked. It is
  // memoized on the copy, so the form's resolver is rebuilt only when a save changes it.
  const saved = useMemo(() => {
    const { wardCode, latitude, longitude } = toPropertyInput(serverCopy);
    return { wardCode, latitude, longitude };
  }, [serverCopy]);

  const state = usePropertyForm({
    defaultValues: initial,
    saved,
    // A property with a pin opens its map zone, so the saved point shows at once (spec 0011).
    startsOpen: property.latitude !== null && property.longitude !== null,
  });
  const {
    form: {
      handleSubmit,
      reset,
      formState: { errors, isSubmitting, isDirty },
    },
    location,
    failure,
    secondsLeft,
    clearFailure,
    handleFailure,
  } = state;

  // A save resets the form to the answer, so it is not dirty any more and the warning is off.
  // Closing the tab while editing asks first (AC-16).
  useLeaveWarning(isDirty);

  const onSubmit = async (values: PropertyValues) => {
    clearFailure();
    // A lookup still running must not write into the address the landlord is sending.
    location.abortLookups();
    const patch = toPropertyPatch(values, serverCopy);
    if (Object.keys(patch).length === 0) {
      toast("Chưa có gì thay đổi");
      return;
    }
    try {
      const saved = await update.mutateAsync(patch);
      setServerCopy(saved);
      refreshAfterPropertySave(queryClient, saved);
      // The form now holds what the server holds, so it is no longer dirty.
      reset(toPropertyInput(saved));
      toast.success("Đã lưu nhà trọ", { description: saved.name });
    } catch (error) {
      // The session changed under the request (a sign out in this tab): there is nothing to show.
      if (isAbortError(error)) return;
      const block = propertyBlock(error);
      if (block) {
        onBlocked(block);
        return;
      }
      // Everything typed stays: the person fixes the field and saves again.
      await handleFailure(error, values, SUBMIT_LABEL);
    }
  };

  return (
    <form
      noValidate
      method="post"
      aria-label="Sửa nhà trọ"
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
            {isSubmitting ? "Đang lưu" : SUBMIT_LABEL}
          </Button>
        </div>
      </div>
    </form>
  );
}
