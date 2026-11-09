import type { Metadata } from "next";
import { Suspense } from "react";
import { LANDLORD_CHAT_BASE } from "@/features/chat/access";
import { ThreadScreen } from "@/features/chat/components/thread-screen";
import { ThreadSkeleton } from "@/features/chat/components/thread-skeleton";

// The route gate draws a loading state until the session is known (see the renter inbox page).
export const instant = false;

// The tab title is fixed. It never holds a name or a word of a message (spec 0012, AC-22).
export const metadata: Metadata = {
  title: "Tin nhắn",
  robots: { index: false, follow: false },
};

// One conversation of a landlord (spec 0012, AC-1), inside the landlord area.
export default function LandlordThreadPage() {
  return (
    <Suspense fallback={<ThreadSkeleton />}>
      <ThreadScreen basePath={LANDLORD_CHAT_BASE} />
    </Suspense>
  );
}
