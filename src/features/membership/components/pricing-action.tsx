import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PRICING_PATH } from "@/lib/pricing-path";
import type { WayOut } from "../membership-text";

/**
 * The way out of a limit, shared by the strip, the row notice and the post form (spec 0020,
 * AC-11): "Mua gói" when there is no plan to use, "Xem bảng giá" when a bigger one would help.
 * Both are a link to `PRICING_PATH` styled as a 44 px button.
 */
export function PricingAction({ way }: { way: WayOut }) {
  return way === "buy" ? (
    <Button asChild size="lg">
      <Link href={PRICING_PATH}>Mua gói</Link>
    </Button>
  ) : (
    <Button asChild variant="outline" size="lg">
      <Link href={PRICING_PATH}>Xem bảng giá</Link>
    </Button>
  );
}
