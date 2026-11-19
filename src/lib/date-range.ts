// The rules of a date range for the statistics screens (spec 0024, AC-2 and AC-3). Pure: no React,
// no clock of its own, so every function takes the day it needs and can be read and tested alone.
// A day is a `YYYY-MM-DD` text, the calendar day in Vietnam, and is never moved by a time zone.
import type { DateOnly } from "@/lib/api/types";
import { TIME_ZONE } from "@/lib/format";

/** The longest range the API accepts, both ends counted (api-for-frontend.md, 6.42). */
export const MAX_RANGE_DAYS = 366;

/** The range the API picks when no `from` and `to` are sent. */
export const DEFAULT_RANGE_DAYS = 30;

/** The quick ranges of the range bar, in days. */
export const PRESET_DAYS = [7, 30, 90, 365] as const;
export type PresetDays = (typeof PRESET_DAYS)[number];

export interface DateRange {
  from: DateOnly;
  to: DateOnly;
}

/** Which button of the range bar is pressed: a quick range, or "Tùy chọn". */
export type ActivePreset = PresetDays | "custom";

const MS_PER_DAY = 86_400_000;
const FIRST_YEAR = 2000;
const LAST_YEAR = 2100;

const DAY_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The day it is now in Vietnam: "2026-11-20". Read it when it is needed, never keep it from mount. */
export const todayInVietnam = (now: Date): DateOnly => DAY_PARTS.format(now);

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

// Days since 1970-01-01 of a real calendar day with a year from 2000 to 2100, else `null`
// ("2026-02-30" is not a real day, and neither is "0999-01-01" for this API).
function dayNumber(value: string): number | null {
  const match = DATE_ONLY.exec(value);
  if (match === null) return null;
  const [year, month, day] = match.slice(1).map(Number);
  if (year < FIRST_YEAR || year > LAST_YEAR) return null;
  const time = Date.UTC(year, month - 1, day);
  const date = new Date(time);
  const real =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return real ? time / MS_PER_DAY : null;
}

/** True for a real calendar day written `YYYY-MM-DD`, in the years 2000 to 2100. */
export const isRealDay = (value: string): boolean => dayNumber(value) !== null;

/** The day `count` days after `date` (before it when `count` is negative). `date` must be a real day. */
export function addDays(date: DateOnly, count: number): DateOnly {
  const base = dayNumber(date);
  if (base === null) throw new RangeError(`Not a real day: ${date}`);
  return new Date((base + count) * MS_PER_DAY).toISOString().slice(0, 10);
}

/** How many days the range holds, both ends counted. Both must be real days. */
export function daysInRange(from: DateOnly, to: DateOnly): number {
  const start = dayNumber(from);
  const end = dayNumber(to);
  if (start === null || end === null) {
    throw new RangeError(`Not a real range: ${from} to ${to}`);
  }
  return end - start + 1;
}

// What the contract allows: two real days, `from` not after `to`, 1 to 366 days long.
function isAllowedRange(from: string, to: string): boolean {
  const start = dayNumber(from);
  const end = dayNumber(to);
  if (start === null || end === null) return false;
  const days = end - start + 1;
  return days >= 1 && days <= MAX_RANGE_DAYS;
}

const isDefaultRange = (from: DateOnly, to: DateOnly, today: DateOnly) =>
  to === today && from === addDays(today, -(DEFAULT_RANGE_DAYS - 1));

/**
 * The range of an address (`?from=&to=`), or `null` for "no params" (the last 30 days). Anything
 * that breaks the contract is treated as no params and never sent: one of the two missing, a bad
 * format, an impossible day, reversed, or longer than 366 days. A pair equal to the 30 day default
 * for `today` is also `null`, so the cache key and the request are the default ones.
 */
export function parseRange(
  from: string | null,
  to: string | null,
  today: DateOnly,
): DateRange | null {
  if (from === null || to === null) return null;
  if (!isAllowedRange(from, to)) return null;
  return isDefaultRange(from, to, today) ? null : { from, to };
}

/**
 * The 30 days the API reads when nothing is sent: the days a custom range starts from when the
 * address holds none.
 */
export const defaultRange = (today: DateOnly): DateRange => ({
  from: addDays(today, -(DEFAULT_RANGE_DAYS - 1)),
  to: today,
});

/**
 * The range a quick button writes: `days` days that end `today`. The 30 day button writes no
 * params, so it is `null` (the same as the address with nothing in it).
 */
export function presetRange(
  days: PresetDays,
  today: DateOnly,
): DateRange | null {
  if (days === DEFAULT_RANGE_DAYS) return null;
  return { from: addDays(today, -(days - 1)), to: today };
}

/**
 * The pressed button for the range in the address. With no params it is the 30 day button and no
 * date is worked out. Otherwise it is the quick range whose two dates equal the pair, for `today`,
 * and a range that matches none is "custom".
 */
export function activePreset(
  range: DateRange | null,
  today: DateOnly,
): ActivePreset {
  if (range === null) return DEFAULT_RANGE_DAYS;
  const match = PRESET_DAYS.find((days) => {
    const preset = presetRange(days, today);
    return (
      preset !== null && preset.from === range.from && preset.to === range.to
    );
  });
  return match ?? "custom";
}

/** The two fields of the custom range, `""` while a day is not chosen. */
export interface RangeDraft {
  from: DateOnly | "";
  to: DateOnly | "";
}

export interface RangeErrors {
  from?: string;
  to?: string;
}

/**
 * The error of each field of a draft, in the words of the screen. An empty object means the draft
 * can be sent. A draft whose `to` is after `today` is refused here although the address would take
 * it, because the screen asks for days that have started.
 */
export function validateRange(draft: RangeDraft, today: DateOnly): RangeErrors {
  const { from, to } = draft;
  if (from === "" || dayNumber(from) === null) {
    return {
      from: "Chọn ngày bắt đầu",
      ...(to === "" ? { to: "Chọn ngày kết thúc" } : {}),
    };
  }
  if (to === "" || dayNumber(to) === null) return { to: "Chọn ngày kết thúc" };
  if (daysInRange(from, to) < 1) {
    return { from: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc" };
  }
  if (to > today) return { to: "Ngày kết thúc không được sau hôm nay" };
  if (daysInRange(from, to) > MAX_RANGE_DAYS) {
    return { to: `Khoảng tối đa là ${MAX_RANGE_DAYS} ngày` };
  }
  return {};
}

/** The query of the request for a range: both days, or nothing for the default. */
export const rangeQuery = (
  range: DateRange | null,
): { from?: DateOnly; to?: DateOnly } =>
  range === null ? {} : { from: range.from, to: range.to };

/** The address of `pathname` for a range: `/landlord?from=…&to=…`, or `/landlord` for the default. */
export function rangeHref(pathname: string, range: DateRange | null): string {
  return range === null
    ? pathname
    : `${pathname}?from=${range.from}&to=${range.to}`;
}
