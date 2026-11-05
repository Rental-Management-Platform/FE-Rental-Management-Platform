import { NotFoundState } from "@/components/states/not-found-state";

// A listing that is gone: hidden, deleted, never existed, or an address that is not a listing
// address at all (spec 0010, AC-12). The page streams, so the status can already be 200 and
// Next adds a `noindex` tag itself.
export default function ListingNotFound() {
  return (
    <NotFoundState
      title="Không tìm thấy tin này"
      backHref="/"
      backLabel="Xem các tin khác"
    />
  );
}
