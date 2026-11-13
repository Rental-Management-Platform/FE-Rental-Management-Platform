"use client";

import { EyeIcon, EyeOffIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import { Can } from "@/components/can";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { OwnerListingSummary } from "@/lib/api/types";
import { useCountdown } from "@/lib/use-countdown";
import { editListingHref } from "../listing-filter";
import type { RowUi } from "../row-ui";

interface RowActionsProps {
  listing: OwnerListingSummary;
  ui: RowUi;
  /** `sm` is the dense desktop row (32 px). `lg` is the phone block (44 px). */
  size: "sm" | "lg";
  onToggle: (listing: OwnerListingSummary) => void;
}

/**
 * The buttons of one row (spec 0019, AC-5, AC-9). One component for the table and for the phone
 * block, so the two cannot disagree. While a write runs, and while a 429 counts down, the toggle
 * is locked with `aria-disabled` and not `disabled`, so focus stays on it. The toggle is one
 * button that changes its label, so focus is still on it when the row changes.
 */
export function RowActions({ listing, ui, size, onToggle }: RowActionsProps) {
  const waiting =
    useCountdown(ui.notice?.kind === "rate-limited" ? ui.notice.error : null) >
    0;
  const locked = ui.pending || waiting;
  const hiding = listing.status === "visible";
  const iconSize = size === "lg" ? "icon-lg" : "icon-sm";

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Can permission="listing:update">
        {listing.status === "hidden_by_admin" ? (
          <p className="max-w-48 text-sm whitespace-normal text-muted-foreground">
            Liên hệ quản trị viên để tin được hiện lại.
          </p>
        ) : (
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
    </div>
  );
}
