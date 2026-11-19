"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { DatePicker } from "@/components/form/date-picker";
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
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import {
  adminOrdersHref,
  hasFilters,
  type AdminOrderFilters,
} from "../admin-order-filter";
import { ADMIN_ORDERS_PATH } from "../admin-orders-path";
import {
  ALL_LANDLORDS,
  ALL_PLANS,
  BACKWARDS_FIELD_ERROR,
  CLEAR_FILTERS,
  DAY_PLACEHOLDER,
  FILTERS_LABEL,
  FROM_LABEL,
  LANDLORD_LABEL,
  PLAN_LABEL,
  PLAN_OFF,
  PLANS_FAILED,
  SELECTED_PLAN,
  TO_LABEL,
} from "../admin-orders-text";
import { planOptionsQuery } from "../api/filter-options";
import { LandlordPicker } from "./landlord-picker";

// Radix does not take an empty value on an item, so "no filter" has a word of its own. An id is a
// UUID and never reads "all".
const ALL = "all";

interface Option {
  value: string;
  label: string;
}

/**
 * The filter zone above the list (scope #25): plan, landlord, and the first and last day an order
 * was created. The status is the tab row of the list zone. Each change goes to the address and to
 * page 1, so the filters are shared by sharing the link, and the back button undoes them. The plan
 * select and the landlord picker read their lists with the permission each needs (`plan:read`,
 * `user:read`) and a person without it simply has no field. The plans are a short list a person
 * curates, so they stay a select; the landlords grow without end, so they are a picker with a
 * search row. A list that fails to load never blocks the orders.
 */
export function AdminOrderFilterBar({
  filters,
  backwards,
}: {
  filters: AdminOrderFilters;
  /** The first day is after the last: the error goes under "Đến ngày", as the API reports it. */
  backwards: boolean;
}) {
  const api = useApi();
  const session = useSession();
  const router = useRouter();
  const mayPlans = can(session, "plan:read");
  const mayLandlords = can(session, "user:read");
  const plans = useQuery({ ...planOptionsQuery(api), enabled: mayPlans });

  const planId = useId();
  const fromId = useId();
  const toId = useId();
  const toErrorId = useId();

  const go = (next: AdminOrderFilters) =>
    router.push(adminOrdersHref(next, 1), { scroll: false });

  return (
    <Card role="group" aria-label={FILTERS_LABEL}>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mayPlans && (
            <OptionField
              id={planId}
              label={PLAN_LABEL}
              allLabel={ALL_PLANS}
              selectedLabel={SELECTED_PLAN}
              failedText={PLANS_FAILED}
              failed={plans.isError}
              value={filters.planId}
              options={plans.data?.map((plan) => ({
                value: plan.id,
                label: plan.isActive ? plan.name : `${plan.name} (${PLAN_OFF})`,
              }))}
              onChange={(next) => go({ ...filters, planId: next })}
            />
          )}
          {mayLandlords && (
            <LandlordPicker
              label={LANDLORD_LABEL}
              allLabel={ALL_LANDLORDS}
              value={filters.landlordId}
              onChange={(next) => go({ ...filters, landlordId: next })}
            />
          )}
          <Field>
            <FieldLabel htmlFor={fromId}>{FROM_LABEL}</FieldLabel>
            <DatePicker
              id={fromId}
              placeholder={DAY_PLACEHOLDER}
              value={filters.from ?? ""}
              onChange={(day) =>
                go({ ...filters, from: day === "" ? null : day })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={toId}>{TO_LABEL}</FieldLabel>
            <DatePicker
              id={toId}
              placeholder={DAY_PLACEHOLDER}
              value={filters.to ?? ""}
              onChange={(day) =>
                go({ ...filters, to: day === "" ? null : day })
              }
              aria-invalid={backwards || undefined}
              aria-describedby={backwards ? toErrorId : undefined}
            />
            {backwards && (
              <FieldError id={toErrorId}>{BACKWARDS_FIELD_ERROR}</FieldError>
            )}
          </Field>
        </div>
        {hasFilters(filters) && (
          <div className="flex justify-end">
            <Button asChild variant="ghost" size="lg">
              <Link href={ADMIN_ORDERS_PATH}>{CLEAR_FILTERS}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// One select of "no filter" and a list. A value in the address that the list does not hold yet
// (still loading, or past the first 50) gets an item of its own, so the select never shows blank.
function OptionField({
  id,
  label,
  allLabel,
  selectedLabel,
  failedText,
  failed,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  allLabel: string;
  selectedLabel: string;
  failedText: string;
  failed: boolean;
  value: string | null;
  options: Option[] | undefined;
  onChange: (value: string | null) => void;
}) {
  const known =
    value === null ||
    (options?.some((option) => option.value === value) ?? false);
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value ?? ALL}
        onValueChange={(next) => onChange(next === ALL ? null : next)}
      >
        <SelectTrigger id={id} size="lg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {value !== null && !known && (
            <SelectItem value={value}>{selectedLabel}</SelectItem>
          )}
          {options?.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {failed && <FieldError>{failedText}</FieldError>}
    </Field>
  );
}
