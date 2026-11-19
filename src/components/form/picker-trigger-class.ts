// The look of the Input and the Select trigger, 40 px high, or 44 px at `lg` (public pages). The
// ward picker and the search picker are buttons, so they borrow it to sit beside a real Select.
export const PICKER_TRIGGER_CLASS =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-left text-(length:--text-input) leading-(--text-input--line-height) transition-[color,box-shadow,border-color] focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive data-[size=default]:h-10 data-[size=lg]:h-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5";
