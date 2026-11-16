import { getPlans } from "../api/get-plans";
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
 * highlighted or divided here (spec 0021, AC-2 and AC-14).
 */
export async function PricingScreen() {
  const { items: plans } = await getPlans();

  return (
    <BuyProvider>
      <BuyNotices />
      <ul className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <li key={plan.id} className="grid">
            <PlanCard plan={plan} footer={<BuyControl plan={plan} />} />
          </li>
        ))}
      </ul>
      <ViewerNote />
    </BuyProvider>
  );
}
