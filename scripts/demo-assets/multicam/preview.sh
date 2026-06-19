#!/usr/bin/env bash
# Genera (y opcionalmente publica) los assets del demo multicámara: renders del
# parking ficticio desde cada cámara (día/noche) + scene.json con las homografías.
#
# Uso:
#   ./multicam/preview.sh           # renderiza a scripts/demo-assets/multicam/out/
#   ./multicam/preview.sh promote   # + publica jpgs a public/ y scene.json a components/
#
# A diferencia del resto de demos, NO usa el venv de Python: el render es three.js
# (cargado desde CDN dentro de scene.html) sobre Playwright/Chromium. Si Chromium
# no está, instalar con:  npx playwright install chromium
set -euo pipefail
cd "$(dirname "$0")/../../.."   # -> portfolio/ (raíz del repo, donde está node_modules)

PROMOTE=${1:-}
node scripts/demo-assets/multicam/render.mjs "$PROMOTE"

OUT=scripts/demo-assets/multicam/out
echo "Listo: $OUT/ (cam-a/cam-b/topdown · day/night · scene.json)"
command -v open >/dev/null && open "$OUT/cam-a-day.jpg" "$OUT/cam-b-day.jpg" "$OUT/topdown-night.jpg" || true
