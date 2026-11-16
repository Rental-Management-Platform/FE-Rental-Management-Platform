import { EmptyState } from "@/components/states/empty-state";
import { ListingsFailure } from "@/features/listing-search/components/listings-failure";
import { isApiError } from "@/lib/api/errors";
import type { Page, Plan } from "@/lib/api/types";
import { getPlans } from "../api/get-plans";
import { NO_PLANS_TITLE, PLANS_FAILED_TITLE } from "../text";
import { BuyControl } from "./buy-control";
import { BuyNotices } from "./buy-notices";
import { BuyProvider } from "./buy-provider";
import { PlanCard } from "./plan-card";
import { ViewerNote } from "./viewer-note";

/**
 * The plans of the pricing page, read on the server as a guest (api-for-frontend.md, 6.26). It
 * reads uncached data, so the page keeps it inside a <Suspense> boundary and the header stays in
 * the static shell. The page reads no cookie, header or token: everyone gets the same cards, and
 * what depends on the viewer (the button under each card) is added in the browser.
 *
 * The cards come in the order the API gave them (price ascending, then name). Nothing is sorted,
 * highlighted or divided here (spec 0021, AC-2 and AC-14). A failed read takes the place of the
 * cards, and an empty list says so, with no buy control (AC-12).
 */
export async function PricingScreen() {
  let result: Page<Plan>;
  try {
    result = await getPlans();
  } catch (error) {
    // Anything that is not an `ApiError` is a bug: the route's `error.tsx` shows it.
    if (!isApiError(error)) throw error;
    // `ListingsFailure` carries the countdown of a 429, the support code of a 5xx, and a "Thử lại"
    // that asks the server to render the page again.
    return (
      <ListingsFailure
        status={error.status}
        code={error.code}
        message={error.message}
        requestId={error.requestId}
        retryAfterSeconds={error.retryAfterSeconds}
        retryAfterExact={error.retryAfterExact}
        title={PLANS_FAILED_TITLE}
      />
    );
  }

  if (result.items.length === 0) return <EmptyState title={NO_PLANS_TITLE} />;

  return (
    <BuyProvider>
      <BuyNotices />
      <ul className="grid gap-6 md:grid-cols-3">
        {result.items.map((plan) => (
          <li key={plan.id} className="grid">
            <PlanCard plan={plan} footer={<BuyControl plan={plan} />} />
          </li>
        ))}
      </ul>
      <ViewerNote />
    </BuyProvider>
  );
}
