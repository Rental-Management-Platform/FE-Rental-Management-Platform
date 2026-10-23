import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// How many page links fit in one row. A phone row has room for the arrows and a short
// "Trang 3/10" text, so the numbered links start at `sm`.
const SLOTS = 7;

type PageToken = number | "gap-start" | "gap-end";

const NUMBER = new Intl.NumberFormat("vi-VN");

// Always seven slots, whatever the page count: first and last, the current page with its
// neighbors, and a gap where pages are skipped. Seven pages or fewer list every page.
function pageTokens(current: number, count: number): PageToken[] {
  if (count <= SLOTS) return Array.from({ length: count }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "gap-end", count];
  if (current >= count - 3) {
    return [1, "gap-start", count - 4, count - 3, count - 2, count - 1, count];
  }
  return [1, "gap-start", current - 1, current, current + 1, "gap-end", count];
}

type ListPaginationProps = {
  /** From the list answer: `{ items, total, page, pageSize }` (api-for-frontend.md, section 2). */
  page: number;
  pageSize: number;
  total: number;
  /** What the rows are called ("tin", "người dùng"). Adds "Hiển thị 21–40 trong 137 tin". */
  itemLabel?: string;
  /** `lg` makes every control 44 px high, for public pages. */
  size?: "default" | "lg";
  className?: string;
} & (
  | {
      /** The page is in the URL: each page is a real link. */
      hrefFor: (page: number) => string;
      onPageChange?: never;
    }
  | {
      /** The page is in state: each page is a button. */
      onPageChange: (page: number) => void;
      hrefFor?: never;
    }
);

// Page links for a list answer. A page past the last one (the API answers it with no rows) keeps
// the last page's links and only the "previous" arrow.
export function ListPagination({
  page,
  pageSize,
  total,
  itemLabel,
  size = "default",
  className,
  ...mode
}: ListPaginationProps) {
  const pageCount = Math.ceil(total / pageSize);
  if (!Number.isFinite(pageCount) || pageCount <= 1) return null;

  const current = Math.min(Math.max(page, 1), pageCount);
  const hasPrevious = page > 1;
  const hasNext = page < pageCount;
  const linkSize = size === "lg" ? "icon-lg" : "icon";
  const arrowSize = size === "lg" ? "lg" : "default";

  const target = (to: number) =>
    mode.hrefFor !== undefined
      ? { as: Link, href: mode.hrefFor(to) }
      : {
          as: "button" as const,
          type: "button" as const,
          onClick: () => mode.onPageChange?.(to),
        };
  // An arrow with nowhere to go is a disabled button, so it leaves the tab order.
  const arrow = (to: number, enabled: boolean) =>
    enabled
      ? target(to)
      : { as: "button" as const, type: "button" as const, disabled: true };

  const from = (page - 1) * pageSize + 1;
  const until = Math.min(page * pageSize, total);
  const showSummary = itemLabel !== undefined && page <= pageCount;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 sm:flex-row sm:justify-between",
        className,
      )}
    >
      {showSummary && (
        <p className="text-sm text-muted-foreground">
          Hiển thị {NUMBER.format(from)}–{NUMBER.format(until)} trong{" "}
          {NUMBER.format(total)} {itemLabel}
        </p>
      )}
      <Pagination className="mx-0 w-auto sm:ml-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              size={arrowSize}
              {...arrow(Math.min(page - 1, pageCount), hasPrevious)}
            />
          </PaginationItem>
          {pageTokens(current, pageCount).map((token) =>
            typeof token === "number" ? (
              <PaginationItem key={token} className="hidden sm:block">
                <PaginationLink
                  size={linkSize}
                  isActive={token === page}
                  aria-label={`Trang ${token}`}
                  {...target(token)}
                >
                  {NUMBER.format(token)}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={token} className="hidden sm:block">
                <PaginationEllipsis />
              </PaginationItem>
            ),
          )}
          <li className="px-2 text-sm text-muted-foreground sm:hidden">
            Trang {current}/{pageCount}
          </li>
          <PaginationItem>
            <PaginationNext
              size={arrowSize}
              {...arrow(Math.max(page, 0) + 1, hasNext)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
