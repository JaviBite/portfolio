#!/usr/bin/env bash
# Genera (y opcionalmente publica) el vídeo demo de AutoFlip.
#
# Uso:
#   ./autoflip/preview.sh                 # genera out/preview/autoflip-demo.mp4 y lo abre
#   ./autoflip/preview.sh promote         # + publica a public/demos/smartcrop-autoflip/
#
# La primera vez descarga el clip fuente (Mixkit, uso comercial libre, sin
# atribución) a autoflip/raw/source.mp4. El modelo U²-Net lo baja rembg solo.
set -euo pipefail
cd "$(dirname "$0")/.."   # -> scripts/demo-assets

PROMOTE=${1:-}
SRC_URL="https://assets.mixkit.co/videos/25021/25021-720.mp4"
OUT=autoflip/out/preview

# Certifi para que urllib/rembg no fallen con los certs de Python.org en macOS.
export SSL_CERT_FILE="$(.venv/bin/python -c 'import certifi;print(certifi.where())')"

# Tramo 2..9 s: la skater viene del centro y deriva a la derecha creciendo
# (buen barrido), evitando el primer plano extremo de ~11 s.
.venv/bin/python autoflip/autoflip.py \
  --src autoflip/raw/source.mp4 --url "$SRC_URL" \
  --start 2 --seconds 7 \
  --out "$OUT"

echo "Listo: $OUT/autoflip-demo.mp4"
command -v open >/dev/null && open "$OUT/autoflip-demo.mp4" || true

if [ "$PROMOTE" = "promote" ]; then
  DEST=../../public/demos/smartcrop-autoflip
  mkdir -p "$DEST"
  cp "$OUT/autoflip-demo.mp4" "$DEST/autoflip-demo.mp4"
  cp "$OUT/autoflip-poster.jpg" "$DEST/autoflip-poster.jpg"
  echo "Publicado en public/demos/smartcrop-autoflip/ ✔ ($(du -h "$DEST/autoflip-demo.mp4" | cut -f1))"
fi
