# GIS Madrid — detección de cambios urbanísticos

Genera los assets de la demo `aerial-gis-madrid`: una ortofoto de la **Plaza de
España de Madrid** y la misma zona con un **heatmap de los cambios detectados**
superpuesto, partiendo de imágenes aéreas reales de dos años distintos.

Reproduce el enfoque del proyecto original de ETIQMEDIA: codificar cada imagen
con un encoder visual denso y medir el cambio por **similitud coseno** entre
embeddings (robusto a iluminación/sombras, a diferencia de un *diff* de píxeles).

## Pipeline

```
fetch_orthophotos.py   →  descarga ortofotos co-registradas (WMS IGN PNOA histórico)
change_detection.py    →  encoder denso → 1-coseno por patch → postproceso → overlay
```

1. **Datos** (`--source`): pedimos la misma bbox para dos años ⇒ ya co-registradas
   (mismo extent, EPSG:3857).
   - `madrid` *(usado en producción)*: ortofotos del **Ayuntamiento de Madrid**,
     un WMS por año, capa `ORTO_{año}_10_10`. Son **ortofotos verdaderas (true
     ortho) a 10 cm**: los edificios no se abaten ⇒ casi no hay paralaje ⇒ el
     heatmap sale mucho más limpio (el fondo urbano queda frío y solo la obra se
     enciende). Años con true-ortho 10 cm: 2017, **2019**, 2021, **2023**…
   - `ign`: PNOA histórico del IGN (25-50 cm, no verdadera). Cobertura de Plaza de
     España: 2006, 2009, 2011, 2014, 2017, 2020, 2023.
2. **Encoder** (`--backend`): `sam` (image-encoder de SAM, método original),
   `dinov2` (con *registers*, el publicado), `sam3` (vision encoder de SAM 3 =
   Perception Encoder ViT-L/14) o `dinov3` (incl. variante **satélite** SAT493M).
   Cada imagen → rejilla de embeddings por patch.
3. **Cambio**: `1 - coseno` patch-a-patch entre los dos años.
4. **Postproceso** — la clave para un heatmap limpio en ciudad densa:
   - **pre-suavizado de la rejilla** (`--grid-blur`): el cambio real (la obra) es
     una región grande y coherente; el ruido (paralaje de edificios altos,
     sombras) es de alta frecuencia. El gaussiano lo promedia.
   - normalización robusta por percentiles (`--p-lo/--p-hi`), `--floor` y
     filtrado de componentes pequeños (`--min-area-frac`).
   - colormap + alpha proporcional a la magnitud del cambio.

## Uso

```bash
# entorno (hereda torch+MPS, numpy, opencv del Python del sistema)
python3 -m venv --system-site-packages .venv
.venv/bin/pip install -r ../requirements.txt

# certificados (Python.org en macOS no usa los del sistema)
export SSL_CERT_FILE=$(.venv/bin/python -c 'import certifi;print(certifi.where())')
export TORCH_HOME=$PWD/../models/torchhub   # cachea pesos fuera del repo

# 1) descargar ortofotos verdaderas de Madrid (encuadre c1, ~155 m al sur)
.venv/bin/python fetch_orthophotos.py --source madrid --years 2019,2023 \
  --lat 40.4224 --lon -3.7122 --size-m 520 --width 2560 --prefix pe-mad

# 2) heatmap de cambios (el asset que se publicó)
.venv/bin/python change_detection.py \
  --before raw/pe-mad-2019.jpg --after raw/pe-mad-2023.jpg \
  --backend dinov2 --no-center --grid-blur 2.5 --p-lo 60 --floor 0.20 \
  --min-area-frac 0.003 --gamma 1.35 --alpha 0.70 --out-width 1280 --out out/final
```

Con `--save-grid out/g.npy` se cachea la rejilla de cambio cruda y luego
`--load-grid out/g.npy` re-renderiza el overlay al instante (sin re-encodear),
ideal para afinar el postproceso.

## Assets publicados (`public/demos/gis-madrid/`)

| fichero | rol en la demo |
|---|---|
| `plaza-espana-2019.jpg` | `before` (t0, ortofoto verdadera 2019) |
| `plaza-espana-2023-heatmap.jpg` | `after` (t1, 2023 + heatmap de cambios) |
| `plaza-espana-2023.jpg` | t1 limpio (no usado por el slider; referencia) |

Par actual: **2019 → 2023** (true-ortho Madrid), encuadre c1. Para otro par/fuente
basta cambiar `--source`, `--years` y el centro (`--lat/--lon`).

## SAM 3 (opcional)

`--backend sam3` usa el vision encoder de SAM 3 (un Perception Encoder ViT-L/14,
32 capas). Los pesos de `facebook/sam3` están *gated*, pero hay un mirror ungated
(`1038lab/sam3`, `sam3.safetensors`, ~3.4 GB) que se carga vía las clases nativas
`Sam3ViTModel` de `transformers` (≥5.12). Solo se usa el sub-módulo
`detector_model.vision_encoder.backbone`. Corre a 1008px → rejilla 72×72.
En esta zona da un resultado casi idéntico a DINOv2 (un pelín más suave).

## DINOv3 (opcional)

`--backend dinov3` usa el ViT-L/16. Los pesos están **gated** en Hugging Face
(aprobación manual de Meta). Tras aceptar la licencia en
`huggingface.co/facebook/dinov3-vitl16-pretrain-sat493m` y `huggingface-cli login`,
descarga el `.pth` y pásalo con `--dinov3-weights <ruta>`. La variante **satélite
(SAT493M)** es la más indicada para ortofotos.

## Fuente de datos

- **Producción**: Ortofotos verdaderas © **Ayuntamiento de Madrid** (geoportal.madrid.es),
  WMS `https://servpub.madrid.es/georaster/ORTOFOTOS_COMPLETAS/ORTO_{año}_10_10/ows`.
- **Alternativa** (`--source ign`): © Instituto Geográfico Nacional / PNOA (CC-BY 4.0),
  WMS `https://www.ign.es/wms/pnoa-historico`.
