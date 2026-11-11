"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useWards } from "@/features/wards/hooks/use-wards";
import type { Ward } from "@/lib/api/types";
import { useReturnFocus } from "@/lib/use-return-focus";
import { cn } from "@/lib/utils";
import { activeFilterCount } from "../filter-chips";
import {
  draftFromSearch,
  filterFormSchema,
  searchFromFilterForm,
  type FilterFormInput,
  type FilterFormValues,
} from "../filter-form";
import { focusDraftField } from "../focus-draft-field";
import { MAX_KEYWORD_LENGTH, searchFromParams } from "../schemas/search-params";
import { listingsHref, withoutFilters, withoutKeyword } from "../search-href";
import { hasFilters } from "../search-state";
import { SEARCH_BAR_TEXTS } from "../text";
import { FilterChips } from "./filter-chips";
import { FilterFields } from "./filter-fields";
import { FilterSheet } from "./filter-sheet";

// The layout of the bar, shared by the live form and its fallback so the card never changes
// height when the live one takes over (spec 0016, AC-5, AC-6, AC-18).
//
// Below `md` the card has the keyword box, then two equal buttons, "Tìm trọ" and "Bộ lọc" (which
// opens the sheet), and the ward and price boxes are hidden. From `md` there are two rows: keyword
// and button, then the ward and the prices. From `lg` all of it is one row. A box with a visible
// label is taller than the keyword box, so from `md` the ward box is pushed down by one label row
// (28 px: a 20 px line and the 8 px gap), and at `lg` the keyword and the buttons by two (56 px:
// the legend row and the label row of the prices), which puts every control on one line.
const BAR_GRID =
  "grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:gap-y-4 lg:grid-cols-[minmax(0,1fr)_12rem_19rem_auto] lg:items-start";
const KEYWORD_CELL = "md:col-start-1 md:row-start-1 lg:pt-14";
const FILTERS_WRAP =
  "hidden gap-3 md:col-span-2 md:row-start-2 md:grid md:grid-cols-2 lg:contents";
const WARD_PLACE = "md:pt-7 lg:col-start-2 lg:row-start-1";
const PRICE_PLACE = "lg:col-start-3 lg:row-start-1";
const ACTIONS_CELL =
  "grid grid-cols-2 gap-3 md:col-start-2 md:row-start-1 md:flex lg:col-start-4 lg:pt-14";

// The room kept under each price box for the number line, so typing the first digit does not
// make the card grow: a 20 px label, 8, the 44 px box, 8, and a 20 px line is 100 px.
const PRICE_FIELD_ROOM = "min-h-25";

// The boxes that can be wrong, in the order a person meets them. The keyword cannot be.
const DRAFT_FIELDS = ["wardCode", "minPrice", "maxPrice"] as const;

// Tailwind's `md`, where the filter boxes move from the sheet into the card.
const MD_QUERY = "(min-width: 768px)";

/**
 * The form shown until the live one is ready: the first visit, and a page read without scripts.
 * A plain GET form with the keyword box and the button, so a search still works (spec 0009,
 * AC-4), and grey blocks of the size of the filter boxes (the ward and prices from `md`, the
 * "Bộ lọc" button below it), so the card has the height it will have (spec 0016, AC-18).
 */
export function SearchBoxFallback() {
  return (
    <form
      action="/"
      role="search"
      aria-label={SEARCH_BAR_TEXTS.formLabel}
      className={BAR_GRID}
    >
      <div className={KEYWORD_CELL}>
        <Input
          name="q"
          type="search"
          size="lg"
          maxLength={MAX_KEYWORD_LENGTH}
          enterKeyHint="search"
          aria-label={SEARCH_BAR_TEXTS.keywordName}
          placeholder={SEARCH_BAR_TEXTS.keywordPlaceholder}
        />
      </div>
      <div className={FILTERS_WRAP} aria-hidden>
        <div className={cn("min-w-0", WARD_PLACE)}>
          <Skeleton className="h-11" />
        </div>
        {/* As tall as the prices: a 28 px legend row, then the 100 px field with its room. */}
        <div className={cn("min-h-32 min-w-0", PRICE_PLACE)}>
          <Skeleton className="mt-14 h-11" />
        </div>
      </div>
      <div className={ACTIONS_CELL}>
        <Button type="submit" size="lg">
          <SearchIcon data-icon="inline-start" />
          {SEARCH_BAR_TEXTS.submit}
        </Button>
        <Skeleton aria-hidden className="h-11 md:hidden" />
      </div>
    </form>
  );
}

/**
 * The live search bar (spec 0016, AC-5 to AC-9, AC-11). One draft of React Hook Form holds the
 * keyword, the ward and the two prices. Nothing is sent while a person types or picks: Enter in
 * the keyword or a price box, "Tìm trọ" or "Áp dụng" checks the draft with the Zod schema, then
 * either shows the mistakes and moves focus to the first box that is wrong, or goes to the new
 * address (page 1, and the order that is already applied).
 *
 * The filter boxes are in the card from `md`. Below `md` they are in a sheet that "Bộ lọc" opens,
 * and the sheet sits beside the form, not inside it. A send the draft fails on a phone, with the
 * sheet closed, opens the sheet and puts focus on the first box that is wrong, because the card's
 * copy of that box is hidden. Closing the sheet without applying puts the three filter boxes back
 * to what is applied and leaves the keyword as typed.
 *
 * The draft starts from the address and is set again, in place, when the keyword, ward or prices
 * of the address change (the back button, a link that drops a filter). It is not set again when
 * only the order or the page change. The bar has no `key`, so focus is never lost to `body` when
 * it would have been rebuilt.
 */
export function SearchBox({ initialWards }: { initialWards?: Ward[] }) {
  const router = useRouter();
  const search = searchFromParams(useSearchParams());
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  // The box the sheet puts focus on when it opens, or `null` for its title.
  const [focusField, setFocusField] = useState<string | null>(null);
  const filterButton = useRef<HTMLButtonElement>(null);
  const { remember, onCloseAutoFocus } = useReturnFocus(
    () => filterButton.current,
  );
  // One read of the catalog, shared by the ward boxes and the ward chip (spec 0016, AC-11).
  const wards = useWards(initialWards);
  const form = useForm<FilterFormInput, unknown, FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: draftFromSearch(search),
    // Focus is moved by `focusDraftField`, which knows which copy of a box is on screen.
    shouldFocusError: false,
  });
  const { reset, getValues } = form;

  const { q, wardCode, minPrice, maxPrice } = search;
  useEffect(() => {
    reset(draftFromSearch({ q, wardCode, minPrice, maxPrice }));
  }, [reset, q, wardCode, minPrice, maxPrice]);

  // The sheet is for a phone. If the window grows past `md` while it is open (the phone turns),
  // the card shows the boxes, so the sheet closes and the draft stays as it is.
  useEffect(() => {
    if (!open) return;
    const query = window.matchMedia(MD_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open]);

  const closeSheet = () => {
    setOpen(false);
    setFocusField(null);
  };

  // Closed by Escape, a tap outside or the close button: nothing is applied, so the three filter
  // boxes go back to the applied values. The keyword is not part of the sheet and keeps its text.
  const onOpenChange = (next: boolean) => {
    if (next) {
      setOpen(true);
      return;
    }
    reset({ ...draftFromSearch(search), q: getValues("q") });
    closeSheet();
  };

  const onValid = (values: FilterFormValues) => {
    // A second send while the first is on its way, such as Enter after the button.
    if (isPending) return;
    closeSheet();
    const next = searchFromFilterForm(values, search.sort);
    const target = listingsHref(next);
    if (target === listingsHref(search)) {
      // Nothing to look up. Show the checked text ("0" becomes empty, spaces go).
      reset(draftFromSearch(next));
      return;
    }
    startTransition(() => router.push(target));
  };

  const onInvalid = (errors: FieldErrors<FilterFormInput>) => {
    const first = DRAFT_FIELDS.find((name) => errors[name]);
    if (!first) return;
    // On a phone with the sheet closed, the card's copy of the box is hidden: open the sheet and
    // put focus on its copy. In every other case a copy is on screen already.
    if (!open && !window.matchMedia(MD_QUERY).matches) {
      setFocusField(first);
      setOpen(true);
      return;
    }
    focusDraftField(first);
  };

  // The card's form and the sheet's form send the same way.
  const submit = form.handleSubmit(onValid, onInvalid);
  const activeFilters = activeFilterCount(search);

  return (
    <div className="flex flex-col gap-4">
      <form
        role="search"
        aria-label={SEARCH_BAR_TEXTS.formLabel}
        noValidate
        onSubmit={submit}
        className={BAR_GRID}
      >
        <div className={KEYWORD_CELL}>
          <Input
            {...form.register("q")}
            type="search"
            size="lg"
            maxLength={MAX_KEYWORD_LENGTH}
            enterKeyHint="search"
            aria-label={SEARCH_BAR_TEXTS.keywordName}
            placeholder={SEARCH_BAR_TEXTS.keywordPlaceholder}
          />
        </div>
        <div className={FILTERS_WRAP}>
          <FilterFields
            control={form.control}
            initialWards={initialWards}
            wardClassName={WARD_PLACE}
            priceClassName={PRICE_PLACE}
            priceFieldClassName={PRICE_FIELD_ROOM}
          />
        </div>
        <div className={ACTIONS_CELL}>
          <Button type="submit" size="lg" disabled={isPending}>
            {isPending ? (
              <Spinner size="sm" data-icon="inline-start" />
            ) : (
              <SearchIcon data-icon="inline-start" />
            )}
            {SEARCH_BAR_TEXTS.submit}
          </Button>
          <Button
            ref={filterButton}
            type="button"
            variant="outline"
            size="lg"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={
              activeFilters > 0
                ? SEARCH_BAR_TEXTS.filterButtonName(activeFilters)
                : undefined
            }
            onClick={() => {
              remember();
              setFocusField(null);
              setOpen(true);
            }}
            className="md:hidden"
          >
            <SlidersHorizontalIcon data-icon="inline-start" />
            {SEARCH_BAR_TEXTS.filterButton}
            {activeFilters > 0 && (
              <Badge variant="secondary" aria-hidden>
                {activeFilters}
              </Badge>
            )}
          </Button>
          {/* Clears the applied keyword only. The filters and the order stay (spec 0016, AC-12). */}
          {q !== "" && (
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="col-span-2 md:col-span-1"
            >
              <Link href={listingsHref(withoutKeyword(search))}>
                {SEARCH_BAR_TEXTS.clearKeyword}
              </Link>
            </Button>
          )}
        </div>
      </form>

      <FilterChips search={search} wards={wards.data} />

      <FilterSheet
        open={open}
        onOpenChange={onOpenChange}
        onCloseAutoFocus={onCloseAutoFocus}
        control={form.control}
        initialWards={initialWards}
        onSubmit={submit}
        clearHref={
          hasFilters(search) ? listingsHref(withoutFilters(search)) : null
        }
        onClear={closeSheet}
        pending={isPending}
        focusField={focusField}
      />
    </div>
  );
}
