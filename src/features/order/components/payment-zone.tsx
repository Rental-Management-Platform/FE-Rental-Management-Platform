"use client";

import { InfoIcon } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useMembership } from "@/features/membership/hooks/use-membership";
import { FOCUS_RING } from "@/lib/focus-ring";
import { PRICING_PATH } from "@/lib/pricing-path";
import { cn } from "@/lib/utils";
import {
  CANCEL,
  CANCELLING,
  CANNOT_PAY_NOTE,
  CHOOSE_ANOTHER_HINT,
  PAY,
  PAYING,
  PAYMENT_TITLE,
  PRICING_LINK,
  startLine,
  TEST_PAYMENT_NOTE,
} from "../order-text";
import { useOrderActions } from "./order-actions-provider";

/**
 * What a pending order offers (spec 0022, AC-4 and AC-8): the note that this is a test payment,
 * when the plan starts, a way to another plan, and "Thanh toán thử" and "Hủy đơn" for the
 * permissions the person holds. With neither permission one line says so and no button is drawn.
 * Hiding a button is a convenience: the backend decides every press.
 *
 * Both buttons share one lock, kept by `OrderActionsProvider`. It is `aria-disabled` and not
 * `disabled`, so focus stays on the pressed button while the request runs (the rule of the pricing
 * page), and the pressed one reads "Đang thanh toán" or "Đang hủy" with a spinner. "Hủy đơn" only
 * opens the confirmation dialog; the cancel is sent from there.
 *
 * The start line reads the shared membership. While that read is loading, failed or refused it
 * draws nothing and blocks nothing.
 */
export function PaymentZone() {
  const { mayPay, mayCancel, hidden, locked, busy, pay, askCancel } =
    useOrderActions();
  const { query: membership } = useMembership();
  const start = startLine(membership.data);

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

        <div className="flex flex-col gap-1">
          {start && <p className="text-base">{start}</p>}
          <p className="text-sm text-muted-foreground">
            {CHOOSE_ANOTHER_HINT}{" "}
            <Link
              href={PRICING_PATH}
              className={cn(
                FOCUS_RING,
                "rounded-sm font-medium text-foreground underline underline-offset-3",
              )}
            >
              {PRICING_LINK}
            </Link>
          </p>
        </div>

        {!hidden && (mayPay || mayCancel) && (
          <div className="flex flex-wrap gap-3">
            {mayPay && (
              <Button
                type="button"
                size="lg"
                // `aria-disabled` does not dim a button on its own (see the pricing page).
                className="aria-disabled:opacity-50"
                aria-disabled={locked || undefined}
                aria-busy={busy === "pay" || undefined}
                onClick={pay}
              >
                {busy === "pay" && <Spinner size="sm" aria-hidden="true" />}
                {busy === "pay" ? PAYING : PAY}
              </Button>
            )}
            {mayCancel && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="aria-disabled:opacity-50"
                aria-disabled={locked || undefined}
                aria-busy={busy === "cancel" || undefined}
                onClick={askCancel}
              >
                {busy === "cancel" && <Spinner size="sm" aria-hidden="true" />}
                {busy === "cancel" ? CANCELLING : CANCEL}
              </Button>
            )}
          </div>
        )}

        {!mayPay && !mayCancel && (
          <p className="text-sm text-muted-foreground">{CANNOT_PAY_NOTE}</p>
        )}
      </CardContent>
    </Card>
  );
}
