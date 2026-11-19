"use client";

import { Button } from "@/components/ui/button";
import {
  activePreset,
  PRESET_DAYS,
  presetRange,
  todayInVietnam,
  type DateRange,
} from "@/lib/date-range";

interface RangeBarProps {
  /** The range of the address, or `null` for no params (the last 30 days). */
  range: DateRange | null;
  /** A quick range was pressed: its range, or `null` for the 30 day default. */
  onChange: (range: DateRange | null) => void;
}

/**
 * The range of a statistics screen (spec 0024, AC-3): four quick ranges that end today in Vietnam.
 * The pressed one is marked with `aria-pressed`, which is the word a screen reader hears, and the
 * buttons are at least 44 px high below `md`. "Today" is read on each render and each press, never
 * kept from mount, so a screen left open past midnight presses the right days.
 */
export function RangeBar({ range, onChange }: RangeBarProps) {
  const active = activePreset(range, todayInVietnam(new Date()));

  return (
    <div role="group" aria-label="Khoảng ngày" className="flex flex-wrap gap-2">
      {PRESET_DAYS.map((days) => (
        <Button
          key={days}
          type="button"
          variant={active === days ? "default" : "outline"}
          aria-pressed={active === days}
          className="max-md:h-11"
          onClick={() =>
            onChange(presetRange(days, todayInVietnam(new Date())))
          }
        >
          {days} ngày
        </Button>
      ))}
    </div>
  );
}
