"use client";

import { ChevronDownIcon } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
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
import type { Ward } from "@/lib/api/types";
import { FOCUS_RING } from "@/lib/focus-ring";
import { cn } from "@/lib/utils";
import { useWards } from "../hooks/use-wards";
import { WARD_TEXTS } from "../texts";
import { matchWards } from "../ward-match";

type PickerSize = "default" | "lg";

// The look of the Input and the Select trigger, 40 px high, or 44 px at `lg` (public pages).
const TRIGGER_CLASS =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-(length:--text-input) leading-(--text-input--line-height) transition-[color,box-shadow,border-color] focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive data-[size=default]:h-10 data-[size=lg]:h-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5";

interface WardPanelProps {
  wards: Ward[];
  value: string;
  size: PickerSize;
  onPick: (code: string) => void;
}

// The search row and the rows under it. It mounts when the popover opens and goes when it
// closes, so the typed text is empty on every open. The popover has no filter of its own
// (`shouldFilter={false}`): the rows are exactly what `matchWards` returns, and the highlighted
// row is held here so it can be set after each typing.
function WardPanel({ wards, value, size, onPick }: WardPanelProps) {
  const [text, setText] = useState("");
  const [active, setActive] = useState(() =>
    wards.some((ward) => ward.code === value) ? value : (wards[0]?.code ?? ""),
  );
  const results = matchWards(wards, text);

  const type = (next: string) => {
    setText(next);
    setActive(matchWards(wards, next)[0]?.code ?? "");
  };

  return (
    <Command
      shouldFilter={false}
      loop
      label={WARD_TEXTS.searchLabel}
      value={active}
      onValueChange={setActive}
    >
      <CommandInput
        size={size}
        value={text}
        onValueChange={type}
        placeholder={WARD_TEXTS.searchHint}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="done"
        maxLength={60}
      />
      <CommandList label={WARD_TEXTS.listLabel} className="max-h-88">
        <CommandGroup>
          {results.map((ward) => (
            <CommandItem
              key={ward.code}
              value={ward.code}
              size={size}
              data-checked={ward.code === value}
              onSelect={() => onPick(ward.code)}
            >
              {ward.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export interface WardPickerProps extends Omit<
  ComponentProps<"button">,
  "value" | "onChange" | "type" | "children"
> {
  /** The ward `code` ("" for none). Never a name. */
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  size?: PickerSize;
}

/**
 * A ward field: a button that shows the chosen ward and opens a box with a search row and the
 * wards that match what was typed (accents ignored). Spread `field` and `aria` of `FormField`
 * onto it: `id`, `ref`, `onBlur` and the `aria-*` all land on the button, so the label points at
 * it and focus on an error goes there. It only calls `onChange` after the person picks a row.
 */
export function WardPicker({
  value,
  onChange,
  placeholder = WARD_TEXTS.placeholder,
  size = "default",
  className,
  disabled,
  "aria-describedby": describedBy,
  ...props
}: WardPickerProps) {
  const wards = useWards();
  const [open, setOpen] = useState(false);
  const valueId = useId();
  const boxId = useId();

  const selected = wards.data?.find((ward) => ward.code === value);
  const text = !wards.data
    ? WARD_TEXTS.loading
    : selected
      ? selected.name
      : value === ""
        ? placeholder
        : WARD_TEXTS.unknownCode(value);

  const pick = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* A label outranks the content of a button, so the shown value is read as part of the
            description, as the date picker does. */}
        <button
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? boxId : undefined}
          aria-busy={wards.isPending}
          aria-describedby={[valueId, describedBy].filter(Boolean).join(" ")}
          data-size={size}
          disabled={disabled || !wards.data}
          className={cn(FOCUS_RING, TRIGGER_CLASS, className)}
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
      {/* Radix gives the box `role="dialog"`, and a dialog needs a name. */}
      <PopoverContent
        id={boxId}
        align="start"
        collisionPadding={8}
        aria-label={WARD_TEXTS.boxLabel}
        className="w-(--radix-popover-trigger-width) gap-0 p-0"
      >
        {wards.data && (
          <WardPanel
            wards={wards.data}
            value={value}
            size={size}
            onPick={pick}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
