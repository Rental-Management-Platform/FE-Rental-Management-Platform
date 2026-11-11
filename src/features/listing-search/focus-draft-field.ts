// Moves focus to the copy of a draft field that is on screen (spec 0016, AC-7). There can be two
// copies of one field, one in the card and one in the sheet, and one of them is always hidden
// (`display: none`), which cannot take focus. Every copy carries `data-draft-field`.
//
// A copy inside an open dialog wins over any other visible copy: the dialog is modal, so the page
// behind it cannot be reached, and focus sent there is pulled back to the dialog by its focus trap.
// On the page itself there is never another visible copy, so this only decides the `/dev/ui`
// samples, which draw the same boxes in several places.
//
// It is meant for event handlers and the sheet's open handler, never for render.
export function focusDraftField(name: string): void {
  const visible = Array.from(
    document.querySelectorAll<HTMLElement>(`[data-draft-field="${name}"]`),
  ).filter((copy) => copy.getClientRects().length > 0);
  const target =
    visible.find((copy) => copy.closest('[role="dialog"]') !== null) ??
    visible[0];
  target?.focus();
}
