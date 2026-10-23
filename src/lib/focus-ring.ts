// The focus ring from spec 0003: 2 px ring, 2 px offset. `outline-hidden` keeps a transparent
// outline under it, so focus still shows in Windows forced colors mode.
export const FOCUS_RING =
  "outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
