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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import type { Ward } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { WARD_TEXTS } from "../texts";
import { matchWards } from "../ward-match";

type PickerSize = "default" | "lg";

// The value of the "all" row. A ward code is five digits, so it can never be this.
const ALL_VALUE = "__all__";

// The look of the Input and the Select trigger, 40 px high, or 44 px at `lg` (public pages).
const TRIGGER_CLASS =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-(length:--text-input) leading-(--text-input--line-height) transition-[color,box-shadow,border-color] focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive data-[size=default]:h-10 data-[size=lg]:h-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5";

export interface WardPanelProps {
  wards: readonly Ward[];
  value: string;
  size: PickerSize;
  /** Adds a first row that clears the choice (calls `onPick("")`) while nothing is typed. */
  allLabel?: string;
  onPick: (code: string) => void;
  onClose: () => void;
  /** Text already typed. Only the `/dev/ui` samples use it, to show a box that has a search. */
  initialText?: string;
}

// The search row and the rows under it. It mounts when the box opens and goes when it closes,
// so the typed text is empty on every open. The box has no filter of its own
// (`shouldFilter={false}`): the rows are exactly what `matchWards` returns, and the highlighted
// row is held here so it can be set after each typing.
export function WardPanel({
  wards,
  value,
  size,
  allLabel,
  onPick,
  onClose,
  initialText = "",
}: WardPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(initialText);
  const results = matchWards(wards, text);

  // The first row of what is shown: the "all" row while nothing is typed, else the best match.
  const firstRow = (typed: string, found: readonly Ward[]) =>
    allLabel && typed === "" ? ALL_VALUE : (found[0]?.code ?? "");
  // On open the chosen ward is highlighted. With no choice, or a code the catalog lacks, it is
  // the first row. `start` never changes, so the effect below runs once, when the box opens.
  const [start] = useState(() =>
    wards.some((ward) => ward.code === value)
      ? value
      : firstRow(initialText, results),
  );
  const [active, setActive] = useState(start);

  // Scroll the highlighted row to the middle of the list on open. cmdk scrolls by itself for
  // the arrow keys, not for this first highlight. `offsetTop` is measured from the list
  // (`relative`), and only the list scrolls, never the page behind it. The box gets its final
  // height a moment after it mounts (Radix measures the room left on the screen), so the row is
  // kept centered through that moment and then left alone: a later resize, such as the phone
  // keyboard opening, must not move a list the person is already using.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
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
    setText(next);
    setActive(firstRow(next, matchWards(wards, next)));
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  // Tab leaves the box: close it and let focus go back to the button (the Popover does that).
  // The Enter, arrow, Home and End keys are cmdk's, and it ignores them while an input method
  // (Telex) is still composing a word.
  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Command
      shouldFilter={false}
      loop
      label={WARD_TEXTS.searchLabel}
      value={active}
      onValueChange={setActive}
      className="min-h-0"
    >
      <CommandInput
        size={size}
        value={text}
        onValueChange={type}
        onKeyDown={onInputKeyDown}
        placeholder={WARD_TEXTS.searchHint}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="done"
        maxLength={60}
      />
      <CommandList
        ref={listRef}
        label={WARD_TEXTS.listLabel}
        className="max-h-88 min-h-0 flex-1"
      >
        <CommandGroup>
          {allLabel && text === "" && (
            <CommandItem
              value={ALL_VALUE}
              size={size}
              data-checked={value === ""}
              onSelect={() => onPick("")}
            >
              {allLabel}
              {value === "" && (
                <span className="sr-only">{WARD_TEXTS.chosen}</span>
              )}
            </CommandItem>
          )}
          {results.map((ward) => (
            <CommandItem
              key={ward.code}
              value={ward.code}
              size={size}
              data-checked={ward.code === value}
              onSelect={() => onPick(ward.code)}
            >
              {ward.name}
              {ward.code === value && (
                <span className="sr-only">{WARD_TEXTS.chosen}</span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      {/* Drawn from the match count, not from cmdk's own empty row. It sits beside the list,
          not inside it, because a listbox may only hold options. */}
      {results.length === 0 && (
        <p className="px-3 py-6 text-center text-sm text-muted-foreground">
          {WARD_TEXTS.noMatch(text)}
        </p>
      )}
      <div role="status" className="sr-only">
        {WARD_TEXTS.resultCount(results.length)}
      </div>
    </Command>
  );
}

export interface WardPickerViewProps extends Omit<
  ComponentProps<"button">,
  "value" | "onChange" | "type" | "children"
> {
  /** The catalog. `undefined` while it is missing: loading, or failed when `errorMessage` is set. */
  wards?: readonly Ward[];
  /** Set when the read failed and there is no catalog. Shows the alert and the retry button. */
  errorMessage?: string;
  /** True while the retry runs: the button is off. */
  retrying?: boolean;
  onRetry?: () => void;
  /** The ward `code` ("" for none). Never a name. */
  value: string;
  onChange: (code: string) => void;
  /** Adds a first row that clears the choice, and is the button text while nothing is chosen. */
  allLabel?: string;
  placeholder?: string;
  size?: PickerSize;
  /** Draws `<input type="hidden">` with the code, for a native form. Not drawn while empty. */
  name?: string;
  /** The element to draw the box into, `document.body` when not given (spec 0015, AC-18). */
  portalContainer?: HTMLElement | null;
}

/**
 * Draws a ward field and reads nothing: the catalog and its state come in as props, so the
 * `/dev/ui` samples show every state without a network call. `WardPicker` is the one that reads.
 */
export function WardPickerView({
  wards,
  errorMessage,
  retrying = false,
  onRetry,
  value,
  onChange,
  allLabel,
  placeholder = WARD_TEXTS.placeholder,
  size = "default",
  name,
  portalContainer,
  className,
  disabled,
  onKeyDown,
  "aria-describedby": describedBy,
  ...props
}: WardPickerViewProps) {
  const [open, setOpen] = useState(false);
  const valueId = useId();
  const boxId = useId();

  const failed = !wards && errorMessage !== undefined;
  const selected = wards?.find((ward) => ward.code === value);
  const emptyText = allLabel || placeholder;
  const text = wards
    ? selected
      ? selected.name
      : value === ""
        ? emptyText
        : WARD_TEXTS.unknownCode(value)
    : failed
      ? value === ""
        ? emptyText
        : WARD_TEXTS.codeOnly(value)
      : WARD_TEXTS.loading;

  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {/* A label outranks the content of a button, so the shown value is read as part of
              the description, as the date picker does. */}
          <button
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? boxId : undefined}
            aria-busy={!wards && !failed}
            aria-describedby={[valueId, describedBy].filter(Boolean).join(" ")}
            data-size={size}
            disabled={disabled || !wards}
            className={cn(FOCUS_RING, TRIGGER_CLASS, className)}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              // Enter and Space open it as a click; the arrow down opens it too, like a select.
              if (event.key === "ArrowDown" && !event.defaultPrevented) {
                event.preventDefault();
                setOpen(true);
              }
            }}
            {...props}
          >
            <span
              id={valueId}
              className={cn("truncate", !selected && "text-muted-foreground")}
            >
              {text}
            </span>
            <ChevronDownIcon aria-hidden className="text-muted-foreground" />
          </button>
        </PopoverTrigger>
        {/* Radix gives the box `role="dialog"`, and a dialog needs a name. It is as wide as the
            button and never taller than the room left on the screen. */}
        <PopoverContent
          id={boxId}
          container={portalContainer}
          align="start"
          collisionPadding={8}
          aria-label={WARD_TEXTS.boxLabel}
          className="max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) gap-0 overflow-hidden p-0"
        >
          {wards && (
            <WardPanel
              wards={wards}
              value={value}
              size={size}
              allLabel={allLabel}
              onPick={pick}
              onClose={() => setOpen(false)}
            />
          )}
        </PopoverContent>
      </Popover>

      {name && value !== "" && (
        <input type="hidden" name={name} value={value} />
      )}

      {failed && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>{WARD_TEXTS.errorTitle}</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={retrying}
              onClick={onRetry}
            >
              {retrying && <Spinner size="sm" />}
              {WARD_TEXTS.retry}
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
