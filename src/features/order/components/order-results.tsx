import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MY_LISTINGS_PATH,
  NEW_LISTING_PATH,
} from "@/features/listing/listing-filter";
import type { Order } from "@/lib/api/types";
import { PRICING_PATH } from "@/lib/pricing-path";
import { ORDERS_PATH } from "../order-paths";
import {
  BACK_TO_ORDERS,
  cancelledAtLine,
  MY_LISTINGS_LINK,
  NEW_LISTING_LINK,
  paidAtLine,
  periodRangeLine,
  PRICING_LINK,
  RESULT_TITLE,
} from "../order-text";

// The zone a finished order shows in place of the payment zone. It has no pay or cancel button:
// paid and cancelled are final (spec 0022, AC-6 and AC-7), so the way on is two links.

/**
 * A paid order: when it was paid, the period of the plan from the order itself (the front end
 * computes no end of a period), and the two things a landlord does next. A paid order opened later
 * shows the same view.
 */
export function PaidResult({ order }: { order: Order }) {
  const { paidAt, startsAt, endsAt } = order;
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <h2 className="text-base">{RESULT_TITLE}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        <Alert variant="success">
          <CircleCheckIcon aria-hidden="true" />
          {paidAt && <AlertTitle>{paidAtLine(paidAt)}</AlertTitle>}
          {startsAt && endsAt && (
            <AlertDescription>
              <p>{periodRangeLine(startsAt, endsAt)}</p>
            </AlertDescription>
          )}
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={MY_LISTINGS_PATH}>{MY_LISTINGS_LINK}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={NEW_LISTING_PATH}>{NEW_LISTING_LINK}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** A cancelled order: when, and the two ways on (pick a plan again, or go back to the history). */
export function CancelledResult({ order }: { order: Order }) {
  const { cancelledAt } = order;
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <h2 className="text-base">{RESULT_TITLE}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        {cancelledAt && (
          <Alert>
            <CircleXIcon aria-hidden="true" />
            <AlertTitle>{cancelledAtLine(cancelledAt)}</AlertTitle>
          </Alert>
        )}
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={PRICING_PATH}>{PRICING_LINK}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={ORDERS_PATH}>{BACK_TO_ORDERS}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
