import type { DateOnly } from "@/lib/api/types";
import { formatCount, formatDateOnly } from "@/lib/format";

export interface SeriesColumn<K extends string> {
  key: K;
  label: string;
  /** How a number of this column is written: `formatCount` unless a column holds money. */
  format?: (value: number) => string;
}

/** A last row, drawn under the days: the label and the number of each column, taken from the answer. */
export interface SeriesFooter<K extends string> {
  label: string;
  values: Record<K, number>;
}

interface SeriesTableProps<K extends string> {
  /** Names the range: "Số liệu theo ngày từ 21/10/2026 đến 19/11/2026". */
  caption: string;
  columns: readonly SeriesColumn<K>[];
  rows: readonly ({ date: DateOnly } & Record<K, number>)[];
  /** A last row such as "Tổng". Its numbers come from the answer, never from a sum made here. */
  footer?: SeriesFooter<K>;
}

/**
 * The chart as words (spec 0024, AC-9): a native table with one row per day, for a person who
 * reads by screen reader or by keyboard. The rows scroll inside a labelled region, which is a
 * keyboard stop so the arrow keys scroll it, and the header stays while they do. A totals row
 * exists only when the screen gives a `footer`: the total of a column is a number of the answer,
 * never a sum made here (spec 0026, AC-9).
 */
export function SeriesTable<K extends string>({
  caption,
  columns,
  rows,
  footer,
}: SeriesTableProps<K>) {
  return (
    <div
      role="region"
      aria-label="Bảng số liệu theo ngày"
      tabIndex={0}
      className="max-h-80 overflow-auto rounded-lg border outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <table className="w-full caption-top text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky top-0 h-10 border-b bg-muted px-3 text-left font-medium whitespace-nowrap text-foreground"
            >
              Ngày
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="sticky top-0 h-10 border-b bg-muted px-3 text-right font-medium whitespace-nowrap text-foreground"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date} className="border-b last:border-0">
              <th
                scope="row"
                className="px-3 py-2 text-left font-normal whitespace-nowrap"
              >
                {formatDateOnly(row.date)}
              </th>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="px-3 py-2 text-right whitespace-nowrap tabular-nums"
                >
                  {(column.format ?? formatCount)(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer !== undefined && (
          <tfoot>
            <tr>
              <th
                scope="row"
                className="sticky bottom-0 h-10 border-t bg-muted px-3 text-left font-medium whitespace-nowrap text-foreground"
              >
                {footer.label}
              </th>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className="sticky bottom-0 h-10 border-t bg-muted px-3 text-right font-medium whitespace-nowrap text-foreground tabular-nums"
                >
                  {(column.format ?? formatCount)(footer.values[column.key])}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
