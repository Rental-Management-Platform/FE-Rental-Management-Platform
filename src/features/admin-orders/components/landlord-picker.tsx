"use client";

import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";
import { SearchPicker } from "@/components/form/search-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { formatCount } from "@/lib/format";
import { useApi } from "@/lib/session/auth-provider";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  landlordOptionsQuery,
  type LandlordOption,
} from "../api/filter-options";
import { LANDLORD_PICKER_TEXT } from "../landlord-picker-text";

/** How long the box waits after the last key before it asks the API (as the other admin searches). */
const SEARCH_DELAY_MS = 400;

/** The one rule for a search text: trimmed and cut, so a typed text and a sent text agree. */
const cleanText = (text: string): string => text.trim().slice(0, 100);

const optionLabel = (landlord: LandlordOption): string =>
  landlord.name?.trim()
    ? `${landlord.name.trim()} · ${landlord.email}`
    : landlord.email;

/**
 * The landlord filter of the three admin lists that have one (orders, listing moderation and review
 * moderation): a field that opens a box with a search row. The list of landlords grows without end
 * and the API gives 50 at most, so the box asks the API for the typed text (`q`) after 400 ms
 * instead of holding a long list. With no text it shows the first 50, and a line says how many more
 * there are. The page that uses it has checked `user:read`: without that permission it draws no
 * field at all.
 *
 * A landlord in the address that the list does not hold (a link that was shared, or one picked out
 * of the first 50) is called "Chủ trọ đã chọn" until it shows up in a list: the API has no read of
 * one account. One that was just picked keeps its own name. A list that fails to load never blocks
 * the page behind it.
 */
export function LandlordPicker({
  label,
  allLabel,
  value,
  onChange,
}: {
  label: string;
  /** The first row, which clears the filter, and the button text while nothing is chosen. */
  allLabel: string;
  /** The landlord id in the address, or `null` for no filter. */
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const api = useApi();
  const id = useId();
  const [text, setText] = useState("");
  const [picked, setPicked] = useState<LandlordOption | null>(null);

  // What is asked for: the debounced text, or no text at all the moment the box is cleared.
  const typed = cleanText(text);
  const settled = useDebouncedValue(typed, SEARCH_DELAY_MS);
  const asked = typed === "" ? "" : settled;

  // The first 50 are always read: they name the chosen landlord on the button, and they are the
  // rows of a box with nothing typed.
  const first = useQuery(landlordOptionsQuery(api));
  const found = useQuery({
    ...landlordOptionsQuery(api, asked),
    enabled: asked !== "",
  });
  const shown = asked === "" ? first : found;

  const items = shown.data?.items ?? [];
  const total = shown.data?.total ?? 0;
  // Waiting for the delay, or for the answer. Rows of the previous text may still be on screen.
  const busy = asked !== typed || shown.isPending || shown.isPlaceholderData;

  const known =
    picked?.id === value
      ? picked
      : [...(first.data?.items ?? []), ...(found.data?.items ?? [])].find(
          (landlord) => landlord.id === value,
        );

  const noMatchText =
    typed === ""
      ? LANDLORD_PICKER_TEXT.none
      : LANDLORD_PICKER_TEXT.noMatch(typed);
  const footnote =
    total > items.length
      ? (asked === ""
          ? LANDLORD_PICKER_TEXT.moreThanShown
          : LANDLORD_PICKER_TEXT.moreThanShownMatching)(
          formatCount(items.length),
          formatCount(total),
        )
      : undefined;

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <SearchPicker
        id={id}
        size="lg"
        value={value}
        valueLabel={known ? optionLabel(known) : LANDLORD_PICKER_TEXT.selected}
        allLabel={allLabel}
        options={items.map((landlord) => ({
          value: landlord.id,
          label: optionLabel(landlord),
        }))}
        text={text}
        onTextChange={setText}
        // The text goes when the box closes, so it opens empty and shows the first 50.
        onOpenChange={(open) => {
          if (!open) setText("");
        }}
        onPick={(next) => {
          setPicked(items.find((landlord) => landlord.id === next) ?? null);
          onChange(next);
        }}
        boxLabel={LANDLORD_PICKER_TEXT.boxLabel}
        searchLabel={LANDLORD_PICKER_TEXT.searchLabel}
        searchPlaceholder={LANDLORD_PICKER_TEXT.searchPlaceholder}
        listLabel={LANDLORD_PICKER_TEXT.listLabel}
        noMatchText={noMatchText}
        busy={busy}
        failedText={shown.isError ? LANDLORD_PICKER_TEXT.failed : undefined}
        onRetry={() => void shown.refetch()}
        footnote={footnote}
      />
      {first.isError && <FieldError>{LANDLORD_PICKER_TEXT.failed}</FieldError>}
    </Field>
  );
}
