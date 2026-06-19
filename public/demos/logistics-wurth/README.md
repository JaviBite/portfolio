# Würth — assets de la demo (warehouse)

Frames reales del vídeo `safNIpLHFg4`. El componente
`components/demos/WarehouseCongestion.tsx` dibuja en vivo las cajas, el bbox y el
score (no están horneados). Coordenadas en `components/demos/wurth-scene.json`
(en % del frame).

Ficheros servidos (WebP optimizado; los PNG originales viven en
`scripts/demo-assets/wurth/raw/`):

- **`conveyor-atasco.webp`** — frame del transportador de rodillos (`13:10`), con la
  caja naranja atascada. Escena "Atasco" (bbox roja dibujada encima).
- **`playa-salida.webp`** — frame **limpio** de la playa de salida (`15:26`). Base de
  la escena "Capacidad".
- **`playa-salida-mask.png`** — máscara del espacio libre (forma orgánica SAM,
  turquesa sobre transparente). La genera
  `scripts/demo-assets/wurth/make_mask.py` por color-key sobre el overlay SAM
  fuente (`scripts/demo-assets/wurth/raw/playa-salida-sam.png`, no se sirve). El
  componente la superpone sobre el frame limpio y la revela con un *wipe* al hacer
  scroll. Regenerar con: `python3 scripts/demo-assets/wurth/make_mask.py`.

El score real `0.443621` (≈44 %) vive en `wurth-scene.json` (`yard.score`).
