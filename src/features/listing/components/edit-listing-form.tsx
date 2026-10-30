"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { isAbortError } from "@/lib/api/abort";
import type { OwnerListingDetail } from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { useApi } from "@/lib/session/auth-provider";
import {
  listingBlock,
  updateListing,
  type ListingBlock,
} from "../api/owner-listing";
import {
  fromOwnerListing,
  listingSchema,
  toListingPatch,
  type ListingInput,
  type ListingPatch,
  type ListingValues,
} from "../schemas/listing-schema";
import { ListingForm, LISTING_FIELDS } from "./listing-form";

interface EditListingFormProps {
  /**
   * The listing as the first answer sent it. It seeds the form once: when this prop changes
   * later (the cache holds a newer copy), the form keeps what the person typed.
   */
  listing: OwnerListingDetail;
  /** A save was answered with a new copy: the page keeps it in the cache. */
  onSaved: (listing: OwnerListingDetail) => void;
  /** The listing is gone or not mine: the page replaces the form with that state. */
  onBlocked: (block: ListingBlock) => void;
}

// The edit form: the shared listing form with the property as plain text on top, and the call
// that saves only what changed (api-for-frontend.md, 6.22). The property, the status and the
// code cannot change, so none of them is ever in a body.
export function EditListingForm({
  listing,
  onSaved,
  onBlocked,
}: EditListingFormProps) {
  const api = useApi();
  const update = useMutation({
    mutationFn: (body: ListingPatch) => updateListing(api, listing.id, body),
  });
  const [initial] = useState(() => fromOwnerListing(listing));
  // The last copy the server sent: what a save is compared with. It starts as the seed and is
  // replaced by each answer, so a second save only sends what changed since the first. It is
  // state, not the `listing` prop: a refetch can bring a newer copy that the form never showed,
  // and comparing with it would send the person's untouched fields over someone else's change.
  const [serverCopy, setServerCopy] = useState(listing);
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput, unknown, ListingValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: initial,
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    LISTING_FIELDS,
  );

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: ListingValues) => {
    clearFailure();
    const patch = toListingPatch(values, serverCopy);
    if (Object.keys(patch).length === 0) {
      toast("Chưa có thay đổi nào");
      return;
    }
    try {
      const saved = await update.mutateAsync(patch);
      setServerCopy(saved);
      onSaved(saved);
      // The form now holds what the server holds, so it is no longer dirty.
      reset(fromOwnerListing(saved));
      toast.success("Đã lưu tin", { description: saved.title });
    } catch (error) {
      // The session changed under the request (a sign out in this tab): there is nothing to show.
      if (isAbortError(error)) return;
      const block = listingBlock(error);
      if (block) {
        onBlocked(block);
        return;
      }
      // Everything typed stays: the person fixes the field and saves again.
      report(error);
    }
  };

  return (
    <ListingForm
      label="Sửa tin"
      control={control}
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      property={
        <dl className="flex flex-col gap-1">
          <dt className="text-sm font-medium">Nhà trọ</dt>
          <dd className="text-base">{listing.property.name}</dd>
          <dd className="text-sm text-muted-foreground">
            {listing.property.fullAddress}
          </dd>
        </dl>
      }
      failure={failure}
      message={errors.root?.server?.message}
      secondsLeft={secondsLeft}
      isSubmitting={isSubmitting}
      submitLabel="Lưu thay đổi"
      busyLabel="Đang lưu"
    />
  );
}
