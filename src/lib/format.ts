// Text for people. Money, area and dates join this file with the first feature that shows
// one (`vi-VN`, `Asia/Ho_Chi_Minh`).

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
