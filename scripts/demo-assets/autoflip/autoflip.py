#!/usr/bin/env python3
"""Demo AutoFlip: reencuadre automático 16:9 -> 9:16 guiado por saliencia.

Reproduce, en versión mínima y reproducible, el sistema real de reencuadre de
EITB/VIC: detectar el sujeto más saliente de un plano horizontal y «mover la
cámara» para conservarlo en un recorte vertical apto para redes.

Pipeline:
  1. Lee un vídeo 16:9.
  2. Saliencia por frame con U²-Net (vía `rembg`) -> matte de probabilidad [0,1].
  3. Foco = centro de masa de la saliencia; bbox del objeto dominante (Otsu +
     mayor contorno).
  4. Trayectoria de cámara = FIT POLINÓMICO de los centros sobre el tiempo
     (`np.polyfit`). Da un barrido suave, con easing natural y sin jitter, igual
     que el suavizado por ajuste a una función del trabajo original. La ventana
     de corte es 9:16 a alto completo y solo se desplaza en X.
  5. Compone un vídeo demo: columna izquierda con dos 16:9 (arriba el ANÁLISIS
     —heatmap + bbox + trayectoria, alternando— y abajo el CROP —resto del plano
     oscurecido—) y a la derecha el RESULTADO 9:16. Codifica con ffmpeg (H.264).

Uso típico (desde scripts/demo-assets):
  .venv/bin/python autoflip/autoflip.py --src autoflip/raw/source.mp4 \
      --out autoflip/out --seconds 8
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import urllib.request

import cv2
import numpy as np

# ----------------------------------------------------------------------------- utilidades

def hex_to_bgr(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return (b, g, r)


def lerp_bgr(c0, c1, t: float):
    return tuple(int(round(a + (b - a) * t)) for a, b in zip(c0, c1))


def ffmpeg_bin() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        sys.exit("ffmpeg no encontrado (instálalo o `pip install imageio-ffmpeg`).")


def download(url: str, dest: str) -> None:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"  descargando clip fuente -> {os.path.relpath(dest)}")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as r, open(dest, "wb") as f:
        shutil.copyfileobj(r, f)


# ----------------------------------------------------------------------------- saliencia

def saliency_session(model: str):
    from rembg import new_session
    return new_session(model)


def focus_and_bbox(sal: np.ndarray, prev):
    """Del campo de saliencia YA PONDERADO [0..1] -> (cx, cy, bbox, ok).

    Foco = centro de masa (momentos) del campo. bbox = caja del mayor contorno
    tras umbral de Otsu. Si apenas hay señal (sujeto diminuto/perdido), se
    reutiliza el foco anterior para no saltar a un distractor."""
    h, w = sal.shape
    M = cv2.moments(sal.astype(np.float32))
    if M["m00"] < 0.0012 * h * w:      # poca señal -> mantener el foco anterior
        return prev if prev else (w / 2, h / 2, (int(w * 0.4), int(h * 0.3), int(w * 0.2), int(h * 0.4)), False)
    cx = M["m10"] / M["m00"]
    cy = M["m01"] / M["m00"]
    s8 = (np.clip(sal, 0, 1) * 255).astype(np.uint8)
    _, binm = cv2.threshold(s8, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    cnts, _ = cv2.findContours(binm, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if cnts:
        x, y, bw, bh = cv2.boundingRect(max(cnts, key=cv2.contourArea))
    else:
        x, y, bw, bh = int(cx - w * 0.1), int(cy - h * 0.2), int(w * 0.2), int(h * 0.4)
    return cx, cy, (x, y, bw, bh), True


# ----------------------------------------------------------------------------- dibujo

FONT = cv2.FONT_HERSHEY_DUPLEX


def draw_tag(img, org, text, accent, scale=0.42):
    """Etiqueta tipo «chip» monoespaciada (fondo oscuro + borde acento)."""
    (tw, th), _ = cv2.getTextSize(text, FONT, scale, 1)
    x, y = org
    pad = 6
    cv2.rectangle(img, (x, y), (x + tw + 2 * pad, y + th + 2 * pad), (0, 0, 0), -1)
    cv2.rectangle(img, (x, y), (x + tw + 2 * pad, y + th + 2 * pad), accent, 1, cv2.LINE_AA)
    cv2.putText(img, text, (x + pad, y + th + pad - 1), FONT, scale, (235, 235, 235), 1, cv2.LINE_AA)


def draw_bbox_corners(img, rect, color, ln=18, th=2):
    x, y, w, h = rect
    x2, y2 = x + w, y + h
    for (cx, cy, dx, dy) in [(x, y, 1, 1), (x2, y, -1, 1), (x, y2, 1, -1), (x2, y2, -1, -1)]:
        cv2.line(img, (cx, cy), (cx + dx * ln, cy), color, th, cv2.LINE_AA)
        cv2.line(img, (cx, cy), (cx, cy + dy * ln), color, th, cv2.LINE_AA)


def panel_border(img, color, th=2):
    h, w = img.shape[:2]
    cv2.rectangle(img, (0, 0), (w - 1, h - 1), color, th, cv2.LINE_AA)


# ----------------------------------------------------------------------------- composición

def build_annotated(frame, mask_small, traj_pts, bbox_p, accent, w_heat, alpha, gamma):
    """Panel 16:9 superior: heatmap de saliencia + bbox + trayectoria, alternando
    en el tiempo (w_heat 1->0->1) para que cada capa se lea limpia."""
    LW = mask_small.shape[1]
    PH = mask_small.shape[0]
    base = cv2.resize(frame, (LW, PH), interpolation=cv2.INTER_AREA).astype(np.float32)

    # --- heatmap de saliencia ---
    # La máscara de U²-Net es dura (silueta). Para que parezca un MAPA DE CALOR y
    # no una segmentación, la difuminamos en un campo continuo (blur grande) y
    # renormalizamos el pico a 1: queda un núcleo caliente que se degrada hacia
    # fuera. En la fase SALIENCY oscurecemos un poco la base para que resalte.
    if w_heat > 0.02:
        m = mask_small.astype(np.float32) / 255.0
        field = cv2.GaussianBlur(m, (0, 0), LW * 0.045)
        field /= float(field.max() + 1e-6)
        base *= (1 - 0.30 * w_heat)
        heat = cv2.applyColorMap((field * 255).astype(np.uint8), cv2.COLORMAP_TURBO).astype(np.float32)
        a = (np.power(field, gamma) * (alpha * w_heat))[..., None]
        base = base * (1 - a) + heat * a
    base = base.astype(np.uint8)

    # --- bbox + trayectoria (fuerte cuando w_heat bajo) ---
    track_a = 0.25 + 0.75 * (1 - w_heat)
    ov = base.copy()
    if len(traj_pts) >= 2:
        cv2.polylines(ov, [np.array(traj_pts, np.int32)], False, accent, 2, cv2.LINE_AA)
    if traj_pts:
        cv2.circle(ov, traj_pts[-1], 4, accent, -1, cv2.LINE_AA)
    draw_bbox_corners(ov, bbox_p, accent, ln=16, th=2)
    base = cv2.addWeighted(ov, track_a, base, 1 - track_a, 0)

    mode = "SALIENCY" if w_heat >= 0.5 else "TRACKING"
    draw_tag(base, (10, 10), f"16:9 / {mode}", accent)
    return base


def build_crop_panel(frame, crop_x, cw, accent):
    """Panel 16:9 inferior: el plano con TODO lo de fuera del crop oscurecido."""
    H0, W0 = frame.shape[:2]
    LW = build_crop_panel.LW
    PH = build_crop_panel.PH
    base = cv2.resize(frame, (LW, PH), interpolation=cv2.INTER_AREA)
    sx = LW / W0
    x0 = int(round(crop_x * sx))
    x1 = int(round((crop_x + cw) * sx))
    dark = (base.astype(np.float32) * 0.30).astype(np.uint8)
    out = dark.copy()
    out[:, x0:x1] = base[:, x0:x1]
    # Ventana de recorte: SOLO las dos verticales (no un rectángulo cerrado). El
    # crop es a alto completo, así que las verticales ya lo definen; evitamos
    # pintar líneas sobre los bordes superior/inferior del panel (exteriores del
    # composite), que daban sensación de «cortado».
    x1l = max(0, min(x1 - 1, LW - 1))
    cv2.line(out, (x0, 0), (x0, PH - 1), accent, 3, cv2.LINE_AA)
    cv2.line(out, (x1l, 0), (x1l, PH - 1), accent, 3, cv2.LINE_AA)
    draw_tag(out, (10, 10), "16:9 / CROP", accent)
    return out


def build_result(frame, crop_x, cw, rw, rh, accent):
    """Panel 9:16 derecho: el recorte vertical real. Sin marco propio: sus bordes
    son exteriores del composite y un marco ahí da sensación de «cortado». El
    único borde de acento de este panel es su lado interior (izquierdo), que lo
    aporta el divisor de acento del gap."""
    H0 = frame.shape[0]
    crop = frame[0:H0, crop_x:crop_x + cw]
    vert = cv2.resize(crop, (rw, rh), interpolation=cv2.INTER_AREA)
    draw_tag(vert, (10, 10), "9:16 / RESULTADO", accent)
    return vert


# ----------------------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", default=os.path.join(os.path.dirname(__file__), "raw", "source.mp4"))
    ap.add_argument("--url", default="", help="si --src no existe, descarga de aquí")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "out"))
    ap.add_argument("--start", type=float, default=0.0, help="segundo inicial")
    ap.add_argument("--seconds", type=float, default=0.0, help="duración a procesar (0 = todo)")
    ap.add_argument("--model", default="u2net", help="modelo de rembg (u2net, isnet-general-use…)")
    ap.add_argument("--accent", default="#f97316", help="color de acento (hex, = tarjeta VIC/EITB)")
    ap.add_argument("--deg", type=int, default=4, help="grado del polinomio de la trayectoria")
    ap.add_argument("--cycle", type=float, default=3.0, help="periodo (s) de alternancia heatmap<->tracking")
    ap.add_argument("--alpha", type=float, default=0.70, help="opacidad máxima del heatmap")
    ap.add_argument("--gamma", type=float, default=0.80, help="<1 ensancha el campo de calor")
    ap.add_argument("--center-bias", type=float, default=0.40, help="sigma (frac.) del sesgo central; 0 lo desactiva")
    ap.add_argument("--track-sigma", type=float, default=0.18, help="sigma (frac.) de la localidad temporal del foco; 0 lo desactiva")
    ap.add_argument("--aspect", type=float, default=1.113, help="aspecto (ancho/alto) objetivo del composite; "
                    "se recorta la fuente para que llene la celda de la tarjeta sin letterbox (1.113 = celda actual)")
    ap.add_argument("--out-width", type=int, default=1280, help="ancho final del composite (se escala)")
    ap.add_argument("--crf", type=int, default=23)
    args = ap.parse_args()

    if not os.path.exists(args.src):
        if not args.url:
            sys.exit(f"no existe {args.src} y no se dio --url")
        download(args.url, args.src)

    cap = cv2.VideoCapture(args.src)
    if not cap.isOpened():
        sys.exit(f"no se pudo abrir {args.src}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    W0o = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H0o = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    f0 = int(args.start * fps)
    n = total - f0 if args.seconds <= 0 else min(int(args.seconds * fps), total - f0)
    accent = hex_to_bgr(args.accent)

    # Recorte de la fuente al aspecto objetivo: los dos paneles izquierdos tienen
    # aspecto `r` y, junto al 9:16 de la derecha, el composite queda en
    # CW/CH = (r + 1.125)/2 = args.aspect -> así llena la celda de la tarjeta sin
    # letterbox. Recortamos centrado (ancho o alto, lo que toque).
    r = max(0.90, min(16 / 9, 2 * args.aspect - 1.125))
    if r < W0o / H0o:                       # recortar ancho (caso habitual)
        Wc, Hc = int(round(H0o * r)), H0o
    else:                                   # recortar alto
        Wc, Hc = W0o, int(round(W0o / r))
    x_off, y_off = (W0o - Wc) // 2, (H0o - Hc) // 2
    W0, H0 = Wc, Hc

    def crop_src(fr):
        return fr[y_off:y_off + Hc, x_off:x_off + Wc]

    print(f"src={os.path.relpath(args.src)}  {W0o}x{H0o}@{fps:.0f} -> recorte {Wc}x{Hc} (r={r:.3f})  frames {f0}..{f0+n}")

    # --- geometría del composite: solo las 3 regiones, separadas por un GAP fino ---
    LW = 760
    PH = int(round(LW / r))       # alto de cada panel (aspecto = r)
    GAP = 10
    COLH = 2 * PH + GAP           # alto de la columna izquierda (= alto total)
    RW = (COLH * 9 // 16) // 2 * 2  # ancho del 9:16 (par)
    CW = LW + GAP + RW
    CH = COLH
    CW += CW & 1
    CH += CH & 1
    build_crop_panel.LW = LW
    build_crop_panel.PH = PH
    cw = H0 * 9 // 16             # ancho del recorte 9:16 en coords (ya recortadas)
    print(f"composite {CW}x{CH} (aspect {CW/CH:.3f})  crop 9:16 {cw}x{H0}")

    # priors espaciales para no engancharse a distractores cuando el sujeto se
    # aleja: (1) sesgo central — los sujetos relevantes suelen ir hacia el centro;
    # (2) localidad temporal — el foco no salta de golpe, así un objeto lejano del
    # borde (p. ej. las piernas en primer plano) no roba la saliencia.
    yy, xx = np.mgrid[0:H0, 0:W0].astype(np.float32)
    if args.center_bias > 0:
        center_prior = np.exp(-(((xx - W0 / 2) / (args.center_bias * W0)) ** 2 +
                                ((yy - H0 / 2) / (args.center_bias * H0)) ** 2) / 2).astype(np.float32)
    else:
        center_prior = np.ones((H0, W0), np.float32)

    # ===== PASADA 1: saliencia, foco y bbox por frame =====
    print("· pasada 1/2: saliencia U²-Net por frame…")
    sess = saliency_session(args.model)
    from rembg import remove
    cap.set(cv2.CAP_PROP_POS_FRAMES, f0)
    masks, cxs, cys, bboxes = [], [], [], []
    prev = None
    for i in range(n):
        ok, frame = cap.read()
        if not ok:
            n = i
            break
        frame = crop_src(frame)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mask = remove(rgb, only_mask=True, session=sess)
        sal = (mask.astype(np.float32) / 255.0) * center_prior
        if prev is not None and args.track_sigma > 0:
            loc = np.exp(-(((xx - prev[0]) / (args.track_sigma * W0)) ** 2 +
                           ((yy - prev[1]) / (args.track_sigma * H0)) ** 2) / 2).astype(np.float32)
            sal = sal * loc
        cx, cy, bbox, good = focus_and_bbox(sal, prev)
        prev = (cx, cy, bbox, good)
        cxs.append(cx); cys.append(cy); bboxes.append(bbox)
        # el heatmap muestra la saliencia YA PONDERADA (lo que el algoritmo usa)
        masks.append(cv2.resize((np.clip(sal, 0, 1) * 255).astype(np.uint8), (LW, PH), interpolation=cv2.INTER_AREA))
        if (i + 1) % 25 == 0 or i + 1 == n:
            print(f"    {i+1}/{n}")
    cap.release()

    # ===== trayectoria de cámara: fit polinómico =====
    t = np.arange(n)
    px = np.polyfit(t, np.array(cxs), args.deg)
    cam_cx = np.clip(np.polyval(px, t), cw / 2, W0 - cw / 2)
    crop_x = np.clip(np.round(cam_cx - cw / 2).astype(int), 0, W0 - cw)
    # trayectoria del foco suavizada (para el trail del panel de análisis)
    py = np.polyfit(t, np.array(cys), args.deg)
    foc_x = np.polyval(px, t)
    foc_y = np.polyval(py, t)
    sx, sy = LW / W0, PH / H0

    # ===== PASADA 2: componer + encode =====
    print("· pasada 2/2: componiendo y codificando…")
    os.makedirs(args.out, exist_ok=True)
    out_mp4 = os.path.join(args.out, "autoflip-demo.mp4")
    out_poster = os.path.join(args.out, "autoflip-poster.jpg")
    scaled_w = args.out_width + (args.out_width & 1)
    scaled_h = int(round(CH * scaled_w / CW)); scaled_h += scaled_h & 1
    ff = subprocess.Popen([
        ffmpeg_bin(), "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
        "-s", f"{CW}x{CH}", "-r", f"{fps}", "-i", "-", "-an",
        "-vf", f"scale={scaled_w}:{scaled_h}:flags=lanczos",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", str(args.crf),
        "-movflags", "+faststart", out_mp4,
    ], stdin=subprocess.PIPE)

    cap = cv2.VideoCapture(args.src)
    cap.set(cv2.CAP_PROP_POS_FRAMES, f0)
    period = max(1.0, args.cycle * fps)
    for i in range(n):
        ok, frame = cap.read()
        if not ok:
            break
        frame = crop_src(frame)
        w_heat = (np.cos(2 * np.pi * i / period) + 1) / 2  # 1 -> 0 -> 1

        # trail de la trayectoria (últimos ~40 puntos) en coords de panel
        j0 = max(0, i - 40)
        traj = [(int(foc_x[k] * sx), int(foc_y[k] * sy)) for k in range(j0, i + 1)]
        bx, by, bw, bh = bboxes[i]
        bbox_p = (int(bx * sx), int(by * sy), int(bw * sx), int(bh * sy))

        top = build_annotated(frame, masks[i], traj, bbox_p, accent, w_heat, args.alpha, args.gamma)
        bot = build_crop_panel(frame, int(crop_x[i]), cw, accent)
        res = build_result(frame, int(crop_x[i]), cw, RW, COLH, accent)

        # Fondo = acento: como las 3 regiones cubren todo salvo los dos GAPs, lo
        # único que asoma es ese acento en los GAPs = divisores INTERIORES (entre
        # análisis/crop y entre la columna izquierda y el resultado). El perímetro
        # exterior queda sin acento.
        canvas = np.full((CH, CW, 3), accent, np.uint8)
        canvas[0:PH, 0:LW] = top
        canvas[PH + GAP:2 * PH + GAP, 0:LW] = bot
        rx = LW + GAP
        canvas[0:COLH, rx:rx + RW] = res

        ff.stdin.write(canvas.tobytes())
        if i == 0:
            cv2.imwrite(out_poster, canvas, [cv2.IMWRITE_JPEG_QUALITY, 88])
        if (i + 1) % 25 == 0 or i + 1 == n:
            print(f"    {i+1}/{n}")
    cap.release()
    ff.stdin.close()
    ff.wait()
    size = os.path.getsize(out_mp4) // 1024
    print(f"  -> {os.path.relpath(out_mp4)} ({size} KB)")
    print(f"  -> {os.path.relpath(out_poster)}")


if __name__ == "__main__":
    main()
