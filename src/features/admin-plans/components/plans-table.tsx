import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminPlan } from "@/lib/api/types";
import { formatCount, formatDateTime, formatMoney } from "@/lib/format";
import {
  COLUMN_ACTIONS,
  COLUMN_ACTIVE,
  COLUMN_DAYS,
  COLUMN_LIMIT,
  COLUMN_NAME,
  COLUMN_PRICE,
  COLUMN_UPDATED,
  daysLine,
  FREE,
  TABLE_CAPTION,
} from "../admin-plans-text";
import { PlanButtons, SaleSwitch } from "./plan-row-controls";

/** What the table and the blocks of the plans need to draw a row and to act on it. */
export interface PlanListProps {
  rows: readonly AdminPlan[];
  canUpdate: boolean;
  canDelete: boolean;
  /** True while a write runs, so no second switch is pressed before it ends. */
  busy: boolean;
  onToggle: (plan: AdminPlan, isActive: boolean) => void;
  onEdit: (plan: AdminPlan) => void;
  onDelete: (plan: AdminPlan) => void;
}

/** A free plan reads "Miễn phí", any other price reads as money. */
export const priceText = (price: number) =>
  price === 0 ? FREE : formatMoney(price);

/**
 * The table of the plans from `md` up (scope #22). It runs edge to edge in its zone. Every value
 * is the plan's own field, in the order the API gave: the front end sorts nothing. A plan that is
 * turned off stays in the table, with its switch off, because it can be turned on again.
 */
export function PlansTable({
  rows,
  canUpdate,
  canDelete,
  busy,
  onToggle,
  onEdit,
  onDelete,
}: PlanListProps) {
  return (
    <Table>
      <TableCaption className="sr-only">{TABLE_CAPTION}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>{COLUMN_NAME}</TableHead>
          <TableHead>{COLUMN_PRICE}</TableHead>
          <TableHead>{COLUMN_LIMIT}</TableHead>
          <TableHead>{COLUMN_DAYS}</TableHead>
          <TableHead>{COLUMN_ACTIVE}</TableHead>
          <TableHead>{COLUMN_UPDATED}</TableHead>
          {(canUpdate || canDelete) && <TableHead>{COLUMN_ACTIONS}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className="max-w-56">
              <span className="block truncate font-medium" title={plan.name}>
                {plan.name}
              </span>
            </TableCell>
            <TableCell className="tabular-nums">
              {priceText(plan.price)}
            </TableCell>
            <TableCell className="tabular-nums">
              {formatCount(plan.maxListings)}
            </TableCell>
            <TableCell className="tabular-nums">
              {daysLine(plan.durationDays)}
            </TableCell>
            <TableCell>
              <SaleSwitch
                plan={plan}
                disabled={!canUpdate || busy}
                onToggle={onToggle}
              />
            </TableCell>
            <TableCell className="tabular-nums">
              {formatDateTime(plan.updatedAt)}
            </TableCell>
            {(canUpdate || canDelete) && (
              <TableCell>
                <PlanButtons
                  plan={plan}
                  size="sm"
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
