# Demo AutoFlip — reencuadre 16:9 → 9:16 guiado por saliencia

Asset para la tarjeta `smartcrop-autoflip` (VIC / EITB) de `lib/data.json`.
Reproduce, en versión mínima y reproducible, el sistema real de reencuadre
automático: detectar el sujeto más saliente de un plano horizontal y «mover la
cámara» para conservarlo en un recorte vertical apto para redes.

## Pipeline (`autoflip.py`)

1. **Lee** un vídeo 16:9 (`raw/source.mp4`).
2. **Saliencia** por frame con **U²-Net** vía [`rembg`](https://github.com/danielgatis/rembg)
   (`new_session("u2net")` + `remove(frame, only_mask=True)`) → matte de probabilidad [0,1].
   El modelo (~176 MB) se descarga solo a `~/.u2net/`.
3. **Foco + bbox** sobre la saliencia ponderada por dos priors (evitan engancharse a
   distractores —p. ej. un objeto oscuro del borde— cuando el sujeto se aleja y su
   saliencia cae): **sesgo central** (`--center-bias`) y **localidad temporal**
   (`--track-sigma`, el foco no salta de golpe). Foco = centro de masa; bbox = mayor
   contorno tras Otsu. El heatmap muestra esta saliencia ya ponderada (lo que se usa).
4. **Trayectoria de cámara = fit polinómico** (`np.polyfit`, grado 4) de los centros
   sobre el tiempo → barrido suave, con easing natural y sin jitter. La ventana de
   corte es 9:16 a alto completo y solo se desplaza en X.
5. **Compone** el vídeo demo y lo **codifica** con ffmpeg (H.264, yuv420p, `+faststart`):
   - **Izq-arriba** `16:9 / ANÁLISIS`: heatmap turbo + bbox + trayectoria, **alternando**
     en el tiempo (`SALIENCY` ↔ `TRACKING`) para que cada capa se lea limpia.
   - **Izq-abajo** `16:9 / CROP`: el plano con todo lo de fuera del recorte oscurecido.
   - **Derecha** `9:16 / RESULTADO`: el recorte vertical real, en marco tipo móvil.

## Uso

```bash
cd scripts/demo-assets
python3 -m venv --system-site-packages .venv          # si no existe
.venv/bin/pip install -r requirements.txt             # trae rembg[cpu]

./autoflip/preview.sh            # genera out/preview/autoflip-demo.mp4 (descarga el clip la 1ª vez)
./autoflip/preview.sh promote    # + publica a public/demos/smartcrop-autoflip/
```

Parámetros útiles de `autoflip.py`: `--seconds` (recorta duración), `--deg` (grado del
polinomio), `--cycle` (periodo de alternancia heatmap/tracking, s), `--alpha`/`--gamma`
(heatmap), `--center-bias`/`--track-sigma` (priors anti-distractor), `--model`
(p. ej. `isnet-general-use` para máscaras más finas), y **`--aspect`** (aspecto ancho/alto
del composite; recorta la fuente para llenar la celda de la tarjeta sin letterbox; por
defecto `1.113`, el aspecto medido de la celda con `demoPercentage: 60`).

## Fuente

Clip CC0 / uso comercial libre sin atribución (Mixkit):
`https://assets.mixkit.co/videos/25021/25021-720.mp4`
(«Teen woman on a skateboard on the road», 1280×720, 25 fps, ~23 s; se usa el
tramo 2–9 s). Sujeto único en amarillo (saliencia altísima) sobre carretera
escénica con curva: deriva del centro a la derecha creciendo → buen barrido del
crop, sin distractores de borde.

## Notas

- macOS + Python.org: si urllib/rembg fallan por certificados, exportar
  `SSL_CERT_FILE=$(python -c 'import certifi;print(certifi.where())')` (lo hace `preview.sh`).
- `rembg[cpu]` no toca el numpy/opencv/torch del sistema; corre en onnxruntime CPU.
- `raw/`, `out/` y `models/` están en `.gitignore`; solo se versiona el asset final en
  `public/demos/smartcrop-autoflip/`.
