"use client";

import { useState, type ComponentProps } from "react";
import { SearchPicker } from "@/components/form/search-picker";
import type { PropertyListItem } from "@/lib/api/types";
import { matchPropertiesByName } from "../property-match";

// Cut the typed text to this many characters when it is repeated back in a message.
const ECHO_LENGTH = 40;

const PICKER_TEXT = {
  placeholder: "Chọn nhà trọ",
  boxLabel: "Chọn nhà trọ",
  searchLabel: "Tìm nhà trọ",
  searchPlaceholder: "Gõ tên nhà trọ, không cần dấu",
  listLabel: "Danh sách nhà trọ",
  none: "Chưa có nhà trọ nào.",
  noMatch: (typed: string) =>
    `Không có nhà trọ nào khớp “${typed.slice(0, ECHO_LENGTH)}”.`,
} as const;

/**
 * The property field of the post listing form. A landlord adds properties over time, so a plain
 * select turns into a long scroll; this one opens a box with a search row. The list is already
 * loaded in full, so the typed text filters it here and nothing is asked of the API. The field is
 * required, so there is no row that clears it. `ref`, `onBlur` and the `aria-*` of the form field
 * go to the button, so the label points at it and a server error can move focus there.
 */
export function PropertyPicker({
  properties,
  value,
  onChange,
  ...props
}: Omit<
  ComponentProps<"button">,
  "value" | "onChange" | "type" | "children"
> & {
  properties: readonly Pick<PropertyListItem, "id" | "name">[];
  /** The property id, or "" for none. */
  value: string;
  onChange: (id: string) => void;
}) {
  const [text, setText] = useState("");

  return (
    <SearchPicker
      {...props}
      size="lg"
      value={value === "" ? null : value}
      valueLabel={
        properties.find((property) => property.id === value)?.name ?? ""
      }
      placeholder={PICKER_TEXT.placeholder}
      options={matchPropertiesByName(properties, text).map((property) => ({
        value: property.id,
        label: property.name,
      }))}
      text={text}
      onTextChange={setText}
      // The text goes when the box closes, so it opens showing every property.
      onOpenChange={(open) => {
        if (!open) setText("");
      }}
      onPick={(next) => onChange(next ?? "")}
      boxLabel={PICKER_TEXT.boxLabel}
      searchLabel={PICKER_TEXT.searchLabel}
      searchPlaceholder={PICKER_TEXT.searchPlaceholder}
      listLabel={PICKER_TEXT.listLabel}
      noMatchText={
        text.trim() === "" ? PICKER_TEXT.none : PICKER_TEXT.noMatch(text.trim())
      }
    />
  );
}
