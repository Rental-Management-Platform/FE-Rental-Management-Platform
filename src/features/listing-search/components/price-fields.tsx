"use client";

import {
  useWatch,
  type Control,
  type ControllerRenderProps,
} from "react-hook-form";
import { FormField, type FormFieldAria } from "@/components/form/form-field";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  readPrice,
  type FilterFormInput,
  type FilterFormValues,
} from "../filter-form";
import { MAX_PRICE } from "../schemas/search-params";
import { SEARCH_BAR_TEXTS } from "../text";

type DraftControl = Control<FilterFormInput, unknown, FilterFormValues>;

// Nine digits, so the box cannot take more than the API accepts (100,000,000 has nine).
const PRICE_MAX_LENGTH = String(MAX_PRICE).length;

// The number line under a box: the typed number as money, or nothing while it is not a number
// (an empty box, a mistake). It is the box's description, so it is read with it, and the error
// takes its place while the box is invalid (`FormField` does that).
function useNumberLine(control: DraftControl, name: "minPrice" | "maxPrice") {
  const reading = readPrice(useWatch({ control, name }));
  return reading.kind === "number" ? formatMoney(reading.value) : undefined;
}

/**
 * The two price boxes, "Giá từ" and "Giá đến", in one `fieldset` with a visible legend (spec
 * 0016, AC-8). Each box takes digits only, shows what the number reads as, and tells its mistake
 * after the first send. The two check each other (`deps`), so fixing "Giá từ" clears an error
 * that sits on "Giá đến". The boxes sit in two columns while each is at least 140 px wide, and in
 * one column when there is less room (AC-20).
 *
 * `className` places the fieldset; `fieldClassName` goes on each box's field, so the bar can keep
 * a line of room under each box for the number line.
 */
export function PriceFields({
  control,
  className,
  fieldClassName,
}: {
  control: DraftControl;
  className?: string;
  fieldClassName?: string;
}) {
  const minLine = useNumberLine(control, "minPrice");
  const maxLine = useNumberLine(control, "maxPrice");

  return (
    <FieldSet className={cn("min-w-0 gap-2", className)}>
      <FieldLegend variant="label" className="mb-2">
        {SEARCH_BAR_TEXTS.priceLegend}
      </FieldLegend>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(8.75rem,1fr))] gap-x-4 gap-y-3">
        <FormField
          control={control}
          name="minPrice"
          deps={["maxPrice"]}
          label={SEARCH_BAR_TEXTS.minPriceLabel}
          description={minLine}
          className={fieldClassName}
        >
          {({ field, aria }) => (
            <PriceInput field={field} aria={aria} name="minPrice" />
          )}
        </FormField>
        <FormField
          control={control}
          name="maxPrice"
          deps={["minPrice"]}
          label={SEARCH_BAR_TEXTS.maxPriceLabel}
          description={maxLine}
          className={fieldClassName}
        >
          {({ field, aria }) => (
            <PriceInput field={field} aria={aria} name="maxPrice" />
          )}
        </FormField>
      </div>
    </FieldSet>
  );
}

// `data-draft-field` lets the bar find this box in the page to move focus to it after a send
// that was refused (there may be two copies of the box, one hidden).
function PriceInput({
  field,
  aria,
  name,
}: {
  field: ControllerRenderProps<FilterFormInput, "minPrice" | "maxPrice">;
  aria: FormFieldAria;
  name: "minPrice" | "maxPrice";
}) {
  return (
    <Input
      {...field}
      {...aria}
      data-draft-field={name}
      type="text"
      size="lg"
      inputMode="numeric"
      autoComplete="off"
      maxLength={PRICE_MAX_LENGTH}
      enterKeyHint="search"
    />
  );
}
