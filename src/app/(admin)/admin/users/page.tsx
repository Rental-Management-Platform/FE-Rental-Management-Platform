import type { Metadata } from "next";
import { Suspense } from "react";
import { ADMIN_USERS_TITLE } from "@/features/admin-users/admin-users-text";
import {
  AdminUsersPage,
  AdminUsersSkeleton,
} from "@/features/admin-users/components/admin-users-page";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a
// gate is not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

export const metadata: Metadata = {
  title: ADMIN_USERS_TITLE,
  robots: { index: false, follow: false },
};

export default function AdminUsersRoute() {
  // `AdminUsersPage` reads `useSearchParams` (the page and, from M2, the filters), which needs a
  // boundary.
  return (
    <Suspense fallback={<AdminUsersSkeleton />}>
      <AdminUsersPage />
    </Suspense>
  );
}
