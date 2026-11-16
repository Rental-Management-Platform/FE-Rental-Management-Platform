import { TriangleAlertIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QUOTA_HINT } from "../membership-text";
import type { QuotaRefusal } from "../refusal";
import { PricingAction } from "./pricing-action";

/**
 * What a refused "Hiện" says at its row and what a refused post says above its submit button
 * (spec 0020, AC-8 and AC-9). It is a quiet `warning`, never red: the refusal is a message, not
 * something that broke. It keeps the backend's sentence and adds the way out: "Mua gói" when
 * there is no plan to use, or a hint and "Xem bảng giá" when the limit is reached.
 */
export function QuotaRefusalNotice({ code, message }: QuotaRefusal) {
  const limitReached = code === "LISTING_QUOTA_REACHED";
  return (
    <Alert variant="warning">
      <TriangleAlertIcon aria-hidden="true" />
      <AlertDescription>
        <p>{message}</p>
        {limitReached && <p>{QUOTA_HINT}</p>}
      </AlertDescription>
      <div className="col-start-2 mt-2 flex flex-wrap gap-3">
        <PricingAction way={limitReached ? "pricing" : "buy"} />
      </div>
    </Alert>
  );
}
