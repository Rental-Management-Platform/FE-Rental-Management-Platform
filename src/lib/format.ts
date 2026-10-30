// Text for people: waits, money, area and dates (`vi-VN`, `Asia/Ho_Chi_Minh`).
import type { DateOnly, IsoDateTime } from "@/lib/api/types";

export const TIME_ZONE = "Asia/Ho_Chi_Minh";

const MONEY = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});
const AREA = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const DAY = new Intl.DateTimeFormat("vi-VN", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** 3500000 becomes "3.500.000 ₫". */
export const formatMoney = (dong: number) => MONEY.format(dong);

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
