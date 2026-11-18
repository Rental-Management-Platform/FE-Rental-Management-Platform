"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_TYPE_LABEL } from "@/features/account/access";
import { ADMIN_USERS_PATH } from "../admin-users-path";
import {
  ALL_STATUSES,
  ALL_TYPES,
  CLEAR_FILTERS,
  FILTERS_LABEL,
  SEARCH_LABEL,
  SEARCH_PLACEHOLDER,
  STATUS_ACTIVE,
  STATUS_FILTER_LABEL,
  STATUS_LOCKED,
  TYPE_FILTER_LABEL,
} from "../admin-users-text";
import {
  adminUsersHref,
  cleanQuery,
  hasFilters,
  type AccountTypeFilter,
  type StatusFilter,
  type UserFilters,
} from "../user-filter";

/** How long the search box waits after the last key before it changes the address. */
const SEARCH_DELAY_MS = 400;

const TYPE_OPTIONS: readonly { value: AccountTypeFilter; label: string }[] = [
  { value: "all", label: ALL_TYPES },
  { value: "admin", label: ACCOUNT_TYPE_LABEL.admin },
  { value: "landlord", label: ACCOUNT_TYPE_LABEL.landlord },
  { value: "tenant", label: ACCOUNT_TYPE_LABEL.tenant },
];

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: "all", label: ALL_STATUSES },
  { value: "active", label: STATUS_ACTIVE },
  { value: "locked", label: STATUS_LOCKED },
];

/**
 * The filter zone above the list (scope #20, spec 0023, AC-3 and AC-4): a search box and the two
 * selects, type and status. The selects write the address at once and each change goes to page 1,
 * so the filters are shared by sharing the link and Back undoes a select. The search text waits
 * 400 ms after the last key and then replaces the address, so Back does not step through every
 * letter. There is no text under the box: the placeholder shows what can be typed, and a search
 * that finds nothing says so in the list zone.
 */
export function UserFilterBar({ filters }: { filters: UserFilters }) {
  const router = useRouter();
  const typeId = useId();
  const statusId = useId();

  const go = (next: UserFilters) =>
    router.push(adminUsersHref(next, 1), { scroll: false });

  const search = useCallback(
    (q: string) =>
      router.replace(adminUsersHref({ ...filters, q }, 1), { scroll: false }),
    [router, filters],
  );

  return (
    <Card role="search" aria-label={FILTERS_LABEL}>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem_15rem]">
          <SearchBox value={filters.q} onSearch={search} />
          <Field>
            <FieldLabel htmlFor={typeId}>{TYPE_FILTER_LABEL}</FieldLabel>
            <Select
              value={filters.accountType}
              onValueChange={(accountType) =>
                go({
                  ...filters,
                  accountType: accountType as AccountTypeFilter,
                })
              }
            >
              <SelectTrigger id={typeId} size="lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
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
        </div>
        {hasFilters(filters) && (
          <div className="flex justify-end">
            <Button asChild variant="ghost" size="lg">
              <Link href={ADMIN_USERS_PATH}>{CLEAR_FILTERS}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * The search box owns its text while the person types: it never takes the address text back
 * because of its own echo, or a trailing space would vanish under the finger. It takes the address
 * text again only when the address changes from outside (the "Xóa bộ lọc" button, Back). `pushed`
 * is the text this box last wrote to the address, so an address equal to it is its own echo.
 * Enter does not wait for the 400 ms.
 */
function SearchBox({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (q: string) => void;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const [pushed, setPushed] = useState(value);
  const [seen, setSeen] = useState(value);

  // An address that is not what this box wrote is an outside change: take its text.
  if (value !== seen) {
    setSeen(value);
    if (value !== pushed) {
      setPushed(value);
      setText(value);
    }
  }

  useEffect(() => {
    const next = cleanQuery(text);
    if (next === pushed) return;
    const timer = setTimeout(() => {
      setPushed(next);
      onSearch(next);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, pushed, onSearch]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = cleanQuery(text);
    if (next === pushed) return;
    setPushed(next);
    onSearch(next);
  };

  return (
    <form onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor={id}>{SEARCH_LABEL}</FieldLabel>
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={id}
            type="search"
            size="lg"
            autoComplete="off"
            placeholder={SEARCH_PLACEHOLDER}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="pl-9"
          />
        </div>
      </Field>
    </form>
  );
}
