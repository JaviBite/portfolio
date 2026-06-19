#!/usr/bin/env python3
"""
Extract the SAM free-space mask from the Würth outbound-staging frame.

Input : playa-salida-sam.png  (frame with the algorithm's teal overlay + green
        bbox + baked score burnt in).
Output: playa-salida-mask.png (RGBA, only the teal free-space shape — flat brand
        teal, transparent elsewhere) so the web demo can overlay it on the CLEAN
        frame and draw its own bbox / animated score with no baked artifacts.

The teal overlay is keyed by colour (cyan shift: B-R and G-R both clearly
positive); brown floor and grey pallets/forklift fall outside it, which is what
carves the organic holes around the stacks. Prints the mask bbox (in %) and the
covered-area fraction for sanity against the real score (~0.44).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent
PUB = HERE.parent.parent.parent / "public" / "demos" / "logistics-wurth"
SRC = HERE / "raw" / "playa-salida-sam.png"  # generation input (not served)
OUT = PUB / "playa-salida-mask.png"

# Flat fill colour baked into the mask (brand teal) + per-pixel alpha.
TEAL = (45, 212, 191)
ALPHA = 110

# Colour key thresholds (see calibration in the repo history).
DB = 25  # B - R
DG = 20  # G - R


def main() -> int:
    if not SRC.exists():
        print(f"missing {SRC}", file=sys.stderr)
        return 1

    rgb = np.asarray(Image.open(SRC).convert("RGB")).astype(np.int16)
    R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    key = ((B - R) >= DB) & ((G - R) >= DG)

    # Denoise: blur+threshold to drop JPEG speckle, then a morphological OPEN
    # (erode→dilate via Min/Max filters) to remove the small stray blobs that
    # the bluish top conveyors trigger, while keeping the big free-space shape.
    m = Image.fromarray((key * 255).astype(np.uint8), "L").filter(
        ImageFilter.GaussianBlur(2.0)
    )
    m = m.point(lambda v: 255 if v >= 128 else 0)
    m = m.filter(ImageFilter.MinFilter(11)).filter(ImageFilter.MaxFilter(11))  # open
    # Soft anti-aliased edges for the final alpha.
    a = np.asarray(m.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255.0
    solid = np.asarray(m).astype(np.float32) / 255.0 >= 0.5  # cleaned bool for bbox/stats

    ys, xs = np.where(solid)
    if xs.size == 0:
        print("no teal found — adjust thresholds", file=sys.stderr)
        return 2
    H, W = key.shape
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    frac = solid.mean()

    out = np.zeros((H, W, 4), dtype=np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = TEAL
    out[..., 3] = (a * ALPHA).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(OUT)

    print(f"image {W}x{H}")
    print(f"bbox px x[{x0},{x1}] y[{y0},{y1}]")
    print(
        "roi %  "
        f"x={x0 / W * 100:.1f} y={y0 / H * 100:.1f} "
        f"w={(x1 - x0) / W * 100:.1f} h={(y1 - y0) / H * 100:.1f}"
    )
    print(f"teal coverage (of full frame): {frac * 100:.1f}%")
    print(f"saved {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
