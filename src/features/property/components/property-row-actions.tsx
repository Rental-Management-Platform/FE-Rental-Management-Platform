"use client";

import { FilePlusCornerIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Can } from "@/components/can";
import {
  DetailItem,
  DetailList,
  RowDetail,
} from "@/components/detail/row-detail";
import { Button } from "@/components/ui/button";
import type { PropertyListItem } from "@/lib/api/types";
import { formatCount, formatDateTime } from "@/lib/format";
import { MY_LISTINGS_PATH } from "@/features/listing/listing-filter";
import { editPropertyHref, postListingHref } from "../property-list";

interface PropertyRowActionsProps {
  property: PropertyListItem;
  /** `sm` is the dense desktop row (32 px). `lg` is the phone block (44 px). */
  size: "sm" | "lg";
  onDelete: (property: PropertyListItem) => void;
}

const DETAIL_TITLE = "Chi tiết nhà trọ";
const CANNOT_DELETE =
  "Chưa xóa được nhà trọ này. Hãy xóa các tin của nhà trọ này trước.";

/**
 * "Xem chi tiết" of one property (spec 0019): everything the row leaves out. A property that still
 * has listings cannot be deleted, so its delete button is off and this is where the reason is read,
 * with the way to "Tin của tôi". Only a person who may delete a property is told why.
 */
function PropertyDetail({
  property,
  size,
}: {
  property: PropertyListItem;
  size: "sm" | "lg";
}) {
  const hasListings = property.listingCount > 0;
  const pinned = property.latitude !== null || property.longitude !== null;
  return (
    <RowDetail
      name={`nhà trọ ${property.name}`}
      title={DETAIL_TITLE}
      size={size}
      iconOnly
    >
      <DetailList>
        <DetailItem label="Nhà trọ">{property.name}</DetailItem>
        <DetailItem label="Địa chỉ">{property.fullAddress}</DetailItem>
        <DetailItem label="Số tin">
          {formatCount(property.listingCount)}
        </DetailItem>
        <DetailItem label="Ngày tạo">
          {formatDateTime(property.createdAt)}
        </DetailItem>
        <DetailItem label="Vị trí trên bản đồ">
          {pinned ? "Đã ghim vị trí" : "Chưa ghim vị trí"}
        </DetailItem>
        {hasListings && (
          <Can permission="property:delete">
            <DetailItem label="Xóa nhà trọ">
              {CANNOT_DELETE}{" "}
              <Link
                href={MY_LISTINGS_PATH}
                className="rounded-sm font-medium text-foreground underline underline-offset-3 outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Tin của tôi
              </Link>
            </DetailItem>
          </Can>
        )}
      </DetailList>
    </RowDetail>
  );
}

/**
 * The actions of one property (spec 0019, AC-11, AC-12, AC-18): "Đăng tin", "Sửa", "Xóa" and "Xem
 * chi tiết". One component for the table and for the phone block, so the two cannot disagree. A
 * property that still has listings cannot be deleted, so its delete button is off. The reason is not
 * written on the row: a screen reader hears it from the button, and everyone reads it in "Xem chi
 * tiết". The backend still decides (a 409 is handled). Each button hides when the person lacks its
 * permission.
 */
export function PropertyRowActions({
  property,
  size,
  onDelete,
}: PropertyRowActionsProps) {
  const reasonId = useId();
  const iconSize = size === "lg" ? "icon-lg" : "icon-sm";
  const hasListings = property.listingCount > 0;

  return (
    <div className="flex items-center gap-1">
      <Can permission="listing:create">
        <Button asChild variant="outline" size={size}>
          <Link
            href={postListingHref(property.id)}
            aria-label={`Đăng tin cho nhà trọ ${property.name}`}
          >
            <FilePlusCornerIcon data-icon="inline-start" aria-hidden="true" />
            Đăng tin
          </Link>
        </Button>
      </Can>
      <Can permission="property:update">
        <Button asChild variant="ghost" size={iconSize}>
          <Link
            href={editPropertyHref(property.id)}
            aria-label={`Sửa nhà trọ ${property.name}`}
          >
            <PencilIcon aria-hidden="true" />
          </Link>
        </Button>
      </Can>
      <PropertyDetail property={property} size={size} />
      <Can permission="property:delete">
        <Button
          type="button"
          variant="ghost"
          size={iconSize}
          disabled={hasListings}
          aria-label={`Xóa nhà trọ ${property.name}`}
          aria-describedby={hasListings ? reasonId : undefined}
          onClick={() => onDelete(property)}
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
        {hasListings && (
          <span id={reasonId} className="sr-only">
            {CANNOT_DELETE}
          </span>
        )}
      </Can>
    </div>
  );
}
