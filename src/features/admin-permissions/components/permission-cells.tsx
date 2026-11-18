import { CheckIcon, LockIcon, MinusIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ADMIN_ONLY, NO, YES } from "../admin-permissions-text";

// The three kinds of cell all sit in a column whose title is centered, so each one centers its own
// mark as a block (`flex justify-center`). A `Checkbox` is itself a block, which `text-center` does
// not move, while an inline icon would sit in the middle: mixing the two put the boxes at the left
// of a column and the locks and ticks in its middle.

/**
 * One box of the matrix for a landlord or a tenant. Its name carries the type, the module and the
 * action, so a screen reader hears which one it is. It is off for a person without
 * `account_type:update` and while a save runs.
 */
export function EditableCell({
  checked,
  label,
  disabled,
  onToggle,
}: {
  checked: boolean;
  label: string;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={onToggle}
        aria-label={label}
      />
    </div>
  );
}

/**
 * Where a landlord or a tenant cannot be given the action, because only an admin may hold it
 * (`adminActions`, api-for-frontend.md 6.13). It is a lock with words for a screen reader, never
 * a box that looks like it could be ticked. Meaning is not carried by the icon alone.
 */
export function LockedCell({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center text-muted-foreground">
      <LockIcon aria-hidden="true" className="size-4" />
      <span className="sr-only">
        {label}: {ADMIN_ONLY}
      </span>
    </div>
  );
}

/**
 * The admin column: what the admin type holds, read only. It is a tick or a dash with words for a
 * screen reader, never a box, because the admin type cannot be changed (the API refuses it).
 */
export function FixedCell({ has, label }: { has: boolean; label: string }) {
  return (
    <div className="flex items-center justify-center text-muted-foreground">
      {has ? (
        <CheckIcon aria-hidden="true" className="size-4" />
      ) : (
        <MinusIcon aria-hidden="true" className="size-4" />
      )}
      <span className="sr-only">
        {label}: {has ? YES : NO}
      </span>
    </div>
  );
}
