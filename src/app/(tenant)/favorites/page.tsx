import type { Metadata } from "next";
import { Suspense } from "react";
import {
  SavedScreen,
  SavedSkeleton,
} from "@/features/favorites/components/saved-screen";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a gate is
// not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

// Private to the signed in renter, and closed in `robots.txt` too (spec 0009, AC-13).
export const metadata: Metadata = {
  title: "Tin đã lưu",
  robots: { index: false, follow: false },
};

// The saved listings of a renter (scope #14). A public page sets its own padding.
export default function FavoritesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      {/* `SavedScreen` reads `useSearchParams`, which needs a boundary. */}
      <Suspense fallback={<SavedSkeleton />}>
        <SavedScreen />
      </Suspense>
    </div>
  );
}
