import { Button } from "@/components/ui/button";
import {
  BY_DAY_LABEL,
  BY_MONTH_LABEL,
  GROUP_SWITCH_LABEL,
} from "../revenue-text";
import type { GroupBy } from "../revenue-view";

const CHOICES: readonly { value: GroupBy; label: string }[] = [
  { value: "day", label: BY_DAY_LABEL },
  { value: "month", label: BY_MONTH_LABEL },
];

/**
 * The switch between the days and the months of the chart and the table (spec 0026, AC-3): two
 * buttons, the pressed one marked with `aria-pressed`, which is the word a screen reader hears,
 * and at least 44 px high below `md`, like the buttons of the range bar.
 */
export function GroupSwitch({
  groupBy,
  onChange,
}: {
  groupBy: GroupBy;
  onChange: (next: GroupBy) => void;
}) {
  return (
    <div role="group" aria-label={GROUP_SWITCH_LABEL} className="flex gap-2">
      {CHOICES.map(({ value, label }) => {
        const pressed = groupBy === value;
        return (
          <Button
            key={value}
            type="button"
            variant={pressed ? "default" : "outline"}
            aria-pressed={pressed}
            className="max-md:h-11"
            onClick={() => onChange(value)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
