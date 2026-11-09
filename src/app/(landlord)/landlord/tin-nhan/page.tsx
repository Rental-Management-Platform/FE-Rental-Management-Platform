import type { Metadata } from "next";
import { Suspense } from "react";
import { LANDLORD_CHAT_BASE } from "@/features/chat/access";
import {
  InboxScreen,
  InboxSkeleton,
} from "@/features/chat/components/inbox-screen";

// The route gate draws a loading state until the session is known (see the renter inbox page).
export const instant = false;

export const metadata: Metadata = {
  title: "Tin nhắn",
  robots: { index: false, follow: false },
};

// The inbox of a landlord (spec 0012, AC-1), inside the landlord area. The workspace shell
// already pads its `main`, so the page only lays out its own parts.
export default function LandlordInboxPage() {
  return (
    <Suspense fallback={<InboxSkeleton />}>
      <InboxScreen basePath={LANDLORD_CHAT_BASE} />
    </Suspense>
  );
}
