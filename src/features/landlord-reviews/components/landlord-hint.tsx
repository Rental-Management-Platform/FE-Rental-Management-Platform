import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LISTINGS_ANCHOR } from "@/features/landlord-profile/landlord-id";

/**
 * The renter may not review this landlord yet: only a landlord who answered them in chat opens the
 * way (spec 0013, AC-6). It lives in the write block's border row, so it has none of its own.
 */
export function LandlordHint() {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border p-4">
      <p>Nhắn tin với chủ trọ và đợi họ trả lời để đánh giá.</p>
      <Button asChild variant="outline" size="lg">
        <Link href={`#${LISTINGS_ANCHOR}`}>Xem tin của chủ trọ</Link>
      </Button>
    </div>
  );
}
