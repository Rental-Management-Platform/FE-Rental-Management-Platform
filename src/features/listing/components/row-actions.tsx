"use client";

import {
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { Can } from "@/components/can";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { OwnerListingSummary } from "@/lib/api/types";
import { listingPath } from "@/lib/listing-path";
import { useCountdown } from "@/lib/use-countdown";
import { editListingHref } from "../listing-filter";
import type { RowUi } from "../row-ui";
import { ListingRowDetail } from "./listing-row-detail";

interface RowActionsProps {
  listing: OwnerListingSummary;
  ui: RowUi;
  /** `sm` is the dense desktop row (32 px). `lg` is the phone block (44 px). */
  size: "sm" | "lg";
  onToggle: (listing: OwnerListingSummary) => void;
  onDelete: (listing: OwnerListingSummary) => void;
}

/**
 * The buttons of one row (spec 0019, AC-5, AC-9, AC-18). One component for the table and for the
 * phone block, so the two cannot disagree. While a write runs, and while a 429 counts down, the
 * toggle is locked with `aria-disabled` and not `disabled`, so focus stays on it. The toggle is
 * one button that changes its label, so focus is still on it when the row changes. Each button
 * hides when the person lacks its permission; the backend still decides.
 */
export function RowActions({
  listing,
  ui,
  size,
  onToggle,
  onDelete,
}: RowActionsProps) {
  const waiting =
    useCountdown(ui.notice?.kind === "rate-limited" ? ui.notice.error : null) >
    0;
  const locked = ui.pending || waiting;
  const hiding = listing.status === "visible";
  const iconSize = size === "lg" ? "icon-lg" : "icon-sm";

  return (
    // The dense row keeps its buttons on one line; the phone block may wrap them.
    <div
      className={
        size === "sm"
          ? "flex items-center gap-1"
          : "flex flex-wrap items-center gap-1"
      }
    >
      <Can permission="listing:update">
        {/* A listing an admin hid has no toggle: the owner cannot show it again, and "Xem chi
            tiết" says why and how to get it back. */}
        {listing.status !== "hidden_by_admin" && (
          <Button
            type="button"
            variant="outline"
            size={size}
            aria-disabled={locked || undefined}
            aria-busy={ui.pending}
            aria-label={`${hiding ? "Ẩn" : "Hiện"} tin ${listing.title}`}
            className="aria-disabled:opacity-60"
            onClick={() => {
              if (!locked) onToggle(listing);
            }}
          >
            {ui.pending ? (
              <Spinner size="sm" />
            ) : hiding ? (
              <EyeOffIcon data-icon="inline-start" aria-hidden="true" />
            ) : (
              <EyeIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {hiding ? "Ẩn" : "Hiện"}
          </Button>
        )}
        <Button asChild variant="ghost" size={iconSize}>
          <Link
            href={editListingHref(listing.id)}
            aria-label={`Sửa tin ${listing.title}`}
          >
            <PencilIcon aria-hidden="true" />
          </Link>
        </Button>
      </Can>
      {/* A page guests cannot open is not offered (AC-9). */}
      {listing.isPublic && (
        <Button asChild variant="ghost" size={iconSize}>
          <Link
            href={listingPath(listing.slug, listing.code)}
            aria-label={`Xem trang công khai của tin ${listing.title}`}
          >
            <ExternalLinkIcon aria-hidden="true" />
          </Link>
        </Button>
      )}
      <ListingRowDetail listing={listing} size={size} />
      <Can permission="listing:delete">
        <Button
          type="button"
          variant="ghost"
          size={iconSize}
          aria-label={`Xóa tin ${listing.title}`}
          onClick={() => onDelete(listing)}
        >
          <Trash2Icon aria-hidden="true" />
        </Button>
      </Can>
    </div>
  );
}
