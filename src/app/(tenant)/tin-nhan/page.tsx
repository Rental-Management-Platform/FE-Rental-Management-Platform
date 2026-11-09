import type { Metadata } from "next";
import { Suspense } from "react";
import { TENANT_CHAT_BASE } from "@/features/chat/access";
import {
  InboxScreen,
  InboxSkeleton,
} from "@/features/chat/components/inbox-screen";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a gate is
// not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: "Tin nhắn",
  robots: { index: false, follow: false },
};

// The inbox of a renter (spec 0012, AC-1). A public page sets its own padding.
export default function TenantInboxPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      {/* `InboxScreen` reads `useSearchParams`, which needs a boundary. */}
      <Suspense fallback={<InboxSkeleton />}>
        <InboxScreen basePath={TENANT_CHAT_BASE} />
      </Suspense>
    </div>
  );
}
