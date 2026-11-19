// What a statistics number says about how it changed (spec 0024, AC-7). Pure: no React and no
// clock. The API already worked out every percent and every number of points, so nothing is divided
// here: the only decisions are the sign, the arrow, the tone and the words. Colour is never the
// only carrier, so every note has its sign and a sentence for a screen reader.
import type { Metric, RateMetric } from "@/lib/api/types";
import { formatPercent, formatPoints, formatSignedPercent } from "@/lib/format";

/** `positive` is drawn green, `negative` red, `muted` in the quiet colour. */
export type ChangeTone = "positive" | "negative" | "muted";

export interface ChangeNote {
  /** The arrow in front of the text, or `null` for no change, a new number and a dash. */
  arrow: "up" | "down" | null;
  tone: ChangeTone;
  /** What is drawn: "+33,3%", "-40%", "0%", "Mới", "–", "giảm 5 điểm". */
  text: string;
  /** What a screen reader says in its place (the arrow and the text are hidden from it). */
  spoken: string;
}

/** The dash that stands for "no number" or "no change" where both periods are 0. */
export const DASH = "–";

export interface DescribeOptions {
  /**
   * Spending more is neither good nor bad, so money keeps the arrow and the sign and draws
   * them in the muted colour.
   */
  neutral?: boolean;
}

const toneOf = (change: number, neutral: boolean): ChangeTone =>
  neutral || change === 0 ? "muted" : change > 0 ? "positive" : "negative";

/**
 * The note of a Metric of a period. With a `changePercent` it is an arrow, a signed percent and
 * words; `changePercent` is `null` when the period before is 0, so it says "Mới" when this period
 * has something and a dash when both are 0.
 */
export function describeChange(
  { value, changePercent }: Pick<Metric, "value" | "changePercent">,
  { neutral = false }: DescribeOptions = {},
): ChangeNote {
  if (changePercent === null) {
    return value > 0
      ? {
          arrow: null,
          tone: "muted",
          text: "Mới",
          spoken: "mới, kỳ trước là 0",
        }
      : {
          arrow: null,
          tone: "muted",
          text: DASH,
          spoken: "cả hai kỳ đều là 0",
        };
  }
  if (changePercent === 0) {
    return {
      arrow: null,
      tone: "muted",
      text: formatSignedPercent(0),
      spoken: "không đổi so với kỳ trước",
    };
  }
  const rise = changePercent > 0;
  return {
    arrow: rise ? "up" : "down",
    tone: toneOf(changePercent, neutral),
    text: formatSignedPercent(changePercent),
    spoken: `${rise ? "tăng" : "giảm"} ${formatPercent(Math.abs(changePercent))}% so với kỳ trước`,
  };
}

export interface RateReading {
  /** "75%", or a dash when the period opened no conversation. */
  value: string;
  /** The change in points, or `null` when there is nothing to compare. */
  change: ChangeNote | null;
  /** The sentence for a period with no sample, or `null`. */
  note: string | null;
}

/** Said under a rate that has no value, because no conversation was opened in the range. */
export const NO_RATE_NOTE = "Chưa có cuộc trò chuyện nào mở trong khoảng này";

/**
 * The reading of a rate such as the reply rate. It changes by percentage points, not by percent:
 * 75 against 80 is "giảm 5 điểm", never "giảm 6,3%". A period with no sample has no value (a dash,
 * never 0%), and a change that is missing is simply not shown.
 */
export function describeRate({
  value,
  changePoints,
}: Pick<RateMetric, "value" | "changePoints">): RateReading {
  if (value === null) return { value: DASH, change: null, note: NO_RATE_NOTE };
  const reading = `${formatPercent(value)}%`;
  if (changePoints === null)
    return { value: reading, change: null, note: null };
  if (changePoints === 0) {
    return {
      value: reading,
      change: {
        arrow: null,
        tone: "muted",
        text: "không đổi",
        spoken: "không đổi so với kỳ trước",
      },
      note: null,
    };
  }
  const rise = changePoints > 0;
  const words = `${rise ? "tăng" : "giảm"} ${formatPoints(Math.abs(changePoints))} điểm`;
  return {
    value: reading,
    change: {
      arrow: rise ? "up" : "down",
      tone: rise ? "positive" : "negative",
      text: words,
      spoken: `${words} so với kỳ trước`,
    },
    note: null,
  };
}
