import type { PropertyListItem } from "@/lib/api/types";
import { formatCount, formatDateTime } from "@/lib/format";
import { PropertyRowActions } from "./property-row-actions";
import { UnpinnedBadge } from "./unpinned-badge";

interface PropertyRowCardsProps {
  rows: readonly PropertyListItem[];
  onDelete: (property: PropertyListItem) => void;
}

/**
 * The list of "Nhà trọ của tôi" below `md` (spec 0019, AC-19): each property is a block that
 * stacks, with 44 px buttons. The blocks sit inside the zone and are told apart by a hairline,
 * never by a card of their own, because a card never sits inside another card. It shares the
 * actions with the table, so the two cannot disagree.
 */
export function PropertyRowCards({ rows, onDelete }: PropertyRowCardsProps) {
  return (
    <ul className="flex flex-col">
      {rows.map((property) => (
        <li
          key={property.id}
          className="flex flex-col items-start gap-3 border-t px-(--card-spacing) py-4"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium break-words">{property.name}</span>
            <span className="text-sm break-words text-muted-foreground">
              {property.fullAddress}
            </span>
          </div>
          <UnpinnedBadge property={property} />
          <p className="text-sm text-muted-foreground">
            {formatCount(property.listingCount)} tin · Tạo{" "}
            {formatDateTime(property.createdAt)}
          </p>
          <PropertyRowActions
            property={property}
            size="lg"
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
