"use client";

import { PhoneIcon } from "lucide-react";
import Link from "next/link";
import { ErrorState } from "@/components/states/error-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/lib/api/errors";
import { formatPhone } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";
import { useCountdown } from "@/lib/use-countdown";
import type { ContactView } from "./contact-view";

type ContactPanelProps = {
  view: ContactView;
  /** The name from the listing, or "Chủ trọ" when the landlord has none. */
  landlordName: string;
  /** The posted date, already formatted. */
  postedAt: string;
  signInHref: string;
  registerHref: string;
  onRetry: () => void;
};

/**
 * Draws one `ContactView` (spec 0010, AC-7 to AC-9), so `/dev/ui` can show every state with no
 * session and no network. The content area is a polite live region, so a screen reader hears the
 * number appear. It never holds a phone number of its own: `ready` carries it.
 */
export function ContactPanel({
  view,
  landlordName,
  postedAt,
  signInHref,
  registerHref,
  onRetry,
}: ContactPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>
              {landlordName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <CardTitle>
              <h2 className="truncate text-base">{landlordName}</h2>
            </CardTitle>
            <CardDescription>Đăng tin ngày {postedAt}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent aria-live="polite">
        {view.kind === "checking" && (
          <>
            {/* With scripts off the session never resolves, so the skeleton hides and the
                sign in card below it stands in. */}
            <div aria-busy="true" className="noscript:hidden">
              <span className="sr-only">Đang lấy số điện thoại</span>
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <noscript>
              <GuestActions
                signInHref={signInHref}
                registerHref={registerHref}
              />
            </noscript>
          </>
        )}

        {view.kind === "guest" && (
          <GuestActions signInHref={signInHref} registerHref={registerHref} />
        )}

        {view.kind === "own" && (
          <p className="font-medium">Đây là tin của bạn.</p>
        )}

        {view.kind === "ready" && (
          <>
            <Button asChild size="lg">
              <a href={`tel:${view.phone}`}>
                <PhoneIcon data-icon="inline-start" />
                {formatPhone(view.phone)}
              </a>
            </Button>
            <p className="text-sm text-muted-foreground">
              Khi gọi, bạn hãy nói đã thấy tin này trên {SITE_NAME}.
            </p>
          </>
        )}

        {view.kind === "failed" && <Failure view={view} onRetry={onRetry} />}
      </CardContent>
    </Card>
  );
}

// The sign in button, the register link and the reason. The same block is the `noscript` stand
// in, so it uses plain links only.
function GuestActions({
  signInHref,
  registerHref,
}: {
  signInHref: string;
  registerHref: string;
}) {
  return (
    <>
      <Button asChild size="lg">
        <Link href={signInHref}>Đăng nhập để xem số điện thoại</Link>
      </Button>
      <p className="text-sm">
        <Link
          href={registerHref}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Chưa có tài khoản? Đăng ký
        </Link>
      </p>
      <p className="text-sm text-muted-foreground">
        Số điện thoại của chủ trọ chỉ hiện với người đã đăng nhập.
      </p>
    </>
  );
}

// The failures of the phone read (AC-9). Each one sits inside the card and leaves the rest of the
// page alone.
function Failure({
  view,
  onRetry,
}: {
  view: Extract<ContactView, { kind: "failed" }>;
  onRetry: () => void;
}) {
  if (view.reason === "gone") {
    return (
      <>
        <p>Tin này vừa được ẩn hoặc xóa.</p>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Xem các tin khác</Link>
        </Button>
      </>
    );
  }

  if (view.reason === "no-phone") {
    return (
      <>
        <p>Chưa lấy được số điện thoại.</p>
        <Button type="button" variant="outline" size="lg" onClick={onRetry}>
          Thử lại
        </Button>
      </>
    );
  }

  if (isApiError(view.error) && view.error.status === 429) {
    return <RateLimited error={view.error} onRetry={onRetry} />;
  }

  return (
    <ErrorState
      error={view.error}
      title="Không lấy được số điện thoại"
      onRetry={onRetry}
      className="p-0"
    />
  );
}

// A 429: the wait counts down and "Thử lại" stays off until it ends.
function RateLimited({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  return (
    <>
      <RateLimitNotice error={error} />
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onRetry}
        disabled={secondsLeft > 0}
      >
        Thử lại
      </Button>
    </>
  );
}
