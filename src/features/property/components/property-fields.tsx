"use client";

import { FormField } from "@/components/form/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { amenityCatalogOf } from "@/features/amenities/amenity-catalog";
import { WardPicker } from "@/features/wards/components/ward-picker";
import type { PropertyFormState } from "../hooks/use-property-form";
import { AmenityField } from "./amenity-field";
import { FeeRowsField } from "./fee-rows-field";
import { LocationField } from "./location-field";

/**
 * The five zones of a property form on the canvas: general, address, location, fees and
 * amenities (api-for-frontend.md, 6.17; specs 0017 and 0011). The create form and the edit form
 * of #12 both draw them, from the state of `usePropertyForm`, so the two cannot drift apart. The
 * notice and the submit row under them belong to each form.
 */
export function PropertyFields({ state }: { state: PropertyFormState }) {
  const {
    form: { control, setValue },
    amenities,
    location,
    chosenWard,
    provinceId,
    provinceName,
    locationOpen,
    setLocationOpen,
    boundsPending,
    onWardPicked,
  } = state;

  return (
    <>
      {/* Each zone is a labelled group, like the fieldset it replaces. The hairline under the
          title row is there because a form follows it. */}
      <Card role="group" aria-labelledby="property-general-title">
        <CardHeader className="border-b">
          <CardTitle id="property-general-title">Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <FormField control={control} name="name" label="Tên nhà trọ">
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
            >
              {({ field, aria }) => (
                <WardPicker
                  ref={field.ref}
                  size="lg"
                  value={field.value}
                  onChange={(code) => {
                    field.onChange(code);
                    onWardPicked(code);
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
              />
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
        boundsPending={boundsPending}
      />

      <FeeRowsField control={control} setValue={setValue} />

      <AmenityField control={control} catalog={amenityCatalogOf(amenities)} />
    </>
  );
}
