import { formatCount, formatDateTime } from "@/lib/format";
import { daysLine } from "../admin-plans-text";
import { PlanButtons, SaleSwitch } from "./plan-row-controls";
import { priceText, type PlanListProps } from "./plans-table";

/**
 * The plans below `md` (scope #22): each plan is a block that stacks, with 44 px buttons. The
 * blocks sit inside the zone and are told apart by a hairline, never by a card of their own,
 * because a card never sits inside another card. It shows the same values as the table.
 */
export function PlanCards({
  rows,
  canUpdate,
  canDelete,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: PlanListProps) {
  return (
    <ul className="flex flex-col">
      {rows.map((plan) => (
        <li
          key={plan.id}
          className="flex flex-col gap-3 border-t px-(--card-spacing) py-4 first:border-t-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="line-clamp-2 min-w-0 font-medium">
              {plan.name}
            </span>
            <SaleSwitch
              plan={plan}
              disabled={!canUpdate || busy}
              onToggle={onToggle}
            />
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground tabular-nums">
            <span>
              {priceText(plan.price)} mỗi kỳ {daysLine(plan.durationDays)}
            </span>
            <span>
              Hiện cùng lúc tối đa {formatCount(plan.maxListings)} tin
            </span>
            <span>Sửa lần cuối ngày {formatDateTime(plan.updatedAt)}</span>
          </div>
          {(canUpdate || canDelete) && (
            <PlanButtons
              plan={plan}
              size="lg"
              canUpdate={canUpdate}
              canDelete={canDelete}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
