"use client";

import type { Ward } from "@/lib/api/types";
import { describeError } from "@/lib/api/errors";
import { useWards } from "../hooks/use-wards";
import { WardPickerView, type WardPickerViewProps } from "./ward-picker-view";

export interface WardPickerProps extends Omit<
  WardPickerViewProps,
  "wards" | "errorMessage" | "retrying" | "onRetry"
> {
  /**
   * The catalog a Server Component already read, so the first render has the names and the
   * browser does not call `GET /wards` (spec 0015, AC-17). `undefined` or an empty array means
   * none: the picker reads it in the browser. It never changes the list it is given.
   */
  initialWards?: Ward[];
}

/**
 * A ward field: a button that shows the chosen ward and opens a box with a search row and the
 * wards that match what was typed (accents ignored). Spread `field` and `aria` of `FormField`
 * onto it: `id`, `ref`, `onBlur` and the `aria-*` all land on the button, so the label points at
 * it and focus on an error goes there. It only calls `onChange` after the person picks a row.
 *
 * It reads the catalog through the shared `["wards"]` query. Once there is a catalog it stays
 * usable, even if a later read fails; only a missing catalog shows the loading text or the alert.
 */
export function WardPicker({ initialWards, ...props }: WardPickerProps) {
  const wards = useWards(initialWards);

  return (
    <WardPickerView
      {...props}
      wards={wards.data}
      errorMessage={
        wards.data || !wards.isError
          ? undefined
          : describeError(wards.error).message
      }
      retrying={wards.isFetching}
      onRetry={() => void wards.refetch()}
    />
  );
}
