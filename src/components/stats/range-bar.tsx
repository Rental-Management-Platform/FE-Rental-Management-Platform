"use client";

import { useId, useState } from "react";
import { DatePicker } from "@/components/form/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  activePreset,
  defaultRange,
  parseRange,
  PRESET_DAYS,
  presetRange,
  todayInVietnam,
  validateRange,
  type DateRange,
  type RangeDraft,
} from "@/lib/date-range";

interface RangeBarProps {
  /** The range of the address, or `null` for no params (the last 30 days). */
  range: DateRange | null;
  /** A quick range or a valid custom range was chosen: its range, or `null` for the 30 day default. */
  onChange: (range: DateRange | null) => void;
}

// What "Tùy chọn" asks for and says, in the words of spec 0024 (AC-3).
const CUSTOM_LABEL = "Tùy chọn";
const FROM_LABEL = "Từ ngày";
const TO_LABEL = "Đến ngày";
const APPLY_LABEL = "Áp dụng";
const DAY_PLACEHOLDER = "Chọn ngày";

// The same range always gives the same key, so a panel is "open for" one range of the address and
// closes by itself when the address changes.
const keyOf = (range: DateRange | null) =>
  range === null ? "default" : `${range.from}_${range.to}`;

/**
 * The range of a statistics screen (spec 0024, AC-3): four quick ranges that end today in Vietnam
 * and "Tùy chọn", which opens two date fields and "Áp dụng". The pressed button is marked with
 * `aria-pressed`, which is the word a screen reader hears, and the buttons are at least 44 px high
 * below `md`. "Today" is read on each render and each press, never kept from mount, so a screen
 * left open past midnight presses the right days.
 */
export function RangeBar({ range, onChange }: RangeBarProps) {
  const rangeKey = keyOf(range);
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const open = openedFor === rangeKey;
  const active = activePreset(range, todayInVietnam(new Date()));

  // "Tùy chọn" is the pressed one while its panel is open, and when no quick range matches.
  const customPressed = open || active === "custom";

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="Khoảng ngày"
        className="flex flex-wrap gap-2"
      >
        {PRESET_DAYS.map((days) => {
          const pressed = !open && active === days;
          return (
            <Button
              key={days}
              type="button"
              variant={pressed ? "default" : "outline"}
              aria-pressed={pressed}
              className="max-md:h-11"
              onClick={() => {
                setOpenedFor(null);
                onChange(presetRange(days, todayInVietnam(new Date())));
              }}
            >
              {days} ngày
            </Button>
          );
        })}
        <Button
          type="button"
          variant={customPressed ? "default" : "outline"}
          aria-pressed={customPressed}
          aria-expanded={open}
          className="max-md:h-11"
          onClick={() => setOpenedFor(open ? null : rangeKey)}
        >
          {CUSTOM_LABEL}
        </Button>
      </div>
      {open && (
        <CustomRange
          // Mounted when the panel opens, so the draft is seeded from the range of that moment.
          key={rangeKey}
          initial={range ?? defaultRange(todayInVietnam(new Date()))}
          onApply={(next) => {
            setOpenedFor(null);
            onChange(next);
          }}
        />
      )}
    </div>
  );
}

// The two fields of a custom range. A draft that breaks the rules is not sent: the error is
// written under its field once "Áp dụng" has been pressed, and then follows the draft as it changes.
function CustomRange({
  initial,
  onApply,
}: {
  initial: DateRange;
  onApply: (range: DateRange | null) => void;
}) {
  const [draft, setDraft] = useState<RangeDraft>(initial);
  const [tried, setTried] = useState(false);
  const fromId = useId();
  const toId = useId();
  const fromErrorId = useId();
  const toErrorId = useId();

  const errors = tried ? validateRange(draft, todayInVietnam(new Date())) : {};

  const apply = () => {
    const today = todayInVietnam(new Date());
    if (Object.keys(validateRange(draft, today)).length > 0) {
      setTried(true);
      return;
    }
    // A pair equal to the 30 day default is no params, so the address stays clean.
    onApply(parseRange(draft.from, draft.to, today));
  };

  return (
    <Card role="group" aria-label="Khoảng ngày tùy chọn">
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:max-w-xl">
          <Field>
            <FieldLabel htmlFor={fromId}>{FROM_LABEL}</FieldLabel>
            <DatePicker
              id={fromId}
              placeholder={DAY_PLACEHOLDER}
              value={draft.from}
              onChange={(day) => setDraft((d) => ({ ...d, from: day }))}
              aria-invalid={errors.from !== undefined || undefined}
              aria-describedby={errors.from ? fromErrorId : undefined}
            />
            {errors.from && (
              <FieldError id={fromErrorId}>{errors.from}</FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor={toId}>{TO_LABEL}</FieldLabel>
            <DatePicker
              id={toId}
              placeholder={DAY_PLACEHOLDER}
              value={draft.to}
              onChange={(day) => setDraft((d) => ({ ...d, to: day }))}
              aria-invalid={errors.to !== undefined || undefined}
              aria-describedby={errors.to ? toErrorId : undefined}
            />
            {errors.to && <FieldError id={toErrorId}>{errors.to}</FieldError>}
          </Field>
        </div>
        <div>
          <Button type="button" className="max-md:h-11" onClick={apply}>
            {APPLY_LABEL}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
