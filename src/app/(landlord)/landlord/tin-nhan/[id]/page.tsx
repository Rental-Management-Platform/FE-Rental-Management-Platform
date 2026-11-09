import type { Metadata, Viewport } from "next";
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

// See the renter page: the keyboard resizes the layout instead of covering the message box.
export const viewport: Viewport = { interactiveWidget: "resizes-content" };

// One conversation of a landlord (spec 0012, AC-1), inside the landlord area. The work area pads its
// `main` (24 px on a phone, 32 px from `md`) under a 3.5 rem top bar, and the height below is
// what is left of the screen, so the page does not scroll and the list inside it does.
export default function LandlordThreadPage() {
  return (
    <div className="flex h-[calc(100dvh-6.5rem)] flex-col md:h-[calc(100dvh-7.5rem)]">
      <Suspense fallback={<ThreadSkeleton />}>
        <ThreadScreen basePath={LANDLORD_CHAT_BASE} />
      </Suspense>
    </div>
  );
}
