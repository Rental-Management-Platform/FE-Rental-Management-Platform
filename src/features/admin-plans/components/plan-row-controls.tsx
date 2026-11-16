import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { AdminPlan } from "@/lib/api/types";
import {
  DELETE,
  deleteLabel,
  EDIT,
  editLabel,
  OFF_SALE,
  ON_SALE,
  saleSwitchLabel,
} from "../admin-plans-text";

/**
 * The sale switch of a plan with its words, "Đang bán" or "Đã tắt": a state is never only a
 * position of a switch. Its name carries the plan, so every row has a different one. It is off for
 * a person without `plan:update` and while a write is running, so two presses are never in flight.
 */
export function SaleSwitch({
  plan,
  disabled,
  onToggle,
}: {
  plan: AdminPlan;
  disabled: boolean;
  onToggle: (plan: AdminPlan, isActive: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={plan.isActive}
        disabled={disabled}
        onCheckedChange={(next) => onToggle(plan, next)}
        aria-label={saleSwitchLabel(plan.name)}
      />
      <span className="text-sm">{plan.isActive ? ON_SALE : OFF_SALE}</span>
    </div>
  );
}

/**
 * "Sửa" and "Xóa" of a plan. A button is drawn only for a person who holds its permission, and the
 * backend still decides. The names carry the plan, so a screen reader hears which row it is.
 */
export function PlanButtons({
  plan,
  size,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
}: {
  plan: AdminPlan;
  size: "sm" | "lg";
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (plan: AdminPlan) => void;
  onDelete: (plan: AdminPlan) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {canUpdate && (
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={editLabel(plan.name)}
          onClick={() => onEdit(plan)}
        >
          {EDIT}
        </Button>
      )}
      {canDelete && (
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={deleteLabel(plan.name)}
          onClick={() => onDelete(plan)}
        >
          {DELETE}
        </Button>
      )}
    </div>
  );
}
