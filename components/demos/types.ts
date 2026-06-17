/** Shared types for the project demo components rendered inside the bento grid. */

/** A single visual source: a real asset or, if omitted, a generated placeholder. */
export interface DemoMedia {
  /** Path under /public, or any URL. If absent a labelled placeholder is shown. */
  src?: string;
  /** Short caption shown over the media. */
  label?: string;
  /** Alt text for accessibility. Falls back to `label`. */
  alt?: string;
}

/** Props shared by every demo so the card can theme them consistently. */
export interface DemoBaseProps {
  /** Accent color (a CSS var or hex) inherited from the project card. */
  accent?: string;
  /** Optional caption shown under the demo chrome. */
  caption?: string;
}

/** A 3x3 homography matrix (row-major). */
export type Homography = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];
