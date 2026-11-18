"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useId } from "react";
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
import {
  ALL_LANDLORDS,
  LANDLORDS_FAILED,
  LANDLORD_FILTER_LABEL,
  SELECTED_LANDLORD,
} from "../admin-reviews-text";
import { adminReviewsHref, type LandlordFilters } from "../review-filter";

// Radix does not take an empty value on an item, so "no landlord filter" has a word of its own. An
// id is a UUID and never reads "all".
const ALL = "all";

/**
 * The landlord filter of the landlord tab (scope #36). It reads the first 50 landlords with the
 * permission `user:read`, and a person without it simply has no select, so it draws nothing. A list
 * that fails to load never blocks the reviews: only this select says so. A value in the address that
 * the list does not hold yet (still loading, or past the first 50) gets an item of its own, so the
 * select never shows blank.
 */
export function LandlordSelect({ filters }: { filters: LandlordFilters }) {
  const api = useApi();
  const session = useSession();
  const router = useRouter();
  const id = useId();
  const mayLandlords = can(session, "user:read");
  const landlords = useQuery({
    ...landlordOptionsQuery(api),
    enabled: mayLandlords,
  });

  if (!mayLandlords) return null;

  const selected = filters.landlordId;
  const known =
    selected === null ||
    (landlords.data?.some((landlord) => landlord.id === selected) ?? false);

  return (
    <Field>
      <FieldLabel htmlFor={id}>{LANDLORD_FILTER_LABEL}</FieldLabel>
      <Select
        value={selected ?? ALL}
        onValueChange={(next) =>
          router.push(
            adminReviewsHref(
              { ...filters, landlordId: next === ALL ? null : next },
              1,
            ),
            { scroll: false },
          )
        }
      >
        <SelectTrigger id={id} size="lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{ALL_LANDLORDS}</SelectItem>
          {selected !== null && !known && (
            <SelectItem value={selected}>{SELECTED_LANDLORD}</SelectItem>
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
  );
}
