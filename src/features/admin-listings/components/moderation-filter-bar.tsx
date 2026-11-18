"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useId } from "react";
import { DebouncedSearchBox } from "@/components/form/debounced-search-box";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { landlordOptionsQuery } from "@/features/admin-orders/api/filter-options";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { ADMIN_LISTINGS_PATH } from "../admin-listings-path";
import {
  ALL_LANDLORDS,
  ALL_STATUSES,
  CLEAR_FILTERS,
  FILTERS_LABEL,
  LANDLORDS_FAILED,
  LANDLORD_FILTER_LABEL,
  SEARCH_LABEL,
  SEARCH_PLACEHOLDER,
  SELECTED_LANDLORD,
  STATUS_FILTER_LABEL,
  STATUS_HIDDEN_BY_ADMIN,
  STATUS_HIDDEN_BY_OWNER,
  STATUS_VISIBLE,
} from "../admin-listings-text";
import {
  adminListingsHref,
  cleanQuery,
  hasFilters,
  type ModerationFilters,
  type StatusFilter,
} from "../moderation-filter";

// Radix does not take an empty value on an item, so "no landlord filter" has a word of its own. An
// id is a UUID and never reads "all".
const ALL = "all";

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: "all", label: ALL_STATUSES },
  { value: "visible", label: STATUS_VISIBLE },
  { value: "hidden_by_owner", label: STATUS_HIDDEN_BY_OWNER },
  { value: "hidden_by_admin", label: STATUS_HIDDEN_BY_ADMIN },
];

/**
 * The filter zone above the list (scope #21): a search box, the status and the landlord. The
 * selects write the address at once and each change goes to page 1, so the filters are shared by
 * sharing the link and Back undoes a select. The search text waits 400 ms after the last key and
 * then replaces the address, so Back does not step through every letter. There is no text under
 * the box: the placeholder shows what can be typed. The landlord select reads the first 50
 * landlords with the permission `user:read`, and a person without it simply has no landlord
 * select (the name of a landlord in the table is a filter too). A list that fails to load never
 * blocks the listings.
 */
export function ModerationFilterBar({
  filters,
}: {
  filters: ModerationFilters;
}) {
  const api = useApi();
  const session = useSession();
  const router = useRouter();
  const statusId = useId();
  const landlordId = useId();
  const mayLandlords = can(session, "user:read");
  const landlords = useQuery({
    ...landlordOptionsQuery(api),
    enabled: mayLandlords,
  });

  const go = (next: ModerationFilters) =>
    router.push(adminListingsHref(next, 1), { scroll: false });

  const search = useCallback(
    (q: string) =>
      router.replace(adminListingsHref({ ...filters, q }, 1), {
        scroll: false,
      }),
    [router, filters],
  );

  // A value in the address that the list does not hold yet (still loading, or past the first 50)
  // gets an item of its own, so the select never shows blank.
  const selected = filters.landlordId;
  const known =
    selected === null ||
    (landlords.data?.some((landlord) => landlord.id === selected) ?? false);

  return (
    <Card role="search" aria-label={FILTERS_LABEL}>
      <CardContent className="flex flex-col gap-4">
        <div
          className={
            mayLandlords
              ? "grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem_20rem]"
              : "grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem]"
          }
        >
          <DebouncedSearchBox
            value={filters.q}
            onSearch={search}
            clean={cleanQuery}
            label={SEARCH_LABEL}
            placeholder={SEARCH_PLACEHOLDER}
          />
          <Field>
            <FieldLabel htmlFor={statusId}>{STATUS_FILTER_LABEL}</FieldLabel>
            <Select
              value={filters.status}
              onValueChange={(status) =>
                go({ ...filters, status: status as StatusFilter })
              }
            >
              <SelectTrigger id={statusId} size="lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {mayLandlords && (
            <Field>
              <FieldLabel htmlFor={landlordId}>
                {LANDLORD_FILTER_LABEL}
              </FieldLabel>
              <Select
                value={selected ?? ALL}
                onValueChange={(next) =>
                  go({ ...filters, landlordId: next === ALL ? null : next })
                }
              >
                <SelectTrigger id={landlordId} size="lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{ALL_LANDLORDS}</SelectItem>
                  {selected !== null && !known && (
                    <SelectItem value={selected}>
                      {SELECTED_LANDLORD}
                    </SelectItem>
                  )}
                  {landlords.data?.map((landlord) => (
                    <SelectItem key={landlord.id} value={landlord.id}>
                      {landlord.name?.trim()
                        ? `${landlord.name.trim()} · ${landlord.email}`
                        : landlord.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {landlords.isError && <FieldError>{LANDLORDS_FAILED}</FieldError>}
            </Field>
          )}
        </div>
        {hasFilters(filters) && (
          <div className="flex justify-end">
            <Button asChild variant="ghost" size="lg">
              <Link href={ADMIN_LISTINGS_PATH}>{CLEAR_FILTERS}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
