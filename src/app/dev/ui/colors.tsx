import { CheckIcon, XIcon } from "lucide-react";
import { join } from "node:path";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  CONTROL_MIN,
  TEXT_MIN,
  evaluatePairs,
  formatRatio,
  loadTokens,
  toHex,
} from "../../../../scripts/check-contrast.mjs";
import { Section } from "./section";

// Full class names, so Tailwind sees them. Each surface is drawn with the text color made for it.
const SURFACES = [
  {
    name: "background",
    foreground: "foreground",
    className: "bg-background text-foreground",
  },
  {
    name: "card",
    foreground: "card-foreground",
    className: "bg-card text-card-foreground",
  },
  {
    name: "popover",
    foreground: "popover-foreground",
    className: "bg-popover text-popover-foreground",
  },
  {
    name: "primary",
    foreground: "primary-foreground",
    className: "bg-primary text-primary-foreground",
  },
  {
    name: "secondary",
    foreground: "secondary-foreground",
    className: "bg-secondary text-secondary-foreground",
  },
  {
    name: "muted",
    foreground: "muted-foreground",
    className: "bg-muted text-muted-foreground",
  },
  {
    name: "accent",
    foreground: "accent-foreground",
    className: "bg-accent text-accent-foreground",
  },
  {
    name: "destructive",
    foreground: "destructive-foreground",
    className: "bg-destructive text-destructive-foreground",
  },
  {
    name: "success",
    foreground: "success-foreground",
    className: "bg-success text-success-foreground",
  },
  {
    name: "warning",
    foreground: "warning-foreground",
    className: "bg-warning text-warning-foreground",
  },
  {
    name: "info",
    foreground: "info-foreground",
    className: "bg-info text-info-foreground",
  },
  {
    name: "sidebar",
    foreground: "sidebar-foreground",
    className: "bg-sidebar text-sidebar-foreground",
  },
  {
    name: "sidebar-primary",
    foreground: "sidebar-primary-foreground",
    className: "bg-sidebar-primary text-sidebar-primary-foreground",
  },
  {
    name: "sidebar-accent",
    foreground: "sidebar-accent-foreground",
    className: "bg-sidebar-accent text-sidebar-accent-foreground",
  },
] as const;

const LINES = [
  {
    name: "border",
    note: "Chỉ để trang trí, không phải đo",
    className: "border-border",
  },
  {
    name: "input",
    note: "Viền ô nhập, cần 3:1",
    className: "border-input",
  },
  {
    name: "ring",
    note: "Vòng lấy nét, cần 3:1",
    className: "border-ring",
  },
] as const;

type Result = ReturnType<typeof evaluatePairs>[number];
type ColorRef = Result["pair"]["fg"];

// A pair is drawn with the live CSS variables, so the sample cannot drift from globals.css.
const cssColor = (ref: ColorRef): string =>
  typeof ref === "string"
    ? `var(--${ref})`
    : `color-mix(in srgb, var(--${ref.token}) ${ref.alpha * 100}%, var(--${ref.over}))`;

function Sample({ result }: { result: Result }) {
  const { fg, bg, min } = result.pair;
  if (min === CONTROL_MIN) {
    return (
      <span
        aria-hidden="true"
        className="inline-block size-8 rounded-md border-2"
        style={{ borderColor: cssColor(fg), backgroundColor: cssColor(bg) }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="inline-block rounded-md px-2.5 py-1 text-sm font-medium"
      style={{ color: cssColor(fg), backgroundColor: cssColor(bg) }}
    >
      Aa
    </span>
  );
}

function PairsTable({
  caption,
  results,
}: {
  caption: string;
  results: Result[];
}) {
  return (
    <Table>
      <TableCaption className="sr-only">{caption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Màu chữ hoặc nét</TableHead>
          <TableHead>Trên nền</TableHead>
          <TableHead>Mẫu</TableHead>
          <TableHead className="text-right">Cần</TableHead>
          <TableHead className="text-right">Đo được</TableHead>
          <TableHead>Kết quả</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <TableRow key={`${result.fgLabel}|${result.bgLabel}`}>
            <TableCell>
              <code className="text-sm">{result.fgLabel}</code>
            </TableCell>
            <TableCell>
              <code className="text-sm">{result.bgLabel}</code>
            </TableCell>
            <TableCell>
              <Sample result={result} />
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {result.pair.min}:1
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {result.ratio === null ? "—" : `${formatRatio(result.ratio)}:1`}
            </TableCell>
            <TableCell>
              {result.pass ? (
                <Badge variant="success">
                  <CheckIcon data-icon="inline-start" />
                  Đạt
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XIcon data-icon="inline-start" />
                  Không đạt
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// The swatches and the table read the same file and the same PAIRS list as `npm run contrast`,
// which fails `npm run check` when a pair is under its limit (spec 0003, AC-10 and AC-11).
export function ColorsSection() {
  const tokens = loadTokens(join(process.cwd(), "src/app/globals.css"));
  const results = evaluatePairs(tokens);
  const failing = results.filter((result) => !result.pass).length;
  const texts = results.filter((result) => result.pair.min === TEXT_MIN);
  const controls = results.filter((result) => result.pair.min === CONTROL_MIN);

  return (
    <Section
      title="Màu và độ tương phản"
      description={`Giá trị đọc từ globals.css. Lệnh npm run contrast đo cùng ${results.length} cặp này và làm npm run check thất bại khi có cặp dưới ngưỡng${failing > 0 ? `, hiện có ${failing} cặp không đạt` : ""}.`}
    >
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {SURFACES.map(({ name, foreground, className }) => (
          <li
            key={name}
            className={cn(
              "flex min-w-0 flex-col gap-1 rounded-lg border p-3",
              className,
            )}
          >
            <span className="truncate text-sm font-semibold">{name}</span>
            <span className="text-base">Phòng trọ gần trường</span>
            <span className="truncate text-xs">
              {toHex(tokens[name])} · chữ {toHex(tokens[foreground])}
            </span>
          </li>
        ))}
      </ul>

      <ul className="grid gap-3 md:grid-cols-3">
        {LINES.map(({ name, note, className }) => (
          <li
            key={name}
            className="flex min-w-0 items-center gap-3 rounded-lg border bg-card p-3"
          >
            <span
              aria-hidden="true"
              className={cn("size-10 shrink-0 rounded-md border-4", className)}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">
                {name} · {toHex(tokens[name])}
              </span>
              <span className="text-xs text-muted-foreground">{note}</span>
            </span>
          </li>
        ))}
        <li className="flex min-w-0 items-center gap-3 rounded-lg border bg-card p-3">
          <span
            aria-hidden="true"
            className="size-10 shrink-0 rounded-md bg-overlay"
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">
              overlay · {toHex(tokens.overlay)}
            </span>
            <span className="text-xs text-muted-foreground">
              Nền mờ sau hộp thoại, không có chữ
            </span>
          </span>
        </li>
      </ul>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg md:text-xl">Chữ, cần {TEXT_MIN}:1</h3>
        <PairsTable
          caption="Các cặp màu chữ và nền, cần tỉ lệ tương phản từ 4,5 trên 1"
          results={texts}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-lg md:text-xl">
          Viền ô nhập và vòng lấy nét, cần {CONTROL_MIN}:1
        </h3>
        <PairsTable
          caption="Các cặp màu viền hoặc vòng lấy nét và nền, cần tỉ lệ tương phản từ 3 trên 1"
          results={controls}
        />
      </div>
    </Section>
  );
}
