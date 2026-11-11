import { CheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Amenity } from "@/lib/api/types";

/**
 * The amenities of a property as the API sorted them, by name, each as a badge with a check mark.
 * Like `FeeList` it is a part of a zone with a hairline above it, it draws nothing when there are
 * none, and its heading level is a prop (`h2` on the listing page, `h3` on the result of the
 * create form).
 */
export function AmenityList({
  amenities,
  headingLevel = "h2",
}: {
  amenities: readonly Amenity[];
  headingLevel?: "h2" | "h3";
}) {
  if (amenities.length === 0) return null;
  const Heading = headingLevel;

  return (
    <section className="flex flex-col gap-3 border-t pt-5">
      <Heading className="text-base">Tiện ích</Heading>
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
  );
}
