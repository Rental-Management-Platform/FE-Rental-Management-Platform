"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { NotFoundState } from "@/components/states/not-found-state";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { RatingLine } from "@/features/reviews/components/rating-line";
import { isApiError } from "@/lib/api/errors";
import type { LandlordProfile } from "@/lib/api/types";
import { useLandlordProfile } from "../hooks/use-landlord-profile";
import { landlordName, NOT_FOUND_TITLE } from "../text";
import { FollowControl } from "./follow-control";
import { ProfileStats } from "./profile-stats";

type LandlordProfileViewProps = {
  /** What the server read as a guest. It is the first value of the shared profile query. */
  profile: LandlordProfile;
  /** The rest of the page: the listings zone, and later the reviews zone. */
  children?: ReactNode;
};

/**
 * The top of the profile page, drawn from the shared profile query so a follow changes the
 * follower count here and the score line follows a new review (spec 0013, AC-16 and AC-20). The
 * name is the one the server read: it does not change with a follow. The server HTML already has
 * all of it, because the first value comes from the server.
 *
 * When a later read says the landlord is gone (locked or deleted after the page opened), the whole
 * page gives way to the "not found" state, so no button or number outlives the landlord.
 */
export function LandlordProfileView({
  profile,
  children,
}: LandlordProfileViewProps) {
  const query = useLandlordProfile(profile.id, profile);

  if (isApiError(query.error) && query.error.code === "LANDLORD_NOT_FOUND") {
    return (
      <NotFoundState
        title={NOT_FOUND_TITLE}
        backHref="/"
        backLabel="Xem các tin khác"
      />
    );
  }

  const current = query.data ?? profile;
  const name = landlordName(profile.name);

  return (
    <>
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Tìm trọ</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">{name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title={<span className="break-words">{name}</span>}
        description={<RatingLine {...current} />}
        actions={<FollowControl landlordId={profile.id} />}
      />
      <ProfileStats {...current} />
      {children}
    </>
  );
}
