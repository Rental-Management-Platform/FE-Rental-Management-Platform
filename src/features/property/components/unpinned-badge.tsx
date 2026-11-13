import { MapPinOffIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PropertyListItem } from "@/lib/api/types";

/**
 * "Chưa ghim vị trí" (spec 0019, AC-11): shown when the property has no saved point, which is
 * when both coordinates are `null`. A property with a pin shows nothing, so a row only carries
 * a badge when there is something to do. A label with an icon, never color alone.
 */
export function UnpinnedBadge({
  property,
}: {
  property: Pick<PropertyListItem, "latitude" | "longitude">;
}) {
  if (property.latitude !== null || property.longitude !== null) return null;
  return (
    <Badge variant="secondary">
      <MapPinOffIcon data-icon="inline-start" aria-hidden="true" />
      Chưa ghim vị trí
    </Badge>
  );
}
