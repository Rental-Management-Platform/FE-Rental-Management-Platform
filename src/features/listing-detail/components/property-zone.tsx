import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PropertyInListing } from "@/lib/api/types";
import { feeKindLabel, formatFee } from "@/lib/format";

/** What the zone reads from the property of a listing. */
export type PropertyZoneData = Pick<
  PropertyInListing,
  "name" | "fullAddress" | "fees" | "amenities"
>;

/**
 * The property of a listing: one zone in up to three parts, each with its own `h2`, and the
 * hairlines stay inside the zone (lifted from the sample screen, as the follow up of spec 0010
 * says; scope #11).
 *
 * - "Nhà trọ": the name and the full address, always there.
 * - "Các khoản phí ngoài tiền thuê": one row for each fee, in the order the API gives (electricity,
 *   water, internet, parking, service, other). A price of 0 reads "Miễn phí". The note, when there
 *   is one, sits under the amount.
 * - "Tiện ích": the amenities as the API sorted them, by name.
 *
 * A part with nothing to show is left out, the way the page leaves out an empty description, so a
 * property with no fee and no amenity is the name and the address alone. It draws from props only,
 * so `/dev/ui` shows every case on fake data.
 */
export function PropertyZone({
  property,
  className,
}: {
  property: PropertyZoneData;
  className?: string;
}) {
  const { fees, amenities } = property;

  return (
    <Card className={className}>
      <CardContent className="gap-5">
        <section className="flex flex-col gap-2">
          <h2 className="text-base">Nhà trọ</h2>
          <div className="flex flex-col">
            <p className="font-medium break-words">{property.name}</p>
            <p className="text-sm break-words text-muted-foreground">
              {property.fullAddress}
            </p>
          </div>
        </section>

        {fees.length > 0 && (
          <section className="flex flex-col gap-3 border-t pt-5">
            <h2 className="text-base">Các khoản phí ngoài tiền thuê</h2>
            <dl className="divide-y">
              {fees.map((fee) => (
                <div
                  key={fee.kind}
                  className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <dt className="shrink-0 font-medium">
                    {feeKindLabel(fee.kind)}
                  </dt>
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
        )}

        {amenities.length > 0 && (
          <section className="flex flex-col gap-3 border-t pt-5">
            <h2 className="text-base">Tiện ích</h2>
            <ul className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <li key={amenity.key}>
                  <Badge variant="secondary">
                    <CheckIcon aria-hidden="true" data-icon="inline-start" />
                    {amenity.name}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
