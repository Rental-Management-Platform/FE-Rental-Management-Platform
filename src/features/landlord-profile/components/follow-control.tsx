"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { authHref } from "@/lib/next-path";
import { useSession } from "@/lib/session/auth-provider";
import { toFollowView } from "../follow-view";
import { useFollow } from "../hooks/use-follow";
import { useLandlordProfile } from "../hooks/use-landlord-profile";
import { FollowButton } from "./follow-button";

const FOLLOWED = "Đã theo dõi chủ trọ.";
const UNFOLLOWED = "Đã bỏ theo dõi chủ trọ.";

/**
 * The follow button of a profile (api-for-frontend.md, 6.32). It turns the session and the shared
 * profile query into one `FollowView` and hands it to `FollowButton`. A press follows or
 * unfollows, and the answer of the server (the whole profile) is written into the shared query, so
 * the button, the follower count and the header change together. A guest is sent to sign in and
 * comes back to this page. It sits under the `<Suspense>` of the page, which `useSearchParams`
 * needs.
 */
export function FollowControl({ landlordId }: { landlordId: string }) {
  const session = useSession();
  const query = useLandlordProfile(landlordId);
  const follow = useFollow(landlordId);
  const [announcement, setAnnouncement] = useState("");
  const sending = useRef(false);

  const pathname = usePathname();
  const search = useSearchParams().toString();
  const signInHref = authHref(
    "/login",
    search === "" ? pathname : `${pathname}?${search}`,
  );

  const view = toFollowView(session, landlordId, query);

  const toggle = () => {
    // `isPending` only turns true a moment after the press, so a second press in the same instant
    // would still get through. The ref closes that gap at once.
    if (view.kind !== "ready" || follow.isPending || sending.current) return;
    sending.current = true;
    const next = !view.following;
    setAnnouncement("");
    follow.mutate(next, {
      onSuccess: () => setAnnouncement(next ? FOLLOWED : UNFOLLOWED),
      onSettled: () => {
        sending.current = false;
      },
    });
  };

  return (
    <FollowButton
      view={view}
      pending={follow.isPending}
      failure={follow.error}
      announcement={announcement}
      signInHref={signInHref}
      onToggle={toggle}
      onRetry={() => void query.refetch()}
    />
  );
}
