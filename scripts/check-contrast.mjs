// Contrast gate for spec 0003 (AC-10). Reads the color tokens from src/app/globals.css and
// fails when a text pair is under 4.5:1, or a control border, icon or focus ring pair is under
// 3:1 (WCAG 2.2, 1.4.3 and 1.4.11). The pure parts are exported so /dev/ui shows the same table.
//
// A new token pair is added to PAIRS in the same change that adds the token. A `-foreground`
// token with no pair of its own fails the check, so a pair cannot be forgotten.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const TEXT_MIN = 4.5;
export const CONTROL_MIN = 3;

/**
 * @typedef {{ r: number, g: number, b: number, a: number }} Rgba
 * @typedef {Record<string, Rgba>} Tokens
 * A color on its own, or a tint: `token` at `alpha` over the token named `over`.
 * @typedef {string | { token: string, alpha: number, over: string }} ColorRef
 * @typedef {{ fg: ColorRef, bg: ColorRef, min: number }} Pair
 * @typedef {{ pair: Pair, fgLabel: string, bgLabel: string, ratio: number | null, pass: boolean, problem?: string }} PairResult
 */

/** @type {(fg: ColorRef, bg: ColorRef) => Pair} */
const text = (fg, bg) => ({ fg, bg, min: TEXT_MIN });
/** @type {(fg: ColorRef, bg: ColorRef) => Pair} */
const control = (fg, bg) => ({ fg, bg, min: CONTROL_MIN });

/** @type {(fg: ColorRef, surfaces: ColorRef[]) => Pair[]} */
const textOn = (fg, surfaces) => surfaces.map((bg) => text(fg, bg));
/** @type {(fg: ColorRef, surfaces: ColorRef[]) => Pair[]} */
const controlOn = (fg, surfaces) => surfaces.map((bg) => control(fg, bg));

// The menu row of a destructive item sits on a 10% tint of `destructive` over the popover.
const DESTRUCTIVE_TINT = { token: "destructive", alpha: 0.1, over: "popover" };

/** @type {Pair[]} */
export const PAIRS = [
  // Text on the surface it is made for.
  text("foreground", "background"),
  text("card-foreground", "card"),
  text("popover-foreground", "popover"),
  text("primary-foreground", "primary"),
  text("secondary-foreground", "secondary"),
  text("accent-foreground", "accent"),
  text("destructive-foreground", "destructive"),
  text("success-foreground", "success"),
  text("warning-foreground", "warning"),
  text("info-foreground", "info"),
  text("sidebar-foreground", "sidebar"),
  text("sidebar-primary-foreground", "sidebar-primary"),
  text("sidebar-accent-foreground", "sidebar-accent"),
  text("sidebar-foreground", "sidebar-accent"),

  // Body text on the quiet surfaces (table rows, footer links, selected rows) and on the page
  // canvas (spec 0004), where headings, page descriptions and result counts stand.
  ...textOn("foreground", ["muted", "accent", "canvas"]),
  // Help text, placeholders, labels and icons that use the muted color.
  ...textOn("muted-foreground", [
    "background",
    "card",
    "popover",
    "muted",
    "secondary",
    "accent",
    "sidebar",
    "canvas",
  ]),

  // Links and the current page, in the primary color.
  ...textOn("primary", [
    "background",
    "card",
    "popover",
    "muted",
    "secondary",
    "accent",
    "canvas",
  ]),
  // Error text and the destructive menu row.
  ...textOn("destructive", [
    "background",
    "card",
    "popover",
    "muted",
    "accent",
    "canvas",
    DESTRUCTIVE_TINT,
  ]),
  // Alert titles, icons and toast icons.
  ...textOn("success", ["background", "popover"]),
  ...textOn("info", ["background", "popover"]),
  text("warning-foreground", "popover"),

  // Borders of form controls and outline buttons.
  ...controlOn("input", [
    "background",
    "card",
    "popover",
    "muted",
    "accent",
    "canvas",
  ]),
  // Focus rings.
  ...controlOn("ring", [
    "background",
    "card",
    "popover",
    "muted",
    "secondary",
    "accent",
    "sidebar",
    "canvas",
    DESTRUCTIVE_TINT,
  ]),
  // The sidebar ring is drawn outside the item with a 2 px gap in `sidebar` (ring-offset-sidebar),
  // so it never touches `sidebar-primary`, which has the same value.
  ...controlOn("sidebar-ring", ["sidebar", "sidebar-accent"]),
];

/** @type {(hex: string) => Rgba} */
export function parseHex(hex) {
  const digits = hex.slice(1);
  const full =
    digits.length <= 4 ? [...digits].map((d) => d + d).join("") : digits;
  if (full.length !== 6 && full.length !== 8) {
    throw new Error(`Not a hex color: ${hex}`);
  }
  const byte = (i) => parseInt(full.slice(i, i + 2), 16);
  return {
    r: byte(0),
    g: byte(2),
    b: byte(4),
    a: full.length === 8 ? byte(6) / 255 : 1,
  };
}

// Color tokens declared as hex in a `:root` block of the stylesheet, by name without `--`.
/** @type {(css: string) => Tokens} */
export function parseTokens(css) {
  const blocks = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => m[1]);
  const declarations = blocks.flatMap((block) => [
    ...block.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g),
  ]);
  return Object.fromEntries(
    declarations.map(([, name, hex]) => [name, parseHex(hex)]),
  );
}

/** @type {(top: Rgba, under: Rgba, alpha: number) => Rgba} */
const mix = (top, under, alpha) => ({
  r: top.r * alpha + under.r * (1 - alpha),
  g: top.g * alpha + under.g * (1 - alpha),
  b: top.b * alpha + under.b * (1 - alpha),
  a: 1,
});

/** @type {(value: number) => number} */
const linear = (value) => {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** @type {(color: Rgba) => number} */
const luminance = ({ r, g, b }) =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

/** @type {(a: Rgba, b: Rgba) => number} */
export function contrastRatio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** @type {(ref: ColorRef) => string} */
export const describeColor = (ref) =>
  typeof ref === "string"
    ? ref
    : `${ref.token}/${Math.round(ref.alpha * 100)} over ${ref.over}`;

/** @type {(ref: ColorRef, tokens: Tokens) => Rgba} */
function resolveColor(ref, tokens) {
  if (typeof ref === "string") {
    const color = tokens[ref];
    if (!color) throw new Error(`no token --${ref}`);
    if (color.a < 1) throw new Error(`--${ref} is translucent`);
    return color;
  }
  const over = resolveColor(ref.over, tokens);
  return mix(resolveColor(ref.token, tokens), over, ref.alpha);
}

/** @type {(pair: Pair, tokens: Tokens) => PairResult} */
function evaluatePair(pair, tokens) {
  const base = {
    pair,
    fgLabel: describeColor(pair.fg),
    bgLabel: describeColor(pair.bg),
  };
  try {
    const ratio = contrastRatio(
      resolveColor(pair.fg, tokens),
      resolveColor(pair.bg, tokens),
    );
    return { ...base, ratio, pass: ratio >= pair.min };
  } catch (error) {
    return {
      ...base,
      ratio: null,
      pass: false,
      problem: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Every `-foreground` token must have a pair with its own surface, or a new token pair could
 * reach the site without ever being measured.
 * @type {(tokens: Tokens, pairs: Pair[]) => string[]}
 */
export function unmeasuredTokens(tokens, pairs) {
  const measured = new Set(
    pairs.map((p) => `${describeColor(p.fg)}|${describeColor(p.bg)}`),
  );
  return Object.keys(tokens)
    .map((name) => name.match(/^(.+)-foreground$/))
    .filter((match) => match !== null)
    .filter(([name, surface]) => !measured.has(`${name}|${surface}`))
    .map(([name]) => name);
}

/** @type {(tokens: Tokens, pairs?: Pair[]) => PairResult[]} */
export const evaluatePairs = (tokens, pairs = PAIRS) =>
  pairs.map((pair) => evaluatePair(pair, tokens));

// Truncates, never rounds up: 4.496 must not read as 4.50.
/** @type {(ratio: number) => string} */
export const formatRatio = (ratio) =>
  (Math.floor(ratio * 100) / 100).toFixed(2);

/** @type {(color: Rgba) => string} */
export const toHex = ({ r, g, b, a }) =>
  "#" +
  [r, g, b, ...(a < 1 ? [a * 255] : [])]
    .map((value) => Math.round(value).toString(16).padStart(2, "0"))
    .join("");

/** @type {(path: string | URL) => Tokens} */
export const loadTokens = (path) => parseTokens(readFileSync(path, "utf8"));

/** @type {(scriptPath: string) => void} */
function main(scriptPath) {
  // Not `new URL(..., import.meta.url)`: Turbopack would take that for an asset to bundle.
  const tokens = loadTokens(
    resolve(dirname(scriptPath), "../src/app/globals.css"),
  );
  const results = evaluatePairs(tokens);
  const failures = results.filter((r) => !r.pass);
  const unmeasured = unmeasuredTokens(tokens, PAIRS);

  if (process.argv.includes("--verbose")) {
    for (const r of results) {
      const ratio = r.ratio === null ? "n/a" : formatRatio(r.ratio);
      console.log(
        `${r.pass ? "ok  " : "FAIL"}  ${ratio.padStart(6)}:1  needs ${r.pair.min}:1  ${r.fgLabel} on ${r.bgLabel}`,
      );
    }
  }
  for (const r of failures) {
    const found =
      r.ratio === null ? (r.problem ?? "unknown") : `${formatRatio(r.ratio)}:1`;
    console.error(
      `contrast FAIL: ${r.fgLabel} on ${r.bgLabel} is ${found}, needs ${r.pair.min}:1`,
    );
  }
  for (const name of unmeasured) {
    console.error(
      `contrast FAIL: --${name} has no pair in PAIRS (scripts/check-contrast.mjs)`,
    );
  }

  if (failures.length > 0 || unmeasured.length > 0) {
    process.exitCode = 1;
    return;
  }
  const lowest = results.reduce((a, b) =>
    (b.ratio ?? Infinity) / b.pair.min < (a.ratio ?? Infinity) / a.pair.min
      ? b
      : a,
  );
  console.log(
    `contrast ok: ${results.length} pairs, tightest ${lowest.fgLabel} on ${lowest.bgLabel} ` +
      `${formatRatio(lowest.ratio ?? 0)}:1 (needs ${lowest.pair.min}:1)`,
  );
}

// Runs only when started with `node scripts/check-contrast.mjs`, not when /dev/ui imports it.
const invoked = process.argv[1] ? resolve(process.argv[1]) : "";
if (invoked && pathToFileURL(invoked).href === import.meta.url) {
  main(invoked);
}
