// The words of each dashboard number (spec 0008, "Value sourcing"). Pure: no React, no network,
// so the rules can be read and tested on their own. Nothing is computed here beyond joining text
// and formatting; every figure is a field or a `total` the backend returned.
import type { StatKey } from "@/components/shells/workspace-tools";
import type { CountSource, SourceValue } from "./api/stats";
import { formatCount } from "@/lib/format";

const totalOf = (
  values: readonly SourceValue[],
  source: CountSource,
): number | undefined => {
  const found = values.find((value) => value.source === source);
  return found?.total;
};

/** "Đã có 3 nhà trọ", or "Chưa có nhà trọ nào" when there is none. */
const propertyCountLines = (values: readonly SourceValue[]): string[] => {
  const total = totalOf(values, "properties");
  if (total === undefined) return [];
  return [
    total > 0 ? `Đã có ${formatCount(total)} nhà trọ` : "Chưa có nhà trọ nào",
  ];
};

/** The lines under a card's description. Empty when none of its sources is known. */
export function describeStat(
  stat: StatKey,
  values: readonly SourceValue[],
): string[] {
  switch (stat) {
    case "propertyCount":
      return propertyCountLines(values);
    default:
      return [];
  }
}
