import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import type { ListingSearch } from "../schemas/search-params";
import { listingsHref, withoutPrice } from "../search-href";
import { PRICE_RANGE_NOTICE } from "../text";

/**
 * What the results area shows when the lower price is above the upper one (spec 0016, AC-4). The
 * page did not ask the API, which would answer 400. It is a warning and not an error: the person
 * has done nothing the machine failed at, and the link takes the price range away.
 */
export function PriceRangeNotice({ search }: { search: ListingSearch }) {
  return (
    <Alert variant="warning">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertTitle>{PRICE_RANGE_NOTICE.title}</AlertTitle>
      <AlertDescription>
        <p>{PRICE_RANGE_NOTICE.description}</p>
        <Link
          href={listingsHref(withoutPrice(search))}
          className={cn(FOCUS_RING, "inline-block rounded-sm py-1 font-medium")}
        >
          {PRICE_RANGE_NOTICE.fix}
        </Link>
      </AlertDescription>
    </Alert>
  );
}
