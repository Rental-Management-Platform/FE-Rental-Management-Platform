import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { CANCEL } from "../admin-catalog-text";

/**
 * The two buttons at the bottom of every form of the catalog: "Hủy" and the one that sends. The
 * sending one is off while the request runs and while a 429 counts down, and shows a spinner and
 * the words of the action in progress.
 */
export function FormButtons({
  submitting,
  waiting,
  label,
  busyLabel,
  onCancel,
}: {
  submitting: boolean;
  /** True while the wait after a 429 runs. */
  waiting: boolean;
  label: string;
  busyLabel: string;
  onCancel: () => void;
}) {
  return (
    <DialogFooter>
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={onCancel}
        disabled={submitting}
      >
        {CANCEL}
      </Button>
      <Button
        type="submit"
        size="lg"
        disabled={submitting || waiting}
        aria-busy={submitting}
      >
        {submitting && <Spinner size="sm" />}
        {submitting ? busyLabel : label}
      </Button>
    </DialogFooter>
  );
}
