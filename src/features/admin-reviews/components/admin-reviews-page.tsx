"use client";

import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ForbiddenState } from "@/components/states/forbidden-state";
import { LoadingState } from "@/components/states/loading-state";
import { Card } from "@/components/ui/card";
import { parsePageParam } from "@/features/listing-search/schemas/search-params";
import { useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import {
  ADMIN_REVIEWS_DESCRIPTION,
  ADMIN_REVIEWS_FORBIDDEN_MESSAGE,
  ADMIN_REVIEWS_TITLE,
} from "../admin-reviews-text";
import { LandlordReviewsZone } from "./landlord-reviews-zone";

/**
 * "Kiểm duyệt đánh giá" (scope #36): the reviews of every writer, in every state, with the status,
 * the reason of an admin hide and the page links. It runs in the browser, because the lists need a
 * login, and sits behind the route gate of the admin. The page is the query of the address, so it
 * reads `useSearchParams` and its route keeps it inside a `<Suspense>` boundary.
 */
export function AdminReviewsPage() {
  const searchParams = useSearchParams();
  const page = parsePageParam(searchParams.get("page"));
  const session = useSession();

  // Both lists need `review:moderate`, so without it there is nothing to draw and nothing to read.
  if (!can(session, "review:moderate")) {
    return <ForbiddenState message={ADMIN_REVIEWS_FORBIDDEN_MESSAGE} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={ADMIN_REVIEWS_TITLE}
        description={ADMIN_REVIEWS_DESCRIPTION}
      />
      <LandlordReviewsZone page={page} />
    </div>
  );
}

/** The skeleton for the route's `Suspense` fallback, drawn until the address is known. */
export function AdminReviewsSkeleton() {
  return (
    <Card>
      <LoadingState variant="table" />
    </Card>
  );
}
