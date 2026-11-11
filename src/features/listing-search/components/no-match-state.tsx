import { SearchXIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import type { ListingSearch } from "../schemas/search-params";
import { listingsHref, withoutFilters, withoutKeyword } from "../search-href";
import { hasFilters, hasKeyword } from "../search-state";
import { noMatchHint } from "../text";

/**
 * What the results area says when a search with a keyword, a filter or both finds nothing (spec
 * 0016, AC-14). The hint names what is set, "Xóa bộ lọc" shows only when a filter is on, and "Xóa
 * tìm kiếm" only when there is a keyword. Each is a real link to page 1. The caller only draws
 * this for a search that has one of the two: an empty list with neither is another state.
 */
export function NoMatchState({ search }: { search: ListingSearch }) {
  const keyword = hasKeyword(search);
  const filters = hasFilters(search);

  return (
    <EmptyState
      icon={SearchXIcon}
      title="Không có tin nào phù hợp"
      description={noMatchHint(keyword, filters)}
      action={
        <>
          {filters && (
            <Button asChild variant="outline" size="lg">
              <Link href={listingsHref(withoutFilters(search))}>
                Xóa bộ lọc
              </Link>
            </Button>
          )}
          {keyword && (
            <Button asChild variant="outline" size="lg">
              <Link href={listingsHref(withoutKeyword(search))}>
                Xóa tìm kiếm
              </Link>
            </Button>
          )}
        </>
      }
    />
  );
}
