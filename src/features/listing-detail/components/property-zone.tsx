import { Card, CardContent } from "@/components/ui/card";
import { AmenityList } from "@/features/property/components/amenity-list";
import { FeeList } from "@/features/property/components/fee-list";
import type { PropertyInListing } from "@/lib/api/types";

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
 * - "Các khoản phí ngoài tiền thuê": `FeeList`, one row for each fee, in the order the API gives.
 * - "Tiện ích": `AmenityList`, the amenities as the API sorted them, by name.
 *
 * The two lists are the ones the result of the create property form shows too (spec 0017, AC-12),
 * so a property reads the same wherever it appears. A part with nothing to show is left out, the
 * way the page leaves out an empty description, so a property with no fee and no amenity is the
 * name and the address alone. It draws from props only, so `/dev/ui` shows every case on fake
 * data.
 */
export function PropertyZone({
  property,
  className,
}: {
  property: PropertyZoneData;
  className?: string;
}) {
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

        <FeeList fees={property.fees} />
        <AmenityList amenities={property.amenities} />
      </CardContent>
    </Card>
  );
}
