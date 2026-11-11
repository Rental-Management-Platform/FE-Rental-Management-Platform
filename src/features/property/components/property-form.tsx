"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FailureNotice } from "@/components/form/failure-notice";
import { FormField } from "@/components/form/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { amenityCatalogOf } from "@/features/amenities/amenity-catalog";
import { removedAmenityKeys } from "@/features/amenities/amenity-keys";
import { useAmenities } from "@/features/amenities/hooks/use-amenities";
import { isAbortError } from "@/lib/api/abort";
import { isApiError } from "@/lib/api/errors";
import type { Property, PropertyBody } from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { useApi } from "@/lib/session/auth-provider";
import { WardPicker } from "@/features/wards/components/ward-picker";
import { useWards } from "@/features/wards/hooks/use-wards";
import { createProperty } from "../api/create-property";
import { propertiesKey } from "../api/properties-key";
import {
  AMENITY_REMOVED_MESSAGE,
  PROPERTY_FORM_FIELDS,
  zoneFocusTarget,
} from "../form-failure";
import { AmenityField } from "./amenity-field";
import { FeeRowsField } from "./fee-rows-field";
import {
  EMPTY_PROPERTY,
  propertySchema,
  toPropertyBody,
  type PropertyInput,
  type PropertyValues,
} from "../schemas/property-schema";

// The create property form: four zones on the canvas (general, address, fees, amenities) with
// the notice and the submit row under them (api-for-frontend.md, 6.17; spec 0017). Coordinates
// join with #33, between the address zone and the fees zone.
export function PropertyForm({
  onCreated,
}: {
  onCreated: (property: Property) => void;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const wards = useWards();
  const amenities = useAmenities();
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
  const provinceId = useId();
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    getValues,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput, unknown, PropertyValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: EMPTY_PROPERTY,
  });
  const { failure, secondsLeft, report, clear } = useFormFailure(
    setError,
    PROPERTY_FORM_FIELDS,
  );
  const wardCode = useWatch({ control, name: "wardCode" });

  // The province is not typed: it follows the ward that was chosen.
  const provinceName =
    wards.data?.find((ward) => ward.code === wardCode)?.provinceName ?? "";

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

  const onSubmit = async (values: PropertyValues) => {
    clearFailure();
    try {
      const property = await create.mutateAsync(toPropertyBody(values));
      toast.success("Đã tạo nhà trọ", { description: property.name });
      onCreated(property);
    } catch (error) {
      // The session changed under the request (a sign out in this tab): there is nothing to show.
      if (isAbortError(error)) return;

      // The catalog changed under the form: an amenity that was ticked is gone. Read the list
      // again, clear only the boxes that are gone and keep everything else that was typed, then
      // say so in the amenities zone and put focus on its first box (spec 0017, AC-10). The keys
      // come from the form now and not from `values`, because the person may have ticked
      // another box while the request was running. If the read fails, or nothing is gone after
      // all, the backend's own message is shown instead.
      if (isApiError(error) && error.code === "AMENITY_UNKNOWN") {
        const { data: catalog } = await amenities.refetch();
        const held = getValues("amenityKeys");
        const gone = catalog ? removedAmenityKeys(catalog, held) : [];
        if (gone.length > 0) {
          setValue(
            "amenityKeys",
            held.filter((key) => !gone.includes(key)),
            { shouldDirty: true },
          );
          setError(
            "amenityKeys",
            { type: "server", message: AMENITY_REMOVED_MESSAGE },
            { shouldFocus: true },
          );
          return;
        }
      }

      report(error);
      const zoneTarget = zoneFocusTarget(error);
      if (zoneTarget) setFocus(zoneTarget);
      // The catalog changed under the form: read it again, and drop a choice that is gone, so
      // the person picks a ward from the list as it is now.
      if (isApiError(error) && error.code === "WARD_UNKNOWN") {
        void wards.refetch().then(({ data }) => {
          if (!data?.some((ward) => ward.code === values.wardCode)) {
            setValue("wardCode", "");
          }
        });
      }
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
      {/* Each zone is a labelled group, like the fieldset it replaces. The hairline under the
          title row is there because a form follows it. */}
      <Card role="group" aria-labelledby="property-general-title">
        <CardHeader className="border-b">
          <CardTitle id="property-general-title">Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FormField
              control={control}
              name="name"
              label="Tên nhà trọ"
              description="Từ 2 đến 100 ký tự."
            >
              {({ field, aria }) => (
                <Input
                  size="lg"
                  autoComplete="off"
                  placeholder="Nhà trọ Hoa Hồng"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card role="group" aria-labelledby="property-address-title">
        <CardHeader className="border-b">
          <CardTitle id="property-address-title">Địa chỉ</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FormField
              control={control}
              name="addressText"
              label="Số nhà và tên đường"
              description="Chỉ nhập số nhà và tên đường, không nhập phường, xã hay tỉnh."
            >
              {({ field, aria }) => (
                <Input
                  size="lg"
                  autoComplete="off"
                  placeholder="12 Lê Lợi"
                  {...field}
                  {...aria}
                />
              )}
            </FormField>

            <FormField
              control={control}
              name="wardCode"
              label="Phường, xã hoặc đặc khu"
              description="Chọn từ danh sách. Địa chỉ không có cấp quận, huyện."
            >
              {({ field, aria }) => (
                <WardPicker
                  ref={field.ref}
                  size="lg"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  {...aria}
                />
              )}
            </FormField>

            <Field>
              <FieldLabel htmlFor={provinceId}>Tỉnh, thành phố</FieldLabel>
              <Input
                id={provinceId}
                size="lg"
                readOnly
                className="bg-muted"
                value={provinceName}
                placeholder="Tự điền theo phường hoặc xã"
                aria-describedby={`${provinceId}-description`}
              />
              <FieldDescription id={`${provinceId}-description`}>
                Đi theo phường hoặc xã đã chọn.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <FeeRowsField control={control} setValue={setValue} />

      <AmenityField control={control} catalog={amenityCatalogOf(amenities)} />

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
            {isSubmitting ? "Đang tạo nhà trọ" : "Tạo nhà trọ"}
          </Button>
        </div>
      </div>
    </form>
  );
}
