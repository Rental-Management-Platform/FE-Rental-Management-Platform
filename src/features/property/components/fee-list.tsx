import type { PropertyFee } from "@/lib/api/types";
import { feeKindLabel, formatFee } from "@/lib/format";

/**
 * The fees of a property: one row for each fee, in the order the API gives (electricity, water,
 * internet, parking, service, other). A price of 0 reads "Miễn phí". The note, when there is one,
 * sits under the amount. It is a part of a zone, with a hairline above it, and it draws nothing
 * when there are no fees, the way a page leaves out an empty description.
 *
 * The listing page shows it under an `h2`, the result of the create form under an `h3`
 * (`headingLevel`), so the headings never skip a level. It draws from props only, so `/dev/ui`
 * shows every case on fake data (spec 0017, AC-12).
 */
export function FeeList({
  fees,
  headingLevel = "h2",
}: {
  fees: readonly PropertyFee[];
  headingLevel?: "h2" | "h3";
}) {
  if (fees.length === 0) return null;
  const Heading = headingLevel;

  return (
    <section className="flex flex-col gap-3 border-t pt-5">
      <Heading className="text-base">Các khoản phí ngoài tiền thuê</Heading>
      <dl className="divide-y">
        {fees.map((fee) => (
          <div
            key={fee.kind}
            className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
          >
            <dt className="shrink-0 font-medium">{feeKindLabel(fee.kind)}</dt>
            <dd className="min-w-0 text-sm sm:text-right">
              <span className="tabular-nums">{formatFee(fee)}</span>
              {fee.note !== null && (
                <span className="block break-words text-muted-foreground">
                  {fee.note}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
