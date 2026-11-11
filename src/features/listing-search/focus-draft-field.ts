// Moves focus to the copy of a draft field that is on screen (spec 0016, AC-7). There can be two
// copies of one field, one in the card and one in the sheet, and one of them is always hidden
// (`display: none`), which cannot take focus. Every copy carries `data-draft-field`.
//
// It is meant for event handlers and the sheet's open handler, never for render.
export function focusDraftField(name: string): void {
  const copies = document.querySelectorAll<HTMLElement>(
    `[data-draft-field="${name}"]`,
  );
  Array.from(copies)
    .find((copy) => copy.getClientRects().length > 0)
    ?.focus();
}
