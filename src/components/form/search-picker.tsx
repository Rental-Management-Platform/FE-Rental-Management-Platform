"use client";

import { ChevronDownIcon, CircleAlertIcon } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { PICKER_TRIGGER_CLASS } from "./picker-trigger-class";
import { SEARCH_PICKER_TEXT } from "./search-picker-text";

type PickerSize = "default" | "lg";

// The value of the "all" row. An id is a UUID, so it can never be this.
const ALL_VALUE = "__all__";

export interface SearchPickerOption {
  value: string;
  label: string;
}

export interface SearchPickerProps extends Omit<
  ComponentProps<"button">,
  "value" | "onChange" | "type" | "children"
> {
  /** The chosen value, or `null` for none. */
  value: string | null;
  /** The words on the button for the chosen value (the picker may not hold that row). */
  valueLabel: string;
  /** Adds a first row that clears the choice, and is the button text while nothing is chosen. */
  allLabel?: string;
  /** The button text while nothing is chosen and there is no `allLabel`. */
  placeholder?: string;
  /** The rows to show now. The picker never filters: the owner decides what matches. */
  options: readonly SearchPickerOption[];
  /** The text in the search row. The owner holds it, so it can ask a server or filter a list. */
  text: string;
  onTextChange: (text: string) => void;
  /** Called when the box opens or closes, so the owner can clear the text on close. */
  onOpenChange?: (open: boolean) => void;
  /** The row picked: its value, or `null` for the "all" row. */
  onPick: (value: string | null) => void;
  /** The box is a dialog and needs a name. */
  boxLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  listLabel: string;
  /** Shown when no row is left and nothing is loading. */
  noMatchText: string;
  /** The rows are being read: a line says so, and a screen reader hears it. */
  busy?: boolean;
  /** Set when the read failed. Shows the alert and, with `onRetry`, the retry button. */
  failedText?: string;
  onRetry?: () => void;
  /** A line under the rows, such as "showing 50 of 1,000". Not shown while busy. */
  footnote?: string;
  size?: PickerSize;
  /** The element to draw the box into, `document.body` when not given. */
  portalContainer?: HTMLElement | null;
}

interface PanelProps extends Pick<
  SearchPickerProps,
  | "value"
  | "allLabel"
  | "options"
  | "text"
  | "onTextChange"
  | "onPick"
  | "searchLabel"
  | "searchPlaceholder"
  | "listLabel"
  | "noMatchText"
  | "busy"
  | "failedText"
  | "onRetry"
  | "footnote"
> {
  size: PickerSize;
  onClose: () => void;
}

// The search row and the rows under it. It mounts when the box opens and goes when it closes, so
// the chosen row is the highlighted one on every open. The box has no filter of its own
// (`shouldFilter={false}`): the rows are exactly `options`, and the highlighted row is worked out
// from them on every draw, so rows that arrive late (a server answer) never leave it on a row that
// is gone.
function SearchPickerPanel({
  value,
  allLabel,
  options,
  text,
  onTextChange,
  onPick,
  searchLabel,
  searchPlaceholder,
  listLabel,
  noMatchText,
  busy = false,
  failedText,
  onRetry,
  footnote,
  size,
  onClose,
}: PanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const showAll = allLabel !== undefined && text.trim() === "";
  const rows = [
    ...(showAll ? [ALL_VALUE] : []),
    ...options.map((option) => option.value),
  ];
  const chosenRow = value ?? (allLabel !== undefined ? ALL_VALUE : null);

  // `null` until the person moves the highlight; `typed` once they type, so the best match is the
  // first row and not the chosen one.
  const [active, setActive] = useState<string | null>(null);
  const [typed, setTyped] = useState(false);
  const current =
    active !== null && rows.includes(active)
      ? active
      : !typed && chosenRow !== null && rows.includes(chosenRow)
        ? chosenRow
        : (rows[0] ?? "");

  // `start` never changes, so the effect below runs once, when the box opens.
  const [start] = useState(chosenRow ?? "");

  // Scroll the chosen row to the middle of the list on open. cmdk scrolls by itself for the arrow
  // keys, not for this first highlight. `offsetTop` is measured from the list (`relative`), and
  // only the list scrolls, never the page behind it. The box gets its final height a moment after
  // it mounts (Radix measures the room left on the screen), so the row is kept centered through
  // that moment and then left alone, as the ward picker does.
  useEffect(() => {
    const list = listRef.current;
    if (!list || start === "") return;
    const center = () => {
      const row = list.querySelector<HTMLElement>(
        `[cmdk-item][data-value="${CSS.escape(start)}"]`,
      );
      if (row) {
        list.scrollTop =
          row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
      }
    };
    center();
    const observer = new ResizeObserver(center);
    observer.observe(list);
    const stop = window.setTimeout(() => observer.disconnect(), 300);
    return () => {
      window.clearTimeout(stop);
      observer.disconnect();
    };
  }, [start]);

  const type = (next: string) => {
    onTextChange(next);
    setActive(null);
    setTyped(true);
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  // Tab leaves the box: close it and let focus go back to the button (the Popover does that). The
  // Enter, arrow, Home and End keys are cmdk's, and it ignores them while an input method (Telex)
  // is still composing a word.
  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      onClose();
    }
  };

  const failed = failedText !== undefined;

  return (
    <Command
      shouldFilter={false}
      loop
      label={searchLabel}
      value={current}
      onValueChange={setActive}
      className="min-h-0"
    >
      <CommandInput
        size={size}
        value={text}
        onValueChange={type}
        onKeyDown={onInputKeyDown}
        placeholder={searchPlaceholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="done"
        maxLength={100}
      />
      <CommandList
        ref={listRef}
        label={listLabel}
        aria-busy={busy}
        className="max-h-88 min-h-0 flex-1"
      >
        <CommandGroup>
          {showAll && (
            <CommandItem
              value={ALL_VALUE}
              size={size}
              data-checked={value === null}
              onSelect={() => onPick(null)}
            >
              {allLabel}
              {value === null && (
                <span className="sr-only">{SEARCH_PICKER_TEXT.chosen}</span>
              )}
            </CommandItem>
          )}
          {options.map((option) => (
            <CommandItem
              key={option.value}
              value={option.value}
              size={size}
              className="wrap-anywhere"
              data-checked={option.value === value}
              onSelect={() => onPick(option.value)}
            >
              {option.label}
              {option.value === value && (
                <span className="sr-only">{SEARCH_PICKER_TEXT.chosen}</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      {/* Drawn from the row count, not from cmdk's own empty row. These sit beside the list, not
          inside it, because a listbox may only hold options. */}
      {failed && (
        <div className="p-2">
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>
              <p>{failedText}</p>
              {onRetry && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={onRetry}
                >
                  {busy && <Spinner size="sm" />}
                  {SEARCH_PICKER_TEXT.retry}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {!failed && !busy && options.length === 0 && (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
          {noMatchText}
        </p>
      )}
      {busy && !failed && (
        <p className="flex items-center gap-2 border-t px-3 py-2 text-sm text-muted-foreground">
          <Spinner size="sm" aria-hidden role="presentation" />
          {SEARCH_PICKER_TEXT.searching}
        </p>
      )}
      {!busy && !failed && footnote !== undefined && options.length > 0 && (
        <p className="border-t px-3 py-2 text-sm text-muted-foreground">
          {footnote}
        </p>
      )}
      <div role="status" className="sr-only">
        {busy
          ? SEARCH_PICKER_TEXT.searching
          : SEARCH_PICKER_TEXT.resultCount(options.length)}
      </div>
    </Command>
  );
}

/**
 * A field that opens a box with a search row and a list of rows to pick from. It draws what it is
 * given and reads nothing: the owner holds the typed text and decides which rows match, by asking
 * a server (the landlord filter, whose list is too long to load) or by filtering a list it already
 * has (the property of a new listing). It is the ward picker's shape without the ward catalog: the
 * same button, the same box, the same keys, so a list that grows over time never becomes a long
 * scroll.
 */
export function SearchPicker({
  value,
  valueLabel,
  allLabel,
  placeholder,
  options,
  text,
  onTextChange,
  onOpenChange,
  onPick,
  boxLabel,
  searchLabel,
  searchPlaceholder,
  listLabel,
  noMatchText,
  busy,
  failedText,
  onRetry,
  footnote,
  size = "default",
  portalContainer,
  className,
  disabled,
  onKeyDown,
  "aria-describedby": describedBy,
  ...props
}: SearchPickerProps) {
  const [open, setOpen] = useState(false);
  const valueId = useId();
  const boxId = useId();

  const change = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const pick = (next: string | null) => {
    onPick(next);
    change(false);
  };

  const empty = value === null;
  const shown = empty ? (allLabel ?? placeholder ?? "") : valueLabel;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Popover open={open} onOpenChange={change}>
        <PopoverTrigger asChild>
          {/* A label outranks the content of a button, so the shown value is read as part of the
              description, as the ward picker and the date picker do. */}
          <button
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? boxId : undefined}
            aria-describedby={[valueId, describedBy].filter(Boolean).join(" ")}
            data-size={size}
            disabled={disabled}
            className={cn(FOCUS_RING, PICKER_TRIGGER_CLASS, className)}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              // Enter and Space open it as a click; the arrow down opens it too, like a select.
              if (event.key === "ArrowDown" && !event.defaultPrevented) {
                event.preventDefault();
                change(true);
              }
            }}
            {...props}
          >
            <span
              id={valueId}
              className={cn(
                "truncate",
                empty && allLabel === undefined && "text-muted-foreground",
              )}
            >
              {shown}
            </span>
            <ChevronDownIcon aria-hidden className="text-muted-foreground" />
          </button>
        </PopoverTrigger>
        {/* Radix gives the box `role="dialog"`, and a dialog needs a name. It is as wide as the
            button, or 22 rem when the button is narrower, so an email in a row is not cut off in a
            narrow filter column; it never goes past the room left on the screen, and never taller
            than it. */}
        <PopoverContent
          id={boxId}
          container={portalContainer}
          align="start"
          collisionPadding={8}
          aria-label={boxLabel}
          className="max-h-(--radix-popover-content-available-height) w-[max(var(--radix-popover-trigger-width),22rem)] max-w-(--radix-popover-content-available-width) gap-0 overflow-hidden p-0"
        >
          <SearchPickerPanel
            value={value}
            allLabel={allLabel}
            options={options}
            text={text}
            onTextChange={onTextChange}
            onPick={pick}
            searchLabel={searchLabel}
            searchPlaceholder={searchPlaceholder}
            listLabel={listLabel}
            noMatchText={noMatchText}
            busy={busy}
            failedText={failedText}
            onRetry={onRetry}
            footnote={footnote}
            size={size}
            onClose={() => change(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
