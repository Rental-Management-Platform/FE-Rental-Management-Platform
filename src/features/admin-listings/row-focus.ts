// Where focus goes when a dialog of the moderation table closes and the button that opened it is
// gone (scope #21). This reads the page, so it is only called from a handler at the edge, never
// while rendering.

import { RESULTS_HEADING_ID } from "./admin-listings-path";

/**
 * A button of the row, in the table or in the blocks, whichever one is on screen (the other is
 * `display: none`, so it has no `offsetParent` and cannot take focus). After a hide the row offers
 * "Gỡ ẩn" instead of "Ẩn", so focus lands on the button that replaced the one pressed. When the row
 * has no button on screen, because a status filter made it leave the list, focus goes to the
 * heading of the results, so a keyboard or screen reader user lands on the count that just changed.
 */
export function rowFocusTarget(id: string | undefined): HTMLElement | null {
  const button =
    id === undefined
      ? undefined
      : [
          ...document.querySelectorAll<HTMLElement>(
            `[data-moderation-actions="${CSS.escape(id)}"] button`,
          ),
        ].find((candidate) => candidate.offsetParent !== null);
  return button ?? document.getElementById(RESULTS_HEADING_ID);
}
