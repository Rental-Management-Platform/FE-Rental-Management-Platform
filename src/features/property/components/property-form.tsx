"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useMemo, useState } from "react";
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
import {
  useLocationPin,
  type PinFields,
} from "@/features/location-map/hooks/use-location-pin";
import { isAbortError } from "@/lib/api/abort";
import { isApiError } from "@/lib/api/errors";
import type {
  CatalogWard,
  Property,
  PropertyBody,
  Ward,
} from "@/lib/api/types";
import { useFormFailure } from "@/lib/forms/use-form-failure";
import { useApi } from "@/lib/session/auth-provider";
import { WardPicker } from "@/features/wards/components/ward-picker";
import { useWardBounds } from "@/features/wards/hooks/use-ward-bounds";
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
import { LocationField } from "./location-field";
import {
  createPropertySchema,
  EMPTY_PROPERTY,
  toPropertyBody,
  type PropertyInput,
  type PropertyValues,
  type PropertyWard,
} from "../schemas/property-schema";

// Before the ward boxes arrive (or when they cannot), no ward has a box.
const NO_BOXED_WARDS: readonly CatalogWard[] = [];

// The ward the map works with: the entry with its box if the boxes are here, else the entry by
// name with no box, else none.
function chooseWard(
  code: string,
  boxed: readonly CatalogWard[],
  named: readonly Ward[] | undefined,
): PropertyWard | null {
  const withBox = boxed.find((ward) => ward.code === code);
  if (withBox) return withBox;
  const byName = named?.find((ward) => ward.code === code);
  return byName ? { ...byName, bounds: null } : null;
}

// The create property form: five zones on the canvas (general, address, location, fees,
// amenities) with the notice and the submit row under them (api-for-frontend.md, 6.17; specs
// 0017 and 0011).
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

  // The location zone is closed until the landlord opens it. The ward boxes are read when it
  // first opens and then stay in the cache, so the schema below keeps them (spec 0011, AC-1).
  const [locationOpen, setLocationOpen] = useState(false);
  const wardBounds = useWardBounds({ enabled: locationOpen });
  const boxedWards = wardBounds.data ?? NO_BOXED_WARDS;
  const resolver = useMemo(
    () => zodResolver(createPropertySchema(boxedWards)),
    [boxedWards],
  );

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    getValues,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<PropertyInput, unknown, PropertyValues>({
    resolver,
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

  // The chosen ward as the map needs it: with its box when the boxes have arrived, else by name
  // alone and with no box, so only the two city boxes are checked (the backend checks the ward).
  const chosenWard = chooseWard(wardCode, boxedWards, wards.data);

  const pinFields: PinFields = {
    read: () => ({
      latitude: getValues("latitude"),
      longitude: getValues("longitude"),
    }),
    write: (latitude, longitude) => {
      setValue("latitude", latitude, { shouldDirty: true });
      setValue("longitude", longitude, { shouldDirty: true });
    },
    validate: () => trigger(["latitude", "longitude"]),
    clearErrors: () => clearErrors(["latitude", "longitude"]),
    readAddress: () => getValues("addressText"),
    writeAddress: (text) =>
      setValue("addressText", text, {
        shouldValidate: true,
        shouldDirty: true,
      }),
  };
  const location = useLocationPin({
    fields: pinFields,
    ward: chosenWard,
    open: locationOpen,
  });

  const clearFailure = () => {
    clear();
    clearErrors("root.server");
  };

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
      if (zoneTarget === "latitude") {
        // The coordinate boxes only exist while the location zone is open: open it first, and
        // focus "Vĩ độ" once it has drawn (spec 0011, AC-11).
        setLocationOpen(true);
        requestAnimationFrame(() => setFocus("latitude"));
      } else if (zoneTarget) {
        setFocus(zoneTarget);
      }
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
                  onChange={(code) => {
                    field.onChange(code);
                    // A pin the new ward does not allow is dropped, and an open map fits the
                    // new ward (spec 0011, AC-10).
                    location.onWardChange(
                      chooseWard(code, boxedWards, wards.data),
                    );
                  }}
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

      <LocationField
        control={control}
        location={location}
        ward={chosenWard}
        open={locationOpen}
        onOpenChange={setLocationOpen}
        boundsPending={locationOpen && wardBounds.isPending}
      />

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
