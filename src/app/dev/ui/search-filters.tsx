"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterSheet } from "@/features/listing-search/components/filter-sheet";
import { NoMatchState } from "@/features/listing-search/components/no-match-state";
import { PriceFields } from "@/features/listing-search/components/price-fields";
import { PriceRangeNotice } from "@/features/listing-search/components/price-range-notice";
import {
  SearchBoxFallback,
  SearchBoxView,
} from "@/features/listing-search/components/search-box";
import { SortLinks } from "@/features/listing-search/components/sort-links";
import {
  draftFromSearch,
  filterFormSchema,
  searchFromFilterForm,
  type FilterFormInput,
  type FilterFormValues,
} from "@/features/listing-search/filter-form";
import {
  LISTING_SORTS,
  type ListingSearch,
} from "@/features/listing-search/schemas/search-params";
import {
  listingsHref,
  withoutFilters,
} from "@/features/listing-search/search-href";
import { hasFilters } from "@/features/listing-search/search-state";
import { SORT_LABELS } from "@/features/listing-search/text";
import { useReturnFocus } from "@/lib/use-return-focus";
import { Labeled, Section } from "./section";
import {
  PRICE_MISTAKES,
  SAMPLE_CATALOG,
  SEARCH_FILTERED,
  SEARCH_KEYWORD,
  SEARCH_KEYWORD_ONLY,
  SEARCH_PLAIN,
  SEARCH_REVERSED,
  SEARCH_UNKNOWN_WARD,
} from "./search-filters-sample";

// The ward box reads the catalog through the shared `["wards"]` query. These samples give it the
// fake catalog as `initialWards`, and a query client of their own, so the fake wards never reach
// the cache the real pages use and no call to `GET /wards` is made. With Cache Components Next
// also prerenders Client Components, and TanStack Query reads the current time when it makes an
// active query, so the samples sit behind a <Suspense> (see `SearchFiltersSection`): without one
// the route fails with the current-time prerender error.
function SampleQueries({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const BAR_CASES = [
  { id: "plain", label: "Chưa lọc", search: SEARCH_PLAIN },
  { id: "filtered", label: "Phường và khoảng giá", search: SEARCH_FILTERED },
  {
    id: "keyword",
    label: "Từ khóa, phường, giá từ, giá tăng dần",
    search: SEARCH_KEYWORD,
  },
  { id: "unknown", label: "Mã phường lạ", search: SEARCH_UNKNOWN_WARD },
] as const;

type BarCaseId = (typeof BAR_CASES)[number]["id"];

// The live bar of the page on fake searches. Choosing a case plays the part of the address
// changing, so the draft is set again as it is on the page. A valid send does not leave: it shows
// the address it would go to and holds the buttons, as `isPending` does, until the page "arrives".
// Keep this the first copy of the filter boxes on the page: the bar finds a box by looking for the
// first visible copy in the whole document, to put focus on a mistake.
function BarDemo() {
  const [caseId, setCaseId] = useState<BarCaseId>("filtered");
  const [sent, setSent] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const current = BAR_CASES.find(({ id }) => id === caseId) ?? BAR_CASES[0];

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label="Địa chỉ đang áp dụng của thanh mẫu"
        className="flex flex-wrap gap-2"
      >
        {BAR_CASES.map(({ id, label }) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={id === caseId ? "default" : "outline"}
            aria-pressed={id === caseId}
            onClick={() => {
              setCaseId(id);
              setSent(null);
              setPending(false);
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <Card>
        <CardContent>
          <SearchBoxView
            search={current.search}
            initialWards={SAMPLE_CATALOG}
            pending={pending}
            onNavigate={(target) => {
              setSent(target);
              setPending(true);
            }}
          />
        </CardContent>
      </Card>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <p>
          Địa chỉ đang áp dụng:{" "}
          <code className="break-all">{listingsHref(current.search)}</code>
        </p>
        <p>
          Địa chỉ khi gửi:{" "}
          <code className="break-all">{sent ?? "(chưa gửi)"}</code>
        </p>
        {pending && (
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPending(false)}
            >
              Cho trang tải xong
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Two price boxes holding a mistake. The errors show after a first send, as on the page (spec
// 0016, AC-8), so the sample sends once when it mounts. `shouldFocusError` is off, or loading the
// gallery would scroll to this box. Typing then checks again on every key.
function PriceMistakeDemo({
  label,
  minPrice,
  maxPrice,
}: {
  label: string;
  minPrice: string;
  maxPrice: string;
}) {
  const form = useForm<FilterFormInput, unknown, FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: { q: "", wardCode: "", minPrice, maxPrice },
    shouldFocusError: false,
  });
  const { handleSubmit } = form;

  useEffect(() => {
    void handleSubmit(
      () => undefined,
      () => undefined,
    )();
  }, [handleSubmit]);

  return (
    <Labeled label={label}>
      <Card>
        <CardContent>
          <PriceFields control={form.control} />
        </CardContent>
      </Card>
    </Labeled>
  );
}

// The sheet of the phone layout, opened by a button of its own so it shows at any width (on the
// page the "Bộ lọc" button is only there below `md`). It does what the bar does with its sheet:
// closing without "Áp dụng" puts the boxes back to the applied search, a valid send closes it and
// shows the address, an invalid one keeps it open and puts focus on the first wrong box (the
// default of React Hook Form, since there is one copy of each box here).
function SheetDemo({
  label,
  search,
}: {
  label: string;
  search: ListingSearch;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { remember, onCloseAutoFocus } = useReturnFocus(() => trigger.current);
  const form = useForm<FilterFormInput, unknown, FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: draftFromSearch(search),
  });
  const { reset } = form;
  const submit = form.handleSubmit((values) => {
    setSent(listingsHref(searchFromFilterForm(values, search.sort)));
    setOpen(false);
  });

  return (
    <Labeled label={label}>
      <div className="flex flex-col items-start gap-2">
        <Button
          ref={trigger}
          type="button"
          variant="outline"
          size="lg"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            remember();
            setOpen(true);
          }}
        >
          Mở ngăn bộ lọc
        </Button>
        <p className="text-sm text-muted-foreground">
          Địa chỉ khi gửi:{" "}
          <code className="break-all">{sent ?? "(chưa gửi)"}</code>
        </p>
      </div>
      <FilterSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) reset(draftFromSearch(search));
          setOpen(next);
        }}
        onCloseAutoFocus={onCloseAutoFocus}
        control={form.control}
        initialWards={SAMPLE_CATALOG}
        onSubmit={submit}
        clearHref={
          hasFilters(search) ? listingsHref(withoutFilters(search)) : null
        }
        onClear={() => setOpen(false)}
        pending={false}
        focusField={null}
      />
    </Labeled>
  );
}

// The search filters of spec 0016 on fake data, with no network call: the live bar of the page
// (`SearchBoxView`), the first-visit fallback, the price boxes with each mistake, the phone sheet,
// the notice for a price range turned the wrong way, the three order links and the empty states.
// The bar and the sheet change with the width of the window: from `lg` the bar is one row, at `md`
// two rows, and below `md` the card only has the keyword box and two buttons.
export function SearchFiltersSection() {
  return (
    <SampleQueries>
      <Suspense fallback={<Skeleton aria-hidden className="h-96" />}>
        <Section
          bare
          title="Bộ lọc tìm tin: thanh tìm kiếm"
          description="Thanh thật của trang tìm tin, nhận địa chỉ giả thay cho địa chỉ trình duyệt. Đổi bề ngang cửa sổ để thấy ba bố cục: một hàng từ 1024 px, hai hàng từ 768 px, và dưới 768 px chỉ có ô từ khóa với hai nút (bấm “Bộ lọc” để mở ngăn). Chọn một trường hợp để giả làm địa chỉ đổi: các thẻ bên dưới thanh là liên kết thật, bấm sẽ mở trang tìm tin. Gửi hợp lệ không rời trang này, chỉ hiện địa chỉ sẽ đến."
        >
          <div className="flex flex-col gap-8">
            <Labeled label="thanh sống · chọn trường hợp, gõ giá sai rồi bấm “Tìm trọ”">
              <BarDemo />
            </Labeled>
            <Labeled label="bản dự phòng · lần vào đầu và khi tắt JavaScript (form GET, bấm “Tìm trọ” sẽ mở trang tìm tin)">
              <Card>
                <CardContent>
                  <SearchBoxFallback />
                </CardContent>
              </Card>
            </Labeled>
          </div>
        </Section>

        <Section
          bare
          title="Bộ lọc tìm tin: ô giá và ngăn bộ lọc"
          description="Hai ô giá chỉ nhận chữ số và báo lỗi sau lần gửi đầu, rồi kiểm lại khi gõ. Ngăn bộ lọc trượt từ dưới lên, chân ngăn dính đáy; mở ngăn rồi bấm ô phường để thấy danh sách phường mở ngay trong ngăn và cuộn được. Esc hoặc chạm ra ngoài thì ba ô về giá trị đang áp dụng."
        >
          <div className="flex flex-col gap-8">
            <div className="grid gap-6 md:grid-cols-3">
              {PRICE_MISTAKES.map((mistake) => (
                <PriceMistakeDemo key={mistake.label} {...mistake} />
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <SheetDemo
                label="ngăn bộ lọc · chưa có bộ lọc, chân ngăn chỉ có “Áp dụng”"
                search={SEARCH_PLAIN}
              />
              <SheetDemo
                label="ngăn bộ lọc · đang có bộ lọc, thêm “Xóa bộ lọc”"
                search={SEARCH_FILTERED}
              />
            </div>
          </div>
        </Section>

        <Section
          bare
          title="Bộ lọc tìm tin: kết quả"
          description="Phần dưới thanh tìm kiếm: lời báo khoảng giá ngược (trang không gọi API ở trạng thái này), ba liên kết sắp xếp và các trạng thái trống. Tất cả là liên kết thật về trang 1."
        >
          <div className="flex flex-col gap-8">
            <Labeled label="khoảng giá ngược · gõ tay trên địa chỉ">
              <div className="flex flex-col gap-4">
                <p className="text-lg font-semibold">Kết quả tìm kiếm</p>
                <PriceRangeNotice search={SEARCH_REVERSED} />
              </div>
            </Labeled>

            <div className="grid gap-6 md:grid-cols-3">
              {LISTING_SORTS.map((sort) => (
                <Labeled
                  key={sort}
                  label={`sắp xếp · ${SORT_LABELS[sort]} đang chọn`}
                >
                  <SortLinks search={{ ...SEARCH_FILTERED, sort }} />
                </Labeled>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Labeled label="trống · chỉ bộ lọc">
                <NoMatchState search={SEARCH_FILTERED} />
              </Labeled>
              <Labeled label="trống · từ khóa và bộ lọc">
                <NoMatchState search={SEARCH_KEYWORD} />
              </Labeled>
              <Labeled label="trống · chỉ từ khóa">
                <NoMatchState search={SEARCH_KEYWORD_ONLY} />
              </Labeled>
            </div>
          </div>
        </Section>
      </Suspense>
    </SampleQueries>
  );
}
