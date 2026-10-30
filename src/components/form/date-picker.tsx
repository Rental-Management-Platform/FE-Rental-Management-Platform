"use client";

import { CalendarIcon } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { vi } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { DateOnly } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { formatDateOnly, TIME_ZONE } from "@/lib/format";
import { cn } from "@/lib/utils";

const DAY_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The day it is now in Vietnam, as a `Date` at local midnight (what the calendar compares). */
const todayInVietnam = (now: Date): Date => {
  const parts = DAY_PARTS.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return new Date(part("year"), part("month") - 1, part("day"));
};

/** `YYYY-MM-DD` from the local year, month and day of the picked day. Never through UTC. */
const toDateOnly = (day: Date): DateOnly =>
  [
    String(day.getFullYear()).padStart(4, "0"),
    String(day.getMonth() + 1).padStart(2, "0"),
    String(day.getDate()).padStart(2, "0"),
  ].join("-");

/** The day a stored value names, or `undefined` for "" or text that is not a real day. */
const fromDateOnly = (value: DateOnly): Date | undefined => {
  const match = DATE_ONLY.exec(value);
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return toDateOnly(date) === value ? date : undefined;
};

/** The first of the month of `day`, held inside the months the calendar can show. */
const nearestMonth = (day: Date, start: Date, end: Date): Date => {
  const month = new Date(day.getFullYear(), day.getMonth(), 1);
  return month < start ? start : month > end ? end : month;
};

// The arrows and dropdowns get the words of spec 0006; the rest of the Vietnamese labels
// (day names, grid, week number) come from the `vi` locale.
const LABELS: NonNullable<ComponentProps<typeof Calendar>["labels"]> = {
  labelPrevious: () => "Tháng trước",
  labelNext: () => "Tháng sau",
  labelMonthDropdown: () => "Chọn tháng",
  labelYearDropdown: () => "Chọn năm",
};

interface DatePanelProps {
  value: DateOnly;
  onPick: (value: DateOnly) => void;
  onClear: () => void;
}

// The calendar and its footer. It mounts when the popover opens, so "today" and the years on
// offer are read at that moment. The years run from January 1 of last year to December 31 three
// years ahead, set with `startMonth` and `endMonth` (not a `disabled` matcher), in Vietnam's year.
function DatePanel({ value, onPick, onClear }: DatePanelProps) {
  const [today] = useState(() => todayInVietnam(new Date()));
  const startMonth = new Date(today.getFullYear() - 1, 0, 1);
  const endMonth = new Date(today.getFullYear() + 3, 11, 1);
  const selected = fromDateOnly(value);

  return (
    <>
      <Calendar
        mode="single"
        required
        selected={selected}
        onSelect={(day) => onPick(toDateOnly(day))}
        // A saved date outside the years on offer still shows in the trigger and stays; the
        // calendar opens at the nearest month it can show.
        defaultMonth={nearestMonth(selected ?? today, startMonth, endMonth)}
        startMonth={startMonth}
        endMonth={endMonth}
        captionLayout="dropdown"
        locale={vi}
        labels={LABELS}
        weekStartsOn={1}
        today={today}
        autoFocus
      />
      <div className="flex justify-end border-t p-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={value === ""}
          onClick={onClear}
        >
          Bỏ chọn
        </Button>
      </div>
    </>
  );
}

export interface DatePickerProps extends Omit<
  ComponentProps<"button">,
  "value" | "onChange" | "type" | "children"
> {
  /** `YYYY-MM-DD`, or "" for no date. */
  value: DateOnly;
  onChange: (value: DateOnly) => void;
  placeholder?: string;
}

/**
 * A date field: a button that shows `dd/MM/yyyy` and opens a Vietnamese calendar in a popover.
 * `value` is `YYYY-MM-DD` built from the calendar's local year, month and day, so a day never
 * moves with the time zone. Spread `field` and `aria` of `FormField` onto it: `id`, `ref`,
 * `onBlur` and the `aria-*` all land on the button, so the label points at it and focus on an
 * error goes there.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  className,
  "aria-describedby": describedBy,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const valueId = useId();

  const choose = (next: DateOnly) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* The look of the Input and the Select trigger. A label outranks the content of a
            button, so the shown value is read as part of the description. */}
        <button
          type="button"
          className={cn(
            FOCUS_RING,
            "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-(length:--text-input) leading-(--text-input--line-height) transition-[color,box-shadow,border-color] focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
            className,
          )}
          aria-describedby={[valueId, describedBy].filter(Boolean).join(" ")}
          {...props}
        >
          <span
            id={valueId}
            className={cn("truncate", value === "" && "text-muted-foreground")}
          >
            {value === "" ? placeholder : formatDateOnly(value)}
          </span>
          <CalendarIcon aria-hidden className="text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={8}
        aria-label="Lịch chọn ngày"
        className="w-auto gap-0 p-0"
      >
        <DatePanel value={value} onPick={choose} onClear={() => choose("")} />
      </PopoverContent>
    </Popover>
  );
}
