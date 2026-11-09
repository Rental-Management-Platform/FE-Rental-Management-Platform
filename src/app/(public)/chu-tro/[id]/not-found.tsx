import { NotFoundState } from "@/components/states/not-found-state";
import { NOT_FOUND_TITLE } from "@/features/landlord-profile/text";

// A landlord that is not there: an address that is not an id, an id that is no landlord (a renter
// or an admin, or never existed), or a landlord who is locked or deleted. The page streams, so the
// status can already be 200 and Next adds a `noindex` tag itself.
export default function LandlordNotFound() {
  return (
    <NotFoundState
      title={NOT_FOUND_TITLE}
      backHref="/"
      backLabel="Xem các tin khác"
    />
  );
}
