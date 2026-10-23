"use client";

import { SearchIcon, SearchXIcon } from "lucide-react";
import { useState } from "react";
import { ListPagination } from "@/components/list-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListingCard } from "../listing-card";
import {
  LISTING_PAGE_SIZE,
  NO_LISTING_FILTERS,
  WARDS,
  paginate,
  queryListings,
  type ListingFilters,
  type ListingSort,
  type PriceRange,
} from "../sample-data";
import { formatCount } from "../sample-format";
import {
  SampleControls,
  StateChoice,
  StateSwitch,
  useSampleState,
  type SampleState,
} from "../sample-state";

const PRICE_OPTIONS: readonly { value: PriceRange; label: string }[] = [
  { value: "all", label: "Mọi mức giá" },
  { value: "under-2m", label: "Dưới 2 triệu" },
  { value: "2m-4m", label: "Từ 2 đến 4 triệu" },
  { value: "over-4m", label: "Trên 4 triệu" },
];

const SORT_OPTIONS: readonly { value: ListingSort; label: string }[] = [
  { value: "newest", label: "Mới đăng trước" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];

const resultsTitle = (state: SampleState, total: number) => {
  switch (state) {
    case "data":
      return `${formatCount(total)} tin phù hợp`;
    case "empty":
      return "0 tin phù hợp";
    case "loading":
      return "Đang tìm tin";
    case "error":
    case "rate-limited":
      return "Kết quả tìm kiếm";
  }
};

// Public screen: search, filters, listing cards and pagination, with `lg` (44 px) controls at
// every width. The filters work on the sample rows the way `GET /listings` would.
export function ListingsScreen() {
  const { state, select, reset, rateLimit } = useSampleState();
  const [filters, setFilters] = useState<ListingFilters>(NO_LISTING_FILTERS);
  const [page, setPage] = useState(1);

  const update = (patch: Partial<ListingFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const clearFilters = () => {
    setFilters(NO_LISTING_FILTERS);
    setPage(1);
  };

  const rows = queryListings(filters);
  const result = paginate(rows, page, LISTING_PAGE_SIZE);
  const shown: SampleState =
    state === "data" && rows.length === 0 ? "empty" : state;
  const filtered =
    filters.q.trim() !== "" ||
    filters.wardCode !== "all" ||
    filters.price !== "all";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <SampleControls>
        <StateChoice state={state} onChange={select} />
      </SampleControls>

      <header className="flex flex-col gap-2">
        <h1>Tìm phòng trọ</h1>
        <p className="max-w-2xl text-muted-foreground">
          Phòng trọ, nhà cho thuê và căn hộ mini ở Thành phố Hồ Chí Minh, do chủ
          trọ đăng trực tiếp.
        </p>
      </header>

      <form
        role="search"
        aria-label="Tìm phòng trọ"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
        }}
        className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]"
      >
        <Input
          type="search"
          size="lg"
          enterKeyHint="search"
          aria-label="Từ khóa: tên đường, phường hoặc tiêu đề tin"
          placeholder="Tên đường, phường hoặc từ khóa"
          value={filters.q}
          onChange={(event) => update({ q: event.target.value })}
          className="md:col-span-2 lg:col-span-1"
        />
        <Select
          value={filters.wardCode}
          onValueChange={(wardCode) => update({ wardCode })}
        >
          <SelectTrigger size="lg" aria-label="Phường" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả phường</SelectItem>
            {WARDS.map((ward) => (
              <SelectItem key={ward.code} value={ward.code}>
                {ward.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.price}
          onValueChange={(price) => update({ price: price as PriceRange })}
        >
          <SelectTrigger size="lg" aria-label="Mức giá" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRICE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="lg" className="md:col-span-2 lg:col-span-1">
          <SearchIcon data-icon="inline-start" />
          Tìm trọ
        </Button>
      </form>

      <section aria-labelledby="results-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="results-title"
            aria-live="polite"
            className="text-lg md:text-xl"
          >
            {resultsTitle(shown, rows.length)}
          </h2>
          <Select
            value={filters.sort}
            onValueChange={(sort) => update({ sort: sort as ListingSort })}
          >
            <SelectTrigger
              size="lg"
              aria-label="Sắp xếp"
              className="w-full sm:w-48"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <StateSwitch
          state={shown}
          rateLimit={rateLimit}
          onRetry={reset}
          loading={<LoadingState variant="cards" />}
          empty={
            <EmptyState
              icon={SearchXIcon}
              title="Không có tin nào phù hợp"
              description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc để xem thêm phòng."
              action={
                filtered ? (
                  <Button variant="outline" size="lg" onClick={clearFilters}>
                    Xóa bộ lọc
                  </Button>
                ) : undefined
              }
            />
          }
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((listing) => (
              <li key={listing.id} className="grid">
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
          <ListPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            itemLabel="tin"
            size="lg"
            onPageChange={setPage}
            className="mt-6"
          />
        </StateSwitch>
      </section>
    </div>
  );
}
