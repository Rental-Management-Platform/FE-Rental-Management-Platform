"use client";

import { FilePlusCornerIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { Can } from "@/components/can";
import { Button } from "@/components/ui/button";
import type { PropertyListItem } from "@/lib/api/types";
import { MY_LISTINGS_PATH } from "@/features/listing/listing-filter";
import { editPropertyHref, postListingHref } from "../property-list";

interface PropertyRowActionsProps {
  property: PropertyListItem;
  /** `sm` is the dense desktop row (32 px). `lg` is the phone block (44 px). */
  size: "sm" | "lg";
  onDelete: (property: PropertyListItem) => void;
}

/**
 * The three actions of one property (spec 0019, AC-11, AC-12, AC-18): "Đăng tin", "Sửa" and
 * "Xóa". One component for the table and for the phone block, so the two cannot disagree. A
 * property that still has listings cannot be deleted, so its delete button is off and the line
 * next to it says why and leads to "Tin của tôi". The backend still decides (a 409 is handled).
 * Each button hides when the person lacks its permission.
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
    <div className="flex flex-col items-start gap-2">
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
        </Can>
      </div>
      {hasListings && (
        <Can permission="property:delete">
          <p
            id={reasonId}
            className="max-w-56 text-sm whitespace-normal text-muted-foreground"
          >
            Hãy xóa các tin của nhà trọ này trước.{" "}
            <Link
              href={MY_LISTINGS_PATH}
              className="rounded-sm font-medium text-foreground underline underline-offset-3 outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Tin của tôi
            </Link>
          </p>
        </Can>
      )}
    </div>
  );
}
