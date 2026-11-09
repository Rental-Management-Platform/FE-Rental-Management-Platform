import { Suspense } from "react";
import { LandlordProfileScreen } from "@/features/landlord-profile/components/landlord-profile";
import { LandlordProfileSkeleton } from "@/features/landlord-profile/components/landlord-profile-skeleton";

// The public profile of a landlord at `/chu-tro/<id>` (scope #15). The wrapper and the site
// header are the static shell. `params` is passed down as a promise and read only inside the
// <Suspense> boundary, so the shell can be prerendered. The page reads no cookie, header or token.
export default function LandlordProfilePage({
  params,
}: PageProps<"/chu-tro/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <Suspense fallback={<LandlordProfileSkeleton />}>
        <LandlordProfileScreen params={params} />
      </Suspense>
    </div>
  );
}
