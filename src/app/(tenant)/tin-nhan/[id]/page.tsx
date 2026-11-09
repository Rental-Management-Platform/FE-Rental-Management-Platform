import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { TENANT_CHAT_BASE } from "@/features/chat/access";
import { ThreadScreen } from "@/features/chat/components/thread-screen";
import { ThreadSkeleton } from "@/features/chat/components/thread-skeleton";

// See the inbox page: a page behind the gate opts out of the instant navigation check.
export const instant = false;

// The tab title is fixed. It never holds a name or a word of a message (spec 0012, AC-22).
export const metadata: Metadata = {
  title: "Tin nhắn",
  robots: { index: false, follow: false },
};

// With the on screen keyboard open the layout viewport shrinks instead of the keyboard covering the
// message box, in the browsers that support it (Chrome on Android does; Safari on iOS does not yet,
// and is the one to check by hand). The page below is a column of a definite height, so the list
// scrolls inside it and the box stays in view (spec 0012, AC-12).
export const viewport: Viewport = { interactiveWidget: "resizes-content" };

// One conversation of a renter (spec 0012, AC-1). `ThreadScreen` reads the id with `useParams`,
// which suspends under Cache Components when the id is not known at build time (Next.js docs,
// "useParams"), so it sits inside a boundary.
export default function TenantThreadPage() {
  return (
    // The height of the screen under the 4 rem header, so the page itself never scrolls and the
    // list inside it does. The footer is below the fold.
    <div className="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-6xl flex-col px-4 py-4 md:px-6 md:py-6">
      <Suspense fallback={<ThreadSkeleton />}>
        <ThreadScreen basePath={TENANT_CHAT_BASE} />
      </Suspense>
    </div>
  );
}
