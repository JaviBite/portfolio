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

/**
 * How a demo fills its panel:
 * - "cover": scale to fill, cropping overflow (no gaps / black bands).
 * - "contain": fit the whole media inside, may show gaps / bands.
 */
export type DemoFit = "cover" | "contain";

/** Props shared by every demo so the card can theme them consistently. */
export interface DemoBaseProps {
  /** Accent color (a CSS var or hex) inherited from the project card. */
  accent?: string;
  /** Optional caption shown under the demo chrome. */
  caption?: string;
}

/** A 3x3 homography matrix (row-major). */
export type Homography = number[][];

/**
 * A single camera in the multicam scene, generated offline by
 * scripts/demo-assets/multicam. `H` maps a world-normalised ground point
 * [0,1]² to image pixels; `Hinv` is its inverse (pixel → world). Both are
 * exact because the render uses a camera of known pose. `bg` holds the day/night
 * backgrounds for light/dark themes (the matrices are shared between themes).
 */
export interface SceneCamera {
  id: string;
  label: string;
  kind: "persp" | "ortho";
  imgW: number;
  imgH: number;
  H: Homography;
  Hinv: Homography;
  bg: { light: string; dark: string };
}

/** The full multicam scene: ground footprint + the per-camera projections. */
export interface MulticamScene {
  ground: { W: number; D: number };
  cameras: SceneCamera[];
}
