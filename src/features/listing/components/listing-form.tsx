"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm, useWatch, type Path } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
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

// The form's own paths in screen order. A message the backend sends for a field this form
// lacks is shown as the form level message, and focus goes to the first field in this order.
const FIELDS: readonly Path<ListingInput>[] = [
  "propertyId",
  "title",
  "description",
  "price",
  "areaM2",
];

const PROPERTY_HINT = "Địa chỉ, phí và tiện ích lấy từ nhà trọ bạn chọn.";

// The backend says the property is gone, or is not the landlord's: both are fixed by reading
// the list again, so the choice can be dropped when it is no longer there.
const PROPERTY_ERRORS: readonly string[] = [
  "PROPERTY_NOT_FOUND",
  "NOT_RESOURCE_OWNER",
];

interface ListingFormProps {
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

// The post listing form: two zones on the canvas with the notice and the submit row under them
// (api-for-frontend.md, 6.18). Deposit and the move in date join with the next step.
export function ListingForm({
  properties,
  initialPropertyId,
  focusTitleOnMount,
  onRefreshProperties,
  onPosted,
}: ListingFormProps) {
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
    <form
      noValidate
      method="post"
      aria-label="Đăng tin mới"
      onSubmit={handleSubmit(onSubmit, clearFailure)}
      className="flex flex-col gap-6"
    >
      {/* Each zone is a labelled group, like the fieldset it replaces. The hairline under the
          title row is there because a form follows it. */}
      <Card role="group" aria-labelledby="listing-main-title">
        <CardHeader className="border-b">
          <CardTitle id="listing-main-title">Thông tin chính</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
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
            <FormField
              control={control}
              name="title"
              label="Tiêu đề"
              description="Từ 5 đến 120 ký tự."
            >
              {({ field, aria }) => (
                <Input
                  size="lg"
                  autoComplete="off"
                  placeholder="Phòng đẹp có gác gần chợ Bến Thành"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
            <FormField
              control={control}
              name="description"
              label="Mô tả"
              description="Từ 10 đến 5.000 ký tự, văn bản thường."
            >
              {({ field, aria }) => (
                <Textarea
                  rows={6}
                  placeholder="Giờ giấc, chỗ để xe, nội thất, quy định chung"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card role="group" aria-labelledby="listing-price-title">
        <CardHeader className="border-b">
          <CardTitle id="listing-price-title">Giá và diện tích</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="md:grid md:grid-cols-2">
            <FormField
              control={control}
              name="price"
              label="Giá thuê (đồng mỗi tháng)"
              description="Từ 100.000 đến 100.000.000."
            >
              {({ field, aria }) => (
                <Input
                  size="lg"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="3500000"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
            <FormField
              control={control}
              name="areaM2"
              label="Diện tích (m²)"
              description="Tối đa một chữ số sau dấu phẩy."
            >
              {({ field, aria }) => (
                <Input
                  size="lg"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="22,5"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
          </FieldGroup>
        </CardContent>
      </Card>

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
            {isSubmitting ? "Đang đăng tin" : "Đăng tin"}
          </Button>
        </div>
      </div>
    </form>
  );
}
