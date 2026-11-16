"use client";

import { InfoIcon } from "lucide-react";
import { useRef } from "react";
import { FailureNotice } from "@/components/form/failure-notice";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { canBuyPlans } from "@/features/pricing/access";
import { describeError } from "@/lib/api/errors";
import type { Order } from "@/lib/api/types";
import { useSession } from "@/lib/session/auth-provider";
import { can } from "@/lib/session/can";
import { useCountdown } from "@/lib/use-countdown";
import { usePayOrder } from "../hooks/use-pay-order";
import {
  CANNOT_PAY_NOTE,
  PAY,
  PAYING,
  PAYMENT_TITLE,
  TEST_PAYMENT_NOTE,
} from "../order-text";

/**
 * What a pending order offers: the note that this is a test payment, and "Thanh toán thử" for a
 * landlord who holds `order:create` (spec 0022, AC-4, AC-5 and AC-8). With neither permission to
 * pay nor to cancel, one line says so and no button is drawn. Hiding a button is a convenience:
 * the backend decides every press.
 *
 * The lock is `aria-disabled` and not `disabled`, so focus stays on the pressed button while the
 * payment runs (the rule of the pricing page). The ref closes the gap between a press and the
 * moment `isPending` turns true, so a second press in the same instant sends nothing. Nothing is
 * sent again by itself, and a 429 keeps the button locked until the wait is over.
 *
 * On a 200 the order in the cache turns `paid` and the page replaces this zone with the result, so
 * the lock stays closed after a success and opens again after a failure.
 */
export function PaymentZone({ order }: { order: Order }) {
  const session = useSession();
  const mayPay = canBuyPlans(session);
  const mayCancel = can(session, "order:cancel");

  const payment = usePayOrder(order.id);
  const sending = useRef(false);
  const waitLeft = useCountdown(payment.error);
  const busy = payment.isPending || payment.isSuccess;
  const locked = busy || waitLeft > 0;

  const pay = () => {
    if (sending.current || locked) return;
    sending.current = true;
    payment.mutate(undefined, {
      onError: () => {
        sending.current = false;
      },
    });
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          <h2 className="text-base">{PAYMENT_TITLE}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        <Alert variant="info">
          <InfoIcon aria-hidden="true" />
          <AlertDescription>
            <p>{TEST_PAYMENT_NOTE}</p>
          </AlertDescription>
        </Alert>

        {payment.isError && (
          <FailureNotice
            failure={payment.error}
            message={describeError(payment.error).message}
          />
        )}

        {mayPay && (
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              size="lg"
              // `aria-disabled` does not dim a button on its own (see the pricing page).
              className="aria-disabled:opacity-50"
              aria-disabled={locked || undefined}
              aria-busy={busy || undefined}
              onClick={pay}
            >
              {busy && <Spinner size="sm" aria-hidden="true" />}
              {busy ? PAYING : PAY}
            </Button>
          </div>
        )}

        {!mayPay && !mayCancel && (
          <p className="text-sm text-muted-foreground">{CANNOT_PAY_NOTE}</p>
        )}
      </CardContent>
    </Card>
  );
}
