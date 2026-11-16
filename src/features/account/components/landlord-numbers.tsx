"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ErrorState } from "@/components/states/error-state";
import { RateLimitNotice } from "@/components/states/rate-limit-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { landlordPath } from "@/features/landlord-profile/landlord-id";
import { landlordProfileQuery } from "@/features/landlord-profile/api/landlord-queries";
import { StatFacts } from "@/features/landlord-profile/components/profile-stats";
import { isApiError } from "@/lib/api/errors";
import { useApi, useSession } from "@/lib/session/auth-provider";
import { useCountdown } from "@/lib/use-countdown";

const THREE = [0, 1, 2];

/**
 * The numbers of the landlord who is signed in (scope #38): followers, listings now visible and
 * total views, with a link to their public page. There is no new call. A landlord's id is the id
 * of their account, so this reads the public profile (api-for-frontend.md, 6.31) under the same
 * key the public page uses, and the three numbers are the ones a guest sees there.
 *
 * It is a zone of its own with its own read, so a failure here never touches the profile form or
 * the password form. The page decides who gets it: only an account whose type is `landlord`.
 *
 * The profile query keeps its answer for a minute, which is right for the public page, where a
 * follow writes the new answer in. Here a person comes back from posting or hiding a listing and
 * expects the count to have moved, so this zone reads again every time it opens (`staleTime: 0`)
 * and draws the cached numbers meanwhile. A failed read after a good one keeps the old numbers.
 */
export function LandlordNumbers({ landlordId }: { landlordId: string }) {
  const api = useApi();
  const session = useSession();
  const profile = useQuery({
    ...landlordProfileQuery(api, landlordId),
    staleTime: 0,
    enabled: session.status === "user",
  });

  const renderNumbers = () => {
    if (profile.data !== undefined) {
      return (
        <>
          <StatFacts
            followerCount={profile.data.followerCount}
            publicListingCount={profile.data.publicListingCount}
            totalViewCount={profile.data.totalViewCount}
          />
          <p className="text-sm text-muted-foreground">
            Đây là các số khách thấy ở trang công khai của bạn.
          </p>
        </>
      );
    }
    return profile.isError ? (
      <NumbersFailure
        error={profile.error}
        onRetry={() => void profile.refetch()}
      />
    ) : (
      <NumbersSkeleton />
    );
  };

  return (
    <Card role="group" aria-labelledby="landlord-numbers-title">
      <CardHeader className="border-b">
        <CardTitle>
          <h2 id="landlord-numbers-title" className="text-base">
            Số liệu của bạn
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {renderNumbers()}
        {/* The link needs no answer from the API, so it stays when the numbers fail. */}
        <div>
          {/* Full width on a phone: the label is wider than the 246 px of a 320 px screen. */}
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href={landlordPath(landlordId)}>
              Xem trang công khai của tôi
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// The shape of the three facts, so the zone does not jump when the numbers arrive.
function NumbersSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Đang tải số liệu</span>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {THREE.map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// A failed first read: a 429 shows the wait counting down, anything else the error. "Thử lại"
// stays off while the wait runs.
function NumbersFailure({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const secondsLeft = useCountdown(error);
  if (isApiError(error) && error.status === 429) {
    return (
      <div className="flex flex-col gap-4">
        <RateLimitNotice error={error} />
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="self-start"
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
      title="Không tải được số liệu"
      onRetry={onRetry}
      className="p-0"
    />
  );
}
