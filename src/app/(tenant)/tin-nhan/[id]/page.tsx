import type { Metadata } from "next";
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

// One conversation of a renter (spec 0012, AC-1). `ThreadScreen` reads the id with `useParams`,
// which suspends under Cache Components when the id is not known at build time (Next.js docs,
// "useParams"), so it sits inside a boundary.
export default function TenantThreadPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <Suspense fallback={<ThreadSkeleton />}>
        <ThreadScreen basePath={TENANT_CHAT_BASE} />
      </Suspense>
    </div>
  );
}
