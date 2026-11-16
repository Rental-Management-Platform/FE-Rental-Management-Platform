"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminPlan } from "@/lib/api/types";
import {
  CREATE_DESCRIPTION,
  CREATE_TITLE,
  EDIT_DESCRIPTION,
  editTitle,
} from "../admin-plans-text";
import { PlanForm } from "./plan-form";

/**
 * The one dialog of "Thêm gói" and "Sửa gói" (scope #22), a short form that needs its own frame.
 * It has no trigger of its own: it opens from the header button or from a row, so the page passes
 * `onCloseAutoFocus` from `useReturnFocus`. `plan` is `null` for a new plan and stays set while
 * the dialog closes, so the title does not change under the closing animation. The form is keyed
 * by the plan, so every opening starts from the plan's own values.
 */
export function PlanDialog({
  open,
  plan,
  onOpenChange,
  onCloseAutoFocus,
}: {
  open: boolean;
  plan: AdminPlan | null;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: (event: Event) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>
            {plan === null ? CREATE_TITLE : editTitle(plan.name)}
          </DialogTitle>
          <DialogDescription>
            {plan === null ? CREATE_DESCRIPTION : EDIT_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <PlanForm
          key={plan === null ? "new" : plan.id}
          plan={plan}
          onDone={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
