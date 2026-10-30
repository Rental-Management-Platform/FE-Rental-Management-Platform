import { formatMoney } from "@/lib/format";

const WHOLE = /^\d+$/;

/**
 * The typed digits as money ("3500000" becomes "3.500.000 ₫"), or `null` while the text is
 * empty, not digits only, or too big to hold exactly. The text is trimmed first, like the
 * schema does, so a value the form will accept always shows its line.
 */
export function moneyPreviewText(typed: string, suffix = ""): string | null {
  const digits = typed.trim();
  if (!WHOLE.test(digits)) return null;
  const dong = Number(digits);
  return Number.isSafeInteger(dong) ? `${formatMoney(dong)}${suffix}` : null;
}

/**
 * The line under a money input. It is plain text with an id, not a live region, so a screen
 * reader does not announce it on every key press; the input lists the id in `aria-describedby`.
 * Draws nothing when there is nothing to show.
 */
export function MoneyPreview({
  id,
  typed,
  suffix,
}: {
  id: string;
  typed: string;
  suffix?: string;
}) {
  const text = moneyPreviewText(typed, suffix);
  if (text === null) return null;
  return (
    <p id={id} className="text-sm font-medium">
      {text}
    </p>
  );
}
