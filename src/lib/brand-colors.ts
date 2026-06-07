// Single source of truth for the brand coral palette used by the interactive
// React visualizers. These mirror the `@theme` tokens in global.css
// (--color-coral-500/600/300). Keep them in sync: a token change here is the
// one place to update so the visualizers don't silently diverge from the CSS.

export const coral500 = "#EC695B"; // --color-accent / coral-500
export const coral600 = "#DC5648"; // --color-accent-hover / coral-600
export const coral300 = "#F59B90"; // coral-300

// rgba tints of coral-500 (236,105,91) used across the visualizers.
export const coral500Rgb = "236,105,91";
export const coral600Rgb = "220,86,72";

/** rgba() tint of coral-500 at the given alpha. */
export const coral500Alpha = (alpha: number) => `rgba(${coral500Rgb},${alpha})`;
/** rgba() tint of coral-600 at the given alpha. */
export const coral600Alpha = (alpha: number) => `rgba(${coral600Rgb},${alpha})`;
