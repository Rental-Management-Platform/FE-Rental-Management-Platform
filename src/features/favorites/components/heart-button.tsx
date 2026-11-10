"use client";

import { HeartIcon, RotateCwIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { HeartView } from "../favorite-view";

/** `icon` is the bare heart on a card. `labeled` is the heart with a word, in the page header. */
export type HeartShape = "icon" | "labeled";

type HeartButtonProps = {
  view: HeartView;
  shape: HeartShape;
  /** The title of the listing, so each heart on a page of cards has its own name. */
  title: string;
  /** A save or an unsave is in flight. */
  pending: boolean;
  /** In flight, or counting down after a 429: a press does nothing. */
  locked: boolean;
  /** What a screen reader hears after a success, or "". Never carries personal data. */
  announcement: string;
  signInHref: string;
  onToggle: () => void;
  onRetry: () => void;
};

// A saved heart is filled in the primary color. The shape changes too, so the state is never
// colour alone.
const SAVED_ICON = "fill-primary text-primary";

/**
 * Draws one `HeartView` (api-for-frontend.md, 6.33), so `/dev/ui` can show every state with no
 * session and no network.
 *
 * It sits above the stretched link of a card (`z-10`), so a press on the heart never opens the
 * listing. While a call is in flight, and while a 429 counts down, the button is locked with
 * `aria-disabled` and not `disabled`, so focus stays on it. On a card the button keeps one name
 * ("Lưu tin: <title>") and says the state with `aria-pressed`. With a word, the word changes
 * ("Lưu tin" and "Đã lưu") and there is no `aria-pressed`, so the name always matches what is
 * written on the button.
 */
export function HeartButton({
  view,
  shape,
  title,
  pending,
  locked,
  announcement,
  signInHref,
  onToggle,
  onRetry,
}: HeartButtonProps) {
  // Nothing at all, so a card or a header does not keep an empty space for it.
  if (view.kind === "hidden") return null;

  const labeled = shape === "labeled";
  const size = labeled ? "lg" : "icon-lg";
  const variant = labeled ? "outline" : "ghost";

  return (
    <div className="relative z-10 flex">
      {/* Always mounted, so the text that arrives later is read out. */}
      <span role="status" className="sr-only">
        {announcement}
      </span>

      {view.kind === "checking" && (
        <>
          {/* With scripts off the session never resolves, so the skeleton hides. A heart on a
              card is not worth a link each; the header has the stand in below. */}
          <Skeleton
            aria-hidden="true"
            className={
              labeled
                ? "h-11 w-28 rounded-lg noscript:hidden"
                : "size-11 rounded-lg noscript:hidden"
            }
          />
          {labeled && (
            <noscript>
              <GuestLink href={signInHref} labeled title={title} />
            </noscript>
          )}
        </>
      )}

      {view.kind === "guest" && (
        <GuestLink href={signInHref} labeled={labeled} title={title} />
      )}

      {view.kind === "ready" && (
        <Button
          type="button"
          size={size}
          variant={variant}
          disabled={!view.canChange}
          aria-disabled={locked || undefined}
          aria-busy={pending}
          aria-pressed={labeled ? undefined : view.saved}
          aria-label={labeled ? undefined : `Lưu tin: ${title}`}
          onClick={() => {
            if (!locked) onToggle();
          }}
        >
          {pending ? (
            <Spinner size="sm" />
          ) : (
            <HeartIcon
              data-icon={labeled ? "inline-start" : undefined}
              aria-hidden="true"
              className={view.saved ? SAVED_ICON : undefined}
            />
          )}
          {labeled && (view.saved ? "Đã lưu" : "Lưu tin")}
        </Button>
      )}

      {view.kind === "failed" && (
        <Button
          type="button"
          size={size}
          variant={variant}
          aria-label="Chưa lấy được trạng thái lưu tin. Bấm để thử lại."
          onClick={onRetry}
        >
          <RotateCwIcon
            data-icon={labeled ? "inline-start" : undefined}
            aria-hidden="true"
          />
          {labeled && "Thử lại"}
        </Button>
      )}
    </div>
  );
}

// The heart of a guest: a plain link to sign in, which also comes back to this page. The same
// block is the `noscript` stand in, so it is a link and not a button.
function GuestLink({
  href,
  labeled,
  title,
}: {
  href: string;
  labeled: boolean;
  title: string;
}) {
  return (
    <Button
      asChild
      size={labeled ? "lg" : "icon-lg"}
      variant={labeled ? "outline" : "ghost"}
    >
      <Link
        href={href}
        aria-label={labeled ? undefined : `Đăng nhập để lưu tin: ${title}`}
      >
        <HeartIcon
          data-icon={labeled ? "inline-start" : undefined}
          aria-hidden="true"
        />
        {labeled && "Lưu tin"}
      </Link>
    </Button>
  );
}
