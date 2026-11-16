import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { GoodToKnow } from "@/features/pricing/components/good-to-know";
import { MembershipSection } from "@/features/pricing/components/membership-section";
import { PlansSkeleton } from "@/features/pricing/components/plans-skeleton";
import { PricingScreen } from "@/features/pricing/components/pricing-screen";
import { PRICING_METADATA } from "@/features/pricing/metadata";
import { PRICING_DESCRIPTION, PRICING_TITLE } from "@/features/pricing/text";

// The head is fixed copy, so it is a plain export and reads no API.
export const metadata = PRICING_METADATA;

// The public pricing page at `/bang-gia` (scope #18, spec 0021). The wrapper, the header of the
// page, the zone "Cần biết trước khi mua" and the site header are the static shell. The plans are
// read on the server inside <Suspense>, as a guest, with no cookie, header or token, and nothing
// is kept between visits.
export default function PricingPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader title={PRICING_TITLE} description={PRICING_DESCRIPTION} />
      {/* The status strip of a landlord reads the session and a query clock in the browser, so it
          sits in its own boundary and the server HTML holds nothing for it. */}
      <Suspense fallback={null}>
        <MembershipSection />
      </Suspense>
      <Suspense fallback={<PlansSkeleton />}>
        <PricingScreen />
      </Suspense>
      <GoodToKnow />
    </div>
  );
}
