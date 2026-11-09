// Text for people: waits, money, area and dates (`vi-VN`, `Asia/Ho_Chi_Minh`).
import type { DateOnly, IsoDateTime } from "@/lib/api/types";

export const TIME_ZONE = "Asia/Ho_Chi_Minh";

const MONEY = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const AREA = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const COUNT = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const RATING = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const DAY = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** 3500000 becomes "3.500.000 ₫". */
export const formatMoney = (dong: number) => MONEY.format(dong);

/** A whole count, grouped the Vietnamese way: 1234 becomes "1.234". */
export const formatCount = (count: number) => COUNT.format(count);

/** A star average with one decimal, the Vietnamese way: 4.25 becomes "4,3" and 4 becomes "4,0". */
export const formatRating = (average: number) => RATING.format(average);

/** 22.5 becomes "22,5 m²". */
export const formatArea = (m2: number) => `${AREA.format(m2)} m²`;

/** A UTC instant from the API, shown as a day in Vietnam: "16/10/2026". */
export const formatDateTime = (iso: IsoDateTime) => DAY.format(new Date(iso));

/**
 * A date without a time ("2026-11-01"). It is read as midnight in Vietnam, so it never moves
 * to the day before when the viewer is in another time zone.
 */
export const formatDateOnly = (date: DateOnly) =>
  DAY.format(new Date(`${date}T00:00:00+07:00`));

/** "0901234567" becomes "0901 234 567". Any other shape is shown as it came. */
export const formatPhone = (phone: string) =>
  phone.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");

// Chat times (spec 0012, AC-13). Every one takes `now` as an argument and cuts the day at midnight
// in Vietnam, so the same answer comes out on any machine and a test can pass any `now`.
const CLOCK = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const DAY_KEY = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const MS_PER_DAY = 86_400_000;

// "2026-11-05": a day of Vietnam, comparable as text. Vietnam has no summer time, so the day
// before an instant is exactly 24 hours earlier.
const dayKeyOf = (date: Date) => DAY_KEY.format(date);

/** True when two instants fall on the same day of Vietnam. The conversation draws a divider when not. */
export const isSameChatDay = (a: IsoDateTime, b: IsoDateTime) =>
  dayKeyOf(new Date(a)) === dayKeyOf(new Date(b));

/** A UTC instant as the 24 hour clock of Vietnam: "14:05". */
export const formatClock = (iso: IsoDateTime) => CLOCK.format(new Date(iso));

/**
 * The divider between two days of a conversation: "Hôm nay", "Hôm qua", or the date
 * ("05/11/2026") for anything older.
 */
export function chatDayLabel(iso: IsoDateTime, now: Date): string {
  const key = dayKeyOf(new Date(iso));
  if (key === dayKeyOf(now)) return "Hôm nay";
  if (key === dayKeyOf(new Date(now.getTime() - MS_PER_DAY))) return "Hôm qua";
  return formatDateTime(iso);
}

/**
 * The time on a row of the inbox: the clock for today ("14:05"), "Hôm qua", the day and month for
 * the same year ("05/11"), and the full date for an earlier year ("05/11/2025").
 */
export function inboxTimeLabel(iso: IsoDateTime, now: Date): string {
  const date = new Date(iso);
  const key = dayKeyOf(date);
  if (key === dayKeyOf(now)) return formatClock(iso);
  if (key === dayKeyOf(new Date(now.getTime() - MS_PER_DAY))) return "Hôm qua";
  // The day and month are cut from the key: `vi-VN` writes them with a dash ("05-11") when the
  // year is left out.
  return key.slice(0, 4) === dayKeyOf(now).slice(0, 4)
    ? `${key.slice(8, 10)}/${key.slice(5, 7)}`
    : formatDateTime(iso);
}

const MINUTE = 60;
const HOUR = 3600;

export interface FormatWaitOptions {
  /** True when the seconds were guessed, not read from `Retry-After`: adds "khoảng". */
  approximate?: boolean;
}

/**
 * How long to wait, in Vietnamese: under a minute "N giây", under an hour "N phút", else
 * "N giờ". Always rounded up, so the text never promises less than the real wait.
 */
export function formatWait(
  seconds: number,
  { approximate = false }: FormatWaitOptions = {},
): string {
  const whole = Math.max(0, Math.ceil(seconds));
  const text =
    whole < MINUTE
      ? `${whole} giây`
      : whole < HOUR
        ? `${Math.ceil(whole / MINUTE)} phút`
        : `${Math.ceil(whole / HOUR)} giờ`;
  return approximate ? `khoảng ${text}` : text;
}
