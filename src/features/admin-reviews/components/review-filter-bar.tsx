"use client";

import { XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_STATUSES,
  AUTHOR_FILTER_LABEL,
  CLEAR_FILTERS,
  FILTERS_LABEL,
  STATUS_FILTER_LABEL,
  STATUS_HIDDEN_BY_ADMIN,
  STATUS_VISIBLE,
  removeAuthorFilterName,
} from "../admin-reviews-text";
import {
  adminReviewsHref,
  clearFilters,
  hasFilters,
  type ReviewFilters,
  type StatusFilter,
} from "../review-filter";

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: "all", label: ALL_STATUSES },
  { value: "visible", label: STATUS_VISIBLE },
  { value: "hidden_by_admin", label: STATUS_HIDDEN_BY_ADMIN },
];

/**
 * The filter zone above a list (scope #36): the status, the one filter that belongs to the tab
 * (`children`: the landlord select, or the listing chip) and the writer. The status select writes
 * the address at once and goes to page 1, so the filters are shared by sharing the link and Back
 * undoes a select. A writer is set by pressing a name in the table, so here it is a chip with the
 * name that takes the filter off. There is no text under any control. "Xóa bộ lọc" keeps the tab.
 */
export function ReviewFilterBar({
  filters,
  authorLabel,
  children,
}: {
  filters: ReviewFilters;
  /** The name of the writer the filter is set to. Ignored while no writer is set. */
  authorLabel: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const statusId = useId();

  return (
    <Card role="search" aria-label={FILTERS_LABEL}>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-[15rem_minmax(0,20rem)]">
          <Field>
            <FieldLabel htmlFor={statusId}>{STATUS_FILTER_LABEL}</FieldLabel>
            <Select
              value={filters.status}
              onValueChange={(status) =>
                router.push(
                  adminReviewsHref(
                    { ...filters, status: status as StatusFilter },
                    1,
                  ),
                  { scroll: false },
                )
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
          {children}
        </div>
        {hasFilters(filters) && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.authorId !== null && (
              <Button asChild variant="outline" size="lg">
                <Link
                  href={adminReviewsHref({ ...filters, authorId: null }, 1)}
                  aria-label={removeAuthorFilterName(authorLabel)}
                  scroll={false}
                >
                  <span className="max-w-56 truncate">
                    {AUTHOR_FILTER_LABEL}: {authorLabel}
                  </span>
                  <XIcon data-icon="inline-end" aria-hidden="true" />
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="lg" className="ml-auto">
              <Link href={adminReviewsHref(clearFilters(filters), 1)}>
                {CLEAR_FILTERS}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
