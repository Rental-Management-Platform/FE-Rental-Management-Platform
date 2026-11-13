import type { Metadata } from "next";
import { AccountScreen } from "@/features/account/components/account-screen";

// The route gate draws a loading state until the session is known, so the validator of instant
// navigation never sees this page and warns that the segment was dropped. A page behind a gate is
// not meant to be instant for a guest, so it opts out (Next.js docs, "instant").
export const instant = false;

// Private to the signed in person, and closed in `robots.txt` too (spec 0009, AC-13).
export const metadata: Metadata = {
  title: "Tài khoản của tôi",
  robots: { index: false, follow: false },
};

// The account page (scope #28). A public page sets its own padding.
export default function AccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <AccountScreen />
    </div>
  );
}
