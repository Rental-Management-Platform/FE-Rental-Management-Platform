import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PlansSkeleton } from "@/features/pricing/components/plans-skeleton";
import { PricingScreen } from "@/features/pricing/components/pricing-screen";
import { PRICING_DESCRIPTION, PRICING_TITLE } from "@/features/pricing/text";

// The public pricing page at `/bang-gia` (scope #18, spec 0021). The wrapper, the header of the
// page and the site header are the static shell. The plans are read on the server inside
// <Suspense>, as a guest, with no cookie, header or token, and nothing is kept between visits.
export default function PricingPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader title={PRICING_TITLE} description={PRICING_DESCRIPTION} />
      <Suspense fallback={<PlansSkeleton />}>
        <PricingScreen />
      </Suspense>
    </div>
  );
}
