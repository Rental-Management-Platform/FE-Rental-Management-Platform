import type { DateOnly } from "@/lib/api/types";
import { formatCount, formatDateOnly } from "@/lib/format";

export interface SeriesColumn<K extends string> {
  key: K;
  label: string;
}

interface SeriesTableProps<K extends string> {
  /** Names the range: "Số liệu theo ngày từ 21/10/2026 đến 19/11/2026". */
  caption: string;
  columns: readonly SeriesColumn<K>[];
  rows: readonly ({ date: DateOnly } & Record<K, number>)[];
}

/**
 * The chart as words (spec 0024, AC-9): a native table with one row per day, for a person who
 * reads by screen reader or by keyboard. The rows scroll inside a labelled region, which is a
 * keyboard stop so the arrow keys scroll it, and the header stays while they do. There is no
 * totals row: the total of a column is the number on its card, never a sum made here.
 */
export function SeriesTable<K extends string>({
  caption,
  columns,
  rows,
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
                  {formatCount(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
