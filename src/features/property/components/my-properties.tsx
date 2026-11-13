"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, HousePlusIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Can } from "@/components/can";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/list-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePageParam } from "@/features/listing-search/schemas/search-params";
import { isApiError } from "@/lib/api/errors";
import type { PropertyListItem } from "@/lib/api/types";
import { lastPageOf } from "@/lib/pagination";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useCountdown } from "@/lib/use-countdown";
import { useReturnFocus } from "@/lib/use-return-focus";
import {
  MY_PROPERTIES_PAGE_SIZE,
  myPropertiesQuery,
} from "../api/my-properties";
import { useDeleteProperty } from "../hooks/use-delete-property";
import {
  myPropertiesHref,
  NEW_PROPERTY_PATH,
  propertiesHeading,
} from "../property-list";
import { DeletePropertyDialog } from "./delete-property-dialog";
import { PropertiesTable } from "./properties-table";
import { PropertyRowCards } from "./property-row-cards";

const HEADING_ID = "my-properties-title";

/**
 * "Nhà trọ của tôi" (scope #12, spec 0019): the landlord's own properties, 10 to a page, with
 * "Đăng tin", "Sửa" and "Xóa" on each. It runs in the browser, because the list needs a login,
 * and sits behind the route gate of the landlord. The page is the `?page=` of the address, so
 * the page reads `useSearchParams` and its route keeps it inside a `<Suspense>` boundary.
 *
 * After a delete the row is gone, so focus moves to the list heading, and the count in it is
 * read out.
 */
export function MyProperties() {
  const page = parsePageParam(useSearchParams().get("page"));
  const api = useApi();
  const router = useRouter();
  const session = useSession();
  const mayRead = can(session, "property:read");
  const query = useQuery({ ...myPropertiesQuery(api, page), enabled: mayRead });
  const { data } = query;

  const heading = useRef<HTMLHeadingElement>(null);
  const deletion = useDeleteProperty(page);
  // One dialog serves every row, so it has no trigger of its own. After a delete the row is
  // gone, so focus goes to the heading just above the rows.
  const { remember, onCloseAutoFocus } = useReturnFocus(() => heading.current);

  // A page past the last one (typed by hand, or the last row of the last page was just removed)
  // goes to the last page that has rows (AC-11, AC-4). Never while the rows on screen are the
  // ones of the page before.
  const lastPage =
    data === undefined ? 1 : lastPageOf(data.total, MY_PROPERTIES_PAGE_SIZE);
  const pastTheEnd =
    data !== undefined &&
    !query.isPlaceholderData &&
    data.total > 0 &&
    data.items.length === 0 &&
    page > lastPage;
  useEffect(() => {
    if (pastTheEnd) router.replace(myPropertiesHref(lastPage));
  }, [pastTheEnd, router, lastPage]);

  if (
    !mayRead ||
    (data === undefined &&
      isApiError(query.error) &&
      query.error.code === "PERMISSION_DENIED")
  ) {
    return <ForbiddenState message="Bạn không có quyền xem nhà trọ." />;
  }

  const askDelete = (property: PropertyListItem) => {
    remember();
    deletion.ask(property);
  };

  const renderBody = (): ReactNode => {
    if (data === undefined) {
      return query.isError ? (
        <ListFailure error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <LoadingState variant="table" />
      );
    }
    if (data.total === 0) {
      return (
        <EmptyState
          icon={HousePlusIcon}
          title="Bạn chưa có nhà trọ nào"
          description="Tạo nhà trọ đầu tiên, rồi đăng tin các phòng của bạn vào đó."
          action={
            <Can permission="property:create">
              <Button asChild size="lg">
                <Link href={NEW_PROPERTY_PATH}>Thêm nhà trọ</Link>
              </Button>
            </Can>
          }
        />
      );
    }
    if (data.items.length === 0) {
      return pastTheEnd ? (
        <LoadingState variant="table" />
      ) : (
        <EmptyState
          icon={BookOpenIcon}
          title="Trang này không có nhà trọ"
          action={
            <Button asChild variant="outline" size="lg">
              <Link href={myPropertiesHref(lastPage)}>Xem trang cuối</Link>
            </Button>
          }
        />
      );
    }
    return (
      <>
        {/* The same rows twice: a table from `md` and stacked blocks below it. The hidden one
            is `display: none`, so a screen reader reads only one. */}
        <div className="hidden md:block">
          <PropertiesTable rows={data.items} onDelete={askDelete} />
        </div>
        <div className="md:hidden">
          <PropertyRowCards rows={data.items} onDelete={askDelete} />
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nhà trọ của tôi"
        description="Mỗi nhà trọ giữ địa chỉ của các phòng bạn cho thuê. Sửa phí, tiện ích hay vị trí một lần, mọi tin của nhà trọ đó cùng đổi theo."
        actions={
          <Can permission="property:create">
            <Button asChild size="lg">
              <Link href={NEW_PROPERTY_PATH}>
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                Thêm nhà trọ
              </Link>
            </Button>
          </Can>
        }
      />

      <Card>
        <CardHeader className="border-b">
          <CardTitle>
            {/* Focus lands here after a delete, so the heading takes focus by code and has no
                ring of its own: the person did not tab to it. */}
            <h2
              id={HEADING_ID}
              ref={heading}
              tabIndex={-1}
              aria-live="polite"
              className="text-base outline-hidden"
            >
              {data === undefined ? "Nhà trọ" : propertiesHeading(data.total)}
            </h2>
          </CardTitle>
        </CardHeader>
        {renderBody()}
        {data !== undefined && data.total > MY_PROPERTIES_PAGE_SIZE && (
          <div className="border-t px-(--card-spacing) py-4">
            <ListPagination
              page={page}
              pageSize={MY_PROPERTIES_PAGE_SIZE}
              total={data.total}
              hrefFor={myPropertiesHref}
              itemLabel="nhà trọ"
            />
          </div>
        )}
      </Card>

      <DeletePropertyDialog
        name={deletion.target?.name ?? null}
        open={deletion.open}
        onOpenChange={deletion.onOpenChange}
        pending={deletion.pending}
        failure={deletion.failure}
        onConfirm={() => void deletion.confirm()}
        onCloseAutoFocus={onCloseAutoFocus}
      />
    </div>
  );
}

/** The skeleton for the route's `Suspense` fallback, drawn until the address is known. */
export function MyPropertiesSkeleton() {
  return (
    <Card>
      <LoadingState variant="table" />
    </Card>
  );
}

// A failed first read: a 429 shows the wait counting down, anything else the error. "Thử lại"
// stays off while the wait runs.
function ListFailure({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  if (isApiError(error) && error.status === 429) {
    return (
      <div className="flex flex-col items-start gap-4 px-(--card-spacing)">
        <RateLimitNotice error={error} className="w-full" />
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onRetry}
          disabled={secondsLeft > 0}
        >
          Thử lại
        </Button>
      </div>
    );
  }
  return (
    <ErrorState
      error={error}
      title="Không tải được danh sách nhà trọ"
      onRetry={onRetry}
    />
  );
}
