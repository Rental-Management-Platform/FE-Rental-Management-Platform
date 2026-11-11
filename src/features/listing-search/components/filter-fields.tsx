"use client";

import type { Control } from "react-hook-form";
import { FormField } from "@/components/form/form-field";
import { WardPicker } from "@/features/wards/components/ward-picker";
import type { Ward } from "@/lib/api/types";
import type { FilterFormInput, FilterFormValues } from "../filter-form";
import { SEARCH_BAR_TEXTS } from "../text";
import { PriceFields } from "./price-fields";

/**
 * The ward box and the two price boxes, the filter boxes of the search bar (spec 0016, AC-9). They
 * read and write the one draft of the bar, so the copy in the card and the copy in the sheet can
 * never disagree. The parent decides where each part goes, through the two class names.
 *
 * `initialWards` is the catalog the server read, so the ward button shows its name on the first
 * render. `portalContainer` is where the ward list opens: inside the sheet when there is one.
 */
export function FilterFields({
  control,
  initialWards,
  portalContainer,
  wardClassName,
  priceClassName,
  priceFieldClassName,
}: {
  control: Control<FilterFormInput, unknown, FilterFormValues>;
  initialWards?: Ward[];
  portalContainer?: HTMLElement | null;
  wardClassName?: string;
  priceClassName?: string;
  priceFieldClassName?: string;
}) {
  return (
    <>
      <FormField
        control={control}
        name="wardCode"
        label={SEARCH_BAR_TEXTS.wardLabel}
        className={wardClassName}
      >
        {({ field, aria }) => (
          <WardPicker
            {...aria}
            ref={field.ref}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            initialWards={initialWards}
            allLabel={SEARCH_BAR_TEXTS.wardAll}
            size="lg"
            portalContainer={portalContainer}
            data-draft-field="wardCode"
          />
        )}
      </FormField>
      <PriceFields
        control={control}
        className={priceClassName}
        fieldClassName={priceFieldClassName}
      />
    </>
  );
}
