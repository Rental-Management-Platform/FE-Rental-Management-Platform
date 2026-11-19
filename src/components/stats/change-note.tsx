import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChangeNote, ChangeTone } from "./describe-change";

const TONE: Record<ChangeTone, string> = {
  positive: "text-success",
  negative: "text-destructive",
  muted: "text-muted-foreground",
};

/**
 * How a number changed against the period before (spec 0024, AC-7): an arrow, a signed percent
 * or a few words, in green, red or the quiet colour. Colour is never the only carrier: what is
 * drawn is hidden from a screen reader, which hears the `spoken` sentence instead.
 */
export function ChangeNoteView({
  note,
  className,
}: {
  note: ChangeNote;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        TONE[note.tone],
        className,
      )}
    >
      <span aria-hidden="true" className="inline-flex items-center gap-1">
        {note.arrow === "up" && <ArrowUpIcon className="size-4" />}
        {note.arrow === "down" && <ArrowDownIcon className="size-4" />}
        {note.text}
      </span>
      <span className="sr-only">{note.spoken}</span>
    </span>
  );
}
