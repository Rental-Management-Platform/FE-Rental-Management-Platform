// The lines of the daily chart (spec 0024, AC-8, and spec 0025, AC-10): what one line is, how a day
// row names its numbers, and how the first and the second line look. Pure, and kept apart from the
// chart so the legend can use it without loading the chart library.
import type { DateOnly } from "@/lib/api/types";

/** One line of the chart. */
export interface ChartLine {
  /** The field of a day row that holds this line's number. */
  key: string;
  /** The name of the line, in the legend and the tooltip: "Chủ trọ". */
  name: string;
  /** The unit word of the tooltip with one line: "16/11/2026: 70 lượt xem". */
  unit: string;
}

/** A chart has one or two lines, never more. */
export type ChartLines = readonly [ChartLine] | readonly [ChartLine, ChartLine];

/** One day of the chart: the date and one number for each line, under that line's `key`. */
export interface TrendPoint {
  date: DateOnly;
  [lineKey: string]: string | number;
}

export interface LineStyle {
  /** A color token, never a raw color. */
  color: string;
  /** The dash pattern of the stroke; none is a solid line. */
  dash: string | undefined;
  /** Whether a light area is drawn under the line. */
  area: boolean;
}

// The first line is the `primary` token on a light area. The second is the `info` token, dashed and
// with no area, so color is never the only difference between them.
const FIRST: LineStyle = {
  color: "var(--primary)",
  dash: undefined,
  area: true,
};
const SECOND: LineStyle = { color: "var(--info)", dash: "6 4", area: false };

/** How the line at this position of `lines` is drawn. */
export const lineStyle = (index: number): LineStyle =>
  index === 0 ? FIRST : SECOND;
