import { BookOpenIcon, HouseIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { landlordListingsHref } from "../landlord-id";

/** The landlord has no visible listing (api-for-frontend.md, section 7, "Hồ sơ chủ trọ", step 4). */
export function NoListings() {
  return (
    <EmptyState
      icon={HouseIcon}
      title="Chủ trọ chưa có tin nào đang hiện"
      description="Hãy quay lại sau, chủ trọ có thể sẽ đăng tin mới."
    />
  );
}

/**
 * A page past the last one: the API answers it with no rows. It offers the way back to the last
 * page, and the pagination under it keeps the links.
 */
export function PastLastPage({
  landlordId,
  lastPage,
}: {
  landlordId: string;
  lastPage: number;
}) {
  return (
    <EmptyState
      icon={BookOpenIcon}
      title="Trang này không có tin"
      action={
        <Button asChild variant="outline" size="lg">
          <Link href={landlordListingsHref(landlordId, lastPage)}>
            Xem trang cuối
          </Link>
        </Button>
      }
    />
  );
}
