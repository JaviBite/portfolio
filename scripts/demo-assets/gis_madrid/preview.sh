#!/usr/bin/env bash
# Previsualiza (y opcionalmente publica) el heatmap de cambios para un encuadre.
#
# Uso:
#   ./gis_madrid/preview.sh <lat> <lon> [size_m] [promote]
#
# Ejemplos:
#   ./gis_madrid/preview.sh 40.4231 -3.7132            # probar un encuadre
#   ./gis_madrid/preview.sh 40.4231 -3.7132 520        # + tamaño (lado en metros)
#   ./gis_madrid/preview.sh 40.4231 -3.7132 520 promote # publicar a /public
#
# Sube/baja la latitud para mover NORTE(+)/SUR(-); sube/baja la longitud para
# OESTE(-, izquierda)/ESTE(+, derecha). ~0.0009 ≈ 80-100 m.
set -euo pipefail
cd "$(dirname "$0")/.."   # -> scripts/demo-assets

LAT=${1:-40.4231}; LON=${2:--3.7132}; SIZE=${3:-520}; PROMOTE=${4:-}

export SSL_CERT_FILE="$(.venv/bin/python -c 'import certifi;print(certifi.where())')"
export TORCH_HOME="$PWD/models/torchhub"

echo "Encuadre: lat=$LAT lon=$LON size=${SIZE}m  (descargando + calculando heatmap…)"
.venv/bin/python gis_madrid/fetch_orthophotos.py --source madrid --years 2019,2023 \
  --lat "$LAT" --lon "$LON" --size-m "$SIZE" --width 2560 \
  --prefix pe-prev --out-dir gis_madrid/raw >/dev/null

.venv/bin/python gis_madrid/change_detection.py \
  --before gis_madrid/raw/pe-prev-2019.jpg --after gis_madrid/raw/pe-prev-2023.jpg \
  --backend dinov2 --no-center --grid-blur 2.5 --p-lo 60 --floor 0.20 \
  --min-area-frac 0.003 --gamma 1.35 --alpha 0.70 --out-width 1280 \
  --out gis_madrid/out/preview >/dev/null 2>&1

echo "Listo:"
echo "  overlay (look del demo): gis_madrid/out/preview/overlay-dinov2.jpg"
echo "  antes|después|overlay  : gis_madrid/out/preview/review-dinov2.jpg"
command -v open >/dev/null && open gis_madrid/out/preview/review-dinov2.jpg || true

if [ "$PROMOTE" = "promote" ]; then
  DEST=../../public/demos/gis-madrid
  .venv/bin/python - "$DEST" <<'PY'
import cv2, sys, os
dest = sys.argv[1]; os.makedirs(dest, exist_ok=True)
m = {"before.jpg":"plaza-espana-2019.jpg","after.jpg":"plaza-espana-2023.jpg","overlay-dinov2.jpg":"plaza-espana-2023-heatmap.jpg"}
for src, name in m.items():
    im = cv2.imread(f"gis_madrid/out/preview/{src}")
    cv2.imwrite(f"{dest}/{name}", im, [cv2.IMWRITE_JPEG_QUALITY, 82])
    print(f"  publicado {name} ({os.path.getsize(f'{dest}/{name}')//1024} KB)")
PY
  echo "Assets actualizados en public/demos/gis-madrid/ ✔"
fi
