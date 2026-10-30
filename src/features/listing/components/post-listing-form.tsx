"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm, useWatch, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/form/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isAbortError } from "@/lib/api/abort";
import { isApiError } from "@/lib/api/errors";
import type {
  ListingBody,
  OwnerListingDetail,
  PropertyListItem,
  Uuid,
} from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { useApi } from "@/lib/session/auth-provider";
import { createListing } from "../api/create-listing";
import {
  emptyListing,
  listingSchema,
  toListingBody,
  type ListingInput,
  type ListingValues,
} from "../schemas/listing-schema";
import { ListingForm, LISTING_FIELDS } from "./listing-form";

// The form's own paths in screen order. A message the backend sends for a field this form
// lacks is shown as the form level message, and focus goes to the first field in this order.
const FIELDS: readonly Path<ListingInput>[] = ["propertyId", ...LISTING_FIELDS];

const PROPERTY_HINT = "Địa chỉ, phí và tiện ích lấy từ nhà trọ bạn chọn.";

// The backend says the property is gone, or is not the landlord's: both are fixed by reading
// the list again, so the choice can be dropped when it is no longer there.
const PROPERTY_ERRORS: readonly string[] = [
  "PROPERTY_NOT_FOUND",
  "NOT_RESOURCE_OWNER",
];

interface PostListingFormProps {
  /** The properties to choose from. At least one: the empty list is a state of the page. */
  properties: readonly PropertyListItem[];
  /**
   * The property chosen when the form starts, or "". It goes into the starting values and is
   * never set after mount, so the form is not dirty before the person types.
   */
  initialPropertyId: Uuid;
  /** Focus goes to the title when the form starts, for "Đăng tin khác". */
  focusTitleOnMount: boolean;
  /** Reads the list again and answers with the fresh items (a failed read answers nothing). */
  onRefreshProperties: () => Promise<readonly PropertyListItem[] | undefined>;
  onPosted: (listing: OwnerListingDetail) => void;
}

// The post form: the shared listing form with a property select on top, and the call that
// creates the listing (api-for-frontend.md, 6.18).
export function PostListingForm({
  properties,
  initialPropertyId,
  focusTitleOnMount,
  onRefreshProperties,
  onPosted,
}: PostListingFormProps) {
  const api = useApi();
  const create = useMutation({
    mutationFn: ({
      propertyId,
      body,
    }: {
      propertyId: Uuid;
      body: ListingBody;
    }) => createListing(api, propertyId, body),
  });
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ListingInput, unknown, ListingValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: emptyListing(initialPropertyId),
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    FIELDS,
  );
  const propertyId = useWatch({ control, name: "propertyId" });
  const chosen = properties.find((property) => property.id === propertyId);

  useEffect(() => {
    if (focusTitleOnMount) setFocus("title");
  }, [focusTitleOnMount, setFocus]);

  // A later read may no longer list the chosen property (it was deleted in another tab): the
  // choice goes, so the person picks from the list as it is now.
  useEffect(() => {
    if (propertyId !== "" && !chosen) setValue("propertyId", "");
  }, [propertyId, chosen, setValue]);

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: ListingValues) => {
    clearFailure();
    try {
      const listing = await create.mutateAsync({
        propertyId: values.propertyId,
        body: toListingBody(values),
      });
      toast.success("Đã đăng tin", { description: listing.title });
      onPosted(listing);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): there is nothing to show.
      if (isAbortError(error)) return;
      // Everything typed stays, also for the two quota errors: they are messages, never retried.
      report(error);
      if (isApiError(error) && PROPERTY_ERRORS.includes(error.code)) {
        void onRefreshProperties().then((fresh) => {
          if (
            fresh &&
            !fresh.some((property) => property.id === values.propertyId)
          ) {
            setValue("propertyId", "");
          }
        });
      }
    }
  };

  return (
    <ListingForm
      label="Đăng tin mới"
      control={control}
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      property={
        <FormField
          control={control}
          name="propertyId"
          label="Nhà trọ"
          description={chosen?.fullAddress ?? PROPERTY_HINT}
        >
          {({ field, aria }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                ref={field.ref}
                size="lg"
                className="w-full"
                onBlur={field.onBlur}
                {...aria}
              >
                <SelectValue placeholder="Chọn nhà trọ" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </FormField>
      }
      failure={failure}
      message={errors.root?.server?.message}
      secondsLeft={secondsLeft}
      isSubmitting={isSubmitting}
      submitLabel="Đăng tin"
      busyLabel="Đang đăng tin"
    />
  );
}
