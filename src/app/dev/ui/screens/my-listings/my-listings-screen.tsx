"use client";

import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  PencilIcon,
  PlusIcon,
  ShieldAlertIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ImagePlaceholder } from "@/components/states/image-placeholder";
import { WorkspaceShell } from "@/components/shells/workspace-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ListingStatus, OwnerListingSummary } from "@/lib/api/types";
import { useReturnFocus } from "@/lib/use-return-focus";
import {
  OWNER_LISTINGS,
  SAMPLE_MEMBERSHIP,
  withPublicFlag,
} from "../sample-data";
import {
  formatArea,
  formatCount,
  formatDateTime,
  formatMoney,
} from "../sample-format";
import { SampleControls } from "../sample-state";
import { LANDLORD_SCREENS_NAV, SCREENS_HOME } from "../screens";

type Filter = "all" | ListingStatus;

// The tabs are the `status` query of `GET /me/listings`, plus "all".
const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "visible", label: "Đang hiện" },
  { value: "hidden_by_owner", label: "Bạn đã ẩn" },
  { value: "hidden_by_admin", label: "Admin đã ẩn" },
];

const POST_HREF = `${SCREENS_HOME}/post-listing`;
const PRICING_HREF = `${SCREENS_HOME}/pricing`;

function QuotaNotice({ visible }: { visible: number }) {
  const { listingLimit, trialDaysLeft } = SAMPLE_MEMBERSHIP;
  const over = Math.max(0, visible - listingLimit);

  if (over === 0) {
    return (
      <Alert variant="info">
        <InfoIcon />
        <AlertTitle>
          Đang hiện {visible} trên {listingLimit} tin được phép
        </AlertTitle>
        <AlertDescription>Dùng thử còn {trialDaysLeft} ngày.</AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="warning">
      <TriangleAlertIcon />
      <AlertTitle>
        {over} tin đang bị ẩn bớt khỏi khách vì vượt hạn mức
      </AlertTitle>
      <AlertDescription>
        <p>
          Hạn mức hiện cho {listingLimit} tin cùng lúc, còn bạn có {visible} tin
          đang hiện. Dùng thử còn {trialDaysLeft} ngày. Mua gói hoặc ẩn bớt một
          tin để các tin còn lại hiện với khách.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href={PRICING_HREF}>Xem bảng giá</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// A status is always words with an icon. `visible` splits in two: shown to guests, or held back
// because the landlord is past the listing limit (api-for-frontend.md, 6.21).
function StatusCell({ listing }: { listing: OwnerListingSummary }) {
  if (listing.status === "visible" && listing.isPublic) {
    return (
      <Badge variant="success">
        <CheckIcon data-icon="inline-start" />
        Đang hiện với khách
      </Badge>
    );
  }
  if (listing.status === "visible") {
    return (
      <div className="flex flex-col items-start gap-1">
        <Badge variant="warning">
          <TriangleAlertIcon data-icon="inline-start" />
          Bị ẩn bớt vì vượt hạn mức
        </Badge>
        <p className="max-w-56 text-xs whitespace-normal text-muted-foreground">
          Vẫn tính là đang hiện. Ẩn bớt tin khác hoặc mua gói để hiện lại.
        </p>
      </div>
    );
  }
  if (listing.status === "hidden_by_owner") {
    return (
      <Badge variant="secondary">
        <EyeOffIcon data-icon="inline-start" />
        Bạn đã ẩn
      </Badge>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant="destructive">
        <ShieldAlertIcon data-icon="inline-start" />
        Admin đã ẩn
      </Badge>
      {listing.moderationReason !== null && (
        <p className="max-w-56 text-xs whitespace-normal">
          Lý do: {listing.moderationReason}
        </p>
      )}
    </div>
  );
}

interface RowActions {
  onToggle: (listing: OwnerListingSummary) => void;
  onEdit: (listing: OwnerListingSummary) => void;
  onDelete: (listing: OwnerListingSummary) => void;
}

function ListingsTable({
  rows,
  onToggle,
  onEdit,
  onDelete,
}: { rows: readonly OwnerListingSummary[] } & RowActions) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Chưa có tin nào ở mục này"
        description="Tin của bạn sẽ hiện ở đây khi có trạng thái tương ứng."
      />
    );
  }
  return (
    <Table>
      <TableCaption className="sr-only">Danh sách tin của bạn</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Tin</TableHead>
          <TableHead className="text-right">Giá thuê</TableHead>
          <TableHead className="text-right">Lượt xem</TableHead>
          <TableHead>Ngày đăng</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((listing) => (
          <TableRow key={listing.id}>
            <TableCell className="max-w-sm">
              <div className="flex min-w-64 items-center gap-3">
                <div aria-hidden="true" className="w-16 shrink-0">
                  <ImagePlaceholder
                    ratio="4:3"
                    className="rounded-md [&_svg]:size-5"
                  />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium" title={listing.title}>
                    {listing.title}
                  </span>
                  <span
                    className="truncate text-sm text-muted-foreground"
                    title={listing.fullAddress}
                  >
                    {listing.fullAddress}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              <span className="block font-medium">
                {formatMoney(listing.price)}
              </span>
              <span className="block text-sm text-muted-foreground">
                {formatArea(listing.areaM2)}
              </span>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatCount(listing.viewCount)}
            </TableCell>
            <TableCell>{formatDateTime(listing.createdAt)}</TableCell>
            <TableCell>
              <StatusCell listing={listing} />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {listing.status === "visible" && (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Ẩn tin ${listing.title}`}
                    onClick={() => onToggle(listing)}
                  >
                    <EyeOffIcon data-icon="inline-start" />
                    Ẩn
                  </Button>
                )}
                {listing.status === "hidden_by_owner" && (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Hiện tin ${listing.title}`}
                    onClick={() => onToggle(listing)}
                  >
                    <EyeIcon data-icon="inline-start" />
                    Hiện
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Sửa tin ${listing.title}`}
                  onClick={() => onEdit(listing)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Xóa tin ${listing.title}`}
                  onClick={() => onDelete(listing)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Landlord screen (desktop first, checked at 1440): the table behind "Tin của tôi", in one zone
// on the canvas under the quota notice. Hide, show and delete change the sample rows in state,
// so the labels follow, including which listings are public once one slot is freed.
export function MyListingsScreen() {
  const [listings, setListings] =
    useState<readonly OwnerListingSummary[]>(OWNER_LISTINGS);
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingDelete, setPendingDelete] =
    useState<OwnerListingSummary | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // One dialog serves every row, so it has no trigger of its own. After a delete the row is
  // gone, so focus goes to the current status tab, just above the table.
  const tabsRef = useRef<HTMLDivElement>(null);
  const { remember, onCloseAutoFocus } = useReturnFocus(() =>
    tabsRef.current?.querySelector<HTMLElement>(
      '[role="tab"][data-state="active"]',
    ),
  );

  const limit = SAMPLE_MEMBERSHIP.listingLimit;
  const visible = listings.filter((l) => l.status === "visible").length;
  const rowsFor = (value: Filter) =>
    value === "all" ? listings : listings.filter((l) => l.status === value);

  const toggle = (listing: OwnerListingSummary) => {
    const status: ListingStatus =
      listing.status === "visible" ? "hidden_by_owner" : "visible";
    setListings((current) =>
      withPublicFlag(
        current.map((l) => (l.id === listing.id ? { ...l, status } : l)),
        limit,
      ),
    );
    toast.success(status === "visible" ? "Đã hiện tin" : "Đã ẩn tin");
  };
  const askDelete = (listing: OwnerListingSummary) => {
    remember();
    setPendingDelete(listing);
    setDeleteOpen(true);
  };
  const confirmDelete = () => {
    if (pendingDelete === null) return;
    setListings((current) =>
      withPublicFlag(
        current.filter((l) => l.id !== pendingDelete.id),
        limit,
      ),
    );
    toast.success("Đã xóa tin");
  };

  return (
    <WorkspaceShell title="Khu chủ trọ (mẫu)" items={LANDLORD_SCREENS_NAV}>
      <div className="flex flex-col gap-6">
        <SampleControls>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setListings(OWNER_LISTINGS)}
          >
            Đặt lại dữ liệu mẫu
          </Button>
        </SampleControls>

        <PageHeader
          title="Tin của tôi"
          description="Quản lý các tin đã đăng: ẩn khi hết phòng, hiện lại khi còn phòng."
          actions={
            <Button asChild size="lg">
              <Link href={POST_HREF}>
                <PlusIcon data-icon="inline-start" />
                Đăng tin mới
              </Link>
            </Button>
          }
        />

        <QuotaNotice visible={visible} />

        {/* One table zone: the status tabs are its title row, and the tab list draws the hairline
            under it. The table runs edge to edge below, with no frame of its own. */}
        <Tabs
          ref={tabsRef}
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <Card>
            <TabsList variant="line" className="px-(--card-spacing)">
              {FILTERS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value}>
                  {label}
                  <span className="text-muted-foreground tabular-nums">
                    ({rowsFor(value).length})
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {FILTERS.map(({ value }) => (
              <TabsContent
                key={value}
                value={value}
                className="focus-visible:ring-offset-0 focus-visible:ring-inset"
              >
                <ListingsTable
                  rows={rowsFor(value)}
                  onToggle={toggle}
                  onEdit={() => toast("Trang sửa tin chưa có trong bản mẫu.")}
                  onDelete={askDelete}
                />
              </TabsContent>
            ))}
          </Card>
        </Tabs>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xóa tin “{pendingDelete?.title}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tin sẽ biến khỏi trang tìm trọ và khỏi danh sách của bạn. Bạn
              không thể hoàn tác thao tác này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Giữ lại</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Xóa tin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceShell>
  );
}
