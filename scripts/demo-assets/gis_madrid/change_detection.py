#!/usr/bin/env python3
"""Detección de cambios urbanísticos sobre ortofotos co-registradas.

Pipeline (idéntico en espíritu al original de GIS Madrid):

  1. Dos imágenes de la MISMA zona en dos años -> ya co-registradas (mismo bbox).
  2. Cada una se codifica con un encoder visual denso (SAM image-encoder, DINOv2
     o DINOv3) -> rejilla de embeddings por «patch» (HxW x C).
  3. Similitud coseno patch-a-patch entre ambos años. cambio = 1 - coseno.
     Usar embeddings (en vez de diferencia de píxeles) hace la señal robusta a
     iluminación, sombras y estación: un edificio igual con otra luz sigue
     teniendo embeddings parecidos -> coseno alto -> poco cambio.
  4. Postproceso: normalización robusta por percentiles, suavizado gaussiano y
     alpha proporcional a la magnitud del cambio.
  5. Overlay del mapa de calor sobre la ortofoto con transparencia.

Backends:
  --backend sam     SAM image-encoder (ViT-Det)      rejilla 64x64
  --backend dinov2  DINOv2 (con registers)           rejilla = target/14
  --backend dinov3  DINOv3 (incl. variante satélite) rejilla = target/16

Uso típico:
  python change_detection.py --before raw/plaza-espana-2017.jpg \
      --after raw/plaza-espana-2023.jpg --backend dinov2 --out out
"""
from __future__ import annotations

import argparse
import os
import urllib.request

import cv2
import numpy as np
import torch

# ----------------------------------------------------------------------------- utilidades

COLORMAPS = {
    "turbo": cv2.COLORMAP_TURBO,
    "inferno": cv2.COLORMAP_INFERNO,
    "magma": cv2.COLORMAP_MAGMA,
    "jet": cv2.COLORMAP_JET,
    "hot": cv2.COLORMAP_HOT,
    "viridis": cv2.COLORMAP_VIRIDIS,
}

SAM_WEIGHTS = {
    "vit_b": ("sam_vit_b_01ec64.pth", "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth"),
    "vit_l": ("sam_vit_l_0b3195.pth", "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth"),
    "vit_h": ("sam_vit_h_4b8939.pth", "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth"),
}

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


def device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def load_rgb(path: str) -> np.ndarray:
    img = cv2.imread(path, cv2.IMREAD_COLOR)
    if img is None:
        raise FileNotFoundError(path)
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def match_histograms(src: np.ndarray, ref: np.ndarray) -> np.ndarray:
    """Iguala la distribución de color de `src` a la de `ref` (por canal, vía CDF).

    Neutraliza las diferencias globales de iluminación/estación/procesado entre
    los dos vuelos, que de otro modo el encoder interpreta como «cambio» en toda
    la escena."""
    out = np.empty_like(src)
    for c in range(src.shape[2]):
        s = src[..., c].ravel()
        r = ref[..., c].ravel()
        s_vals, s_idx, s_counts = np.unique(s, return_inverse=True, return_counts=True)
        r_vals, r_counts = np.unique(r, return_counts=True)
        s_q = np.cumsum(s_counts).astype(np.float64) / s.size
        r_q = np.cumsum(r_counts).astype(np.float64) / r.size
        interp = np.interp(s_q, r_q, r_vals)
        out[..., c] = interp[s_idx].reshape(src[..., c].shape)
    return out.astype(np.uint8)


def align_ecc(moving: np.ndarray, fixed: np.ndarray) -> np.ndarray:
    """Refina el registro de `moving` hacia `fixed` (traslación + rotación) con ECC.

    Las ortofotos ya vienen georreferenciadas, pero entre vuelos hay pequeños
    desfases (sub-píxel a unos pocos px) que generan halos en los bordes. ECC
    sobre la luminancia los corrige sin tocar el contenido."""
    g_mov = cv2.cvtColor(moving, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    g_fix = cv2.cvtColor(fixed, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    warp = np.eye(2, 3, dtype=np.float32)
    crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6)
    try:
        cv2.findTransformECC(g_fix, g_mov, warp, cv2.MOTION_EUCLIDEAN, crit, None, 5)
    except cv2.error:
        print("  ⚠ ECC no convergió; se usa la imagen sin alinear")
        return moving
    h, w = fixed.shape[:2]
    return cv2.warpAffine(moving, warp, (w, h), flags=cv2.INTER_LINEAR + cv2.WARP_INVERSE_MAP,
                          borderMode=cv2.BORDER_REPLICATE)


def ensure_weight(filename: str, url: str) -> str:
    os.makedirs(MODELS_DIR, exist_ok=True)
    dest = os.path.join(MODELS_DIR, filename)
    if not os.path.exists(dest):
        print(f"  descargando {filename} …")
        urllib.request.urlretrieve(url, dest)
    return dest


# ----------------------------------------------------------------------------- encoders

def features_sam(before: np.ndarray, after: np.ndarray, dev: str, arch: str) -> tuple[torch.Tensor, torch.Tensor]:
    """SAM image-encoder. Entrada 1024x1024 -> features [256, 64, 64]."""
    from segment_anything import sam_model_registry

    fname, url = SAM_WEIGHTS[arch]
    sam = sam_model_registry[arch](checkpoint=ensure_weight(fname, url)).to(dev).eval()
    size = sam.image_encoder.img_size  # 1024

    def encode(rgb: np.ndarray) -> torch.Tensor:
        r = cv2.resize(rgb, (size, size), interpolation=cv2.INTER_AREA)
        t = torch.as_tensor(r, device=dev).permute(2, 0, 1).contiguous()[None].float()
        t = sam.preprocess(t)  # normaliza con pixel_mean/std + pad (aquí ya es 1024²)
        with torch.no_grad():
            return sam.image_encoder(t)[0]  # [256, 64, 64]

    return encode(before), encode(after)


def _dino_encode(model, rgb: np.ndarray, dev: str, patch: int, target: int) -> torch.Tensor:
    r = cv2.resize(rgb, (target, target), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    x = torch.from_numpy(r).permute(2, 0, 1)[None]
    mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)
    x = ((x - mean) / std).to(dev)
    with torch.no_grad():
        out = model.forward_features(x)
    tok = out["x_norm_patchtokens"][0]  # [N, C]
    g = target // patch
    return tok.reshape(g, g, -1).permute(2, 0, 1).contiguous()  # [C, g, g]


def features_dinov2(before, after, dev, arch, target):
    patch = 14
    target = (target // patch) * patch
    model = torch.hub.load("facebookresearch/dinov2", arch).to(dev).eval()
    return _dino_encode(model, before, dev, patch, target), _dino_encode(model, after, dev, patch, target)


def features_sam3(before, after, dev, ckpt, target):
    """Vision encoder de SAM 3 (Perception Encoder ViT-L/14, 32 capas, dim 1024).

    Cargamos solo el backbone de visión (`detector_model.vision_encoder.backbone.*`)
    desde el checkpoint de SAM 3, vía las clases nativas de transformers. La
    pos-embed (24×24 @ 336px) se *tila* para cualquier resolución, así que corremos
    a 1008px -> rejilla 72×72 (comparable a DINOv2). Normalización [-1, 1]."""
    from transformers import Sam3ViTConfig, Sam3ViTModel
    from safetensors.torch import load_file

    size = (target // 14) * 14
    g = size // 14  # lado de la rejilla
    # image_size = resolución real de entrada: dimensiona el RoPE 2D a gxg. La
    # pos-embed sigue siendo 24×24 (el modelo la tila en runtime), así que se carga tal cual.
    cfg = Sam3ViTConfig(image_size=size)
    model = Sam3ViTModel(cfg).to(dev).eval()
    sd = load_file(ckpt)
    pre = "detector_model.vision_encoder.backbone."
    bsd = {k[len(pre):]: v for k, v in sd.items() if k.startswith(pre)}
    missing, unexpected = model.load_state_dict(bsd, strict=False)
    print(f"  backbone cargado: {len(bsd)} tensores  rejilla {g}×{g}  (missing={len(missing)} unexpected={len(unexpected)})")

    def encode(rgb):
        r = cv2.resize(rgb, (size, size), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
        x = torch.from_numpy(r).permute(2, 0, 1)[None]
        x = ((x - 0.5) / 0.5).to(dev)
        with torch.no_grad():
            out = model(pixel_values=x)
        g = size // 14
        return out.last_hidden_state[0].reshape(g, g, -1).permute(2, 0, 1).contiguous()

    return encode(before), encode(after)


def features_dinov3(before, after, dev, arch, target, weights):
    patch = 16
    target = (target // patch) * patch
    kwargs = {}
    if weights:
        kwargs["weights"] = weights
    model = torch.hub.load("facebookresearch/dinov3", arch, **kwargs).to(dev).eval()
    return _dino_encode(model, before, dev, patch, target), _dino_encode(model, after, dev, patch, target)


# ----------------------------------------------------------------------------- cambio + render

def change_grid(f0: torch.Tensor, f1: torch.Tensor, center: bool = True) -> np.ndarray:
    """1 - similitud coseno por patch -> rejilla [g, g] en [0, 1].

    Con `center`, se resta a cada imagen su embedding medio espacial: elimina la
    componente común («apariencia global» de ese vuelo) y deja que el coseno mida
    la estructura relativa, no el tono general."""
    if center:
        f0 = f0 - f0.mean(dim=(1, 2), keepdim=True)
        f1 = f1 - f1.mean(dim=(1, 2), keepdim=True)
    f0 = torch.nn.functional.normalize(f0, dim=0)
    f1 = torch.nn.functional.normalize(f1, dim=0)
    cos = (f0 * f1).sum(0).clamp(-1, 1)
    return (1 - cos).clamp(0, 1).float().cpu().numpy()


def postprocess(grid, h, w, p_lo, p_hi, blur_frac, floor, min_area_frac, grid_blur=1.5):
    # pre-suavizado a escala de patch: el cambio real (la obra) es una región
    # grande y coherente; el ruido (bordes de tejado, sombras, paralaje) es de
    # alta frecuencia. Un gaussiano sobre la rejilla pequeña promedia ese ruido
    # y conserva la mancha grande -> mucho más contraste tras normalizar.
    if grid_blur > 0:
        grid = cv2.GaussianBlur(grid, (0, 0), grid_blur)
    # normalización robusta: p_lo alto deja el "ruido de fondo" en 0 y solo
    # sobrevive el cambio fuerte.
    lo, hi = np.percentile(grid, [p_lo, p_hi])
    g = np.clip((grid - lo) / (hi - lo + 1e-6), 0, 1)
    cm = cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC)
    cm = np.clip(cm, 0, 1)

    # descarta manchas pequeñas e incoherentes (ruido punteado de tejados)
    if min_area_frac > 0:
        mask = (cm > max(floor, 0.15)).astype(np.uint8)
        n, lbl, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
        keep = np.zeros_like(mask)
        min_area = min_area_frac * h * w
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] >= min_area:
                keep[lbl == i] = 1
        cm *= cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 0.01 * max(h, w))

    k = max(3, int(blur_frac * max(h, w)) | 1)  # kernel impar
    cm = cv2.GaussianBlur(cm, (k, k), 0)
    if floor > 0:
        cm = np.clip((cm - floor) / (1 - floor), 0, 1)
    return np.clip(cm, 0, 1)


def render_overlay(base_rgb, cm, colormap, alpha_max, gamma):
    heat = cv2.applyColorMap((cm * 255).astype(np.uint8), COLORMAPS[colormap])
    heat = cv2.cvtColor(heat, cv2.COLOR_BGR2RGB).astype(np.float32)
    a = ((cm ** gamma) * alpha_max)[..., None]
    return (base_rgb.astype(np.float32) * (1 - a) + heat * a).astype(np.uint8)


# ----------------------------------------------------------------------------- main

def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--before", required=True)
    ap.add_argument("--after", required=True)
    ap.add_argument("--backend", choices=["sam", "sam3", "dinov2", "dinov3"], default="dinov2")
    ap.add_argument("--sam-arch", default="vit_l", choices=list(SAM_WEIGHTS))
    ap.add_argument("--sam3-weights", default=os.path.join(MODELS_DIR, "sam3.safetensors"), help="ruta al checkpoint de SAM 3")
    ap.add_argument("--sam3-target", type=int, default=1008, help="resolución de entrada para SAM 3 (1008 -> 72×72)")
    ap.add_argument("--dinov2-arch", default="dinov2_vitl14_reg")
    ap.add_argument("--dinov3-arch", default="dinov3_vitl16")
    ap.add_argument("--dinov3-weights", default="", help="ruta a pesos DINOv3 (.pth) si el hub no los baja solo")
    ap.add_argument("--target", type=int, default=1036, help="lado de entrada para DINO (se ajusta al múltiplo del patch)")
    ap.add_argument("--overlay-on", choices=["after", "before"], default="after")
    ap.add_argument("--out-width", type=int, default=1536)
    ap.add_argument("--colormap", default="turbo", choices=list(COLORMAPS))
    ap.add_argument("--alpha", type=float, default=0.65, help="opacidad máxima del heatmap")
    ap.add_argument("--gamma", type=float, default=2.2, help=">1 atenúa cambios débiles (menos ruido)")
    ap.add_argument("--p-lo", type=float, default=80.0, help="percentil que se mapea a 0 (umbral de ruido de fondo)")
    ap.add_argument("--p-hi", type=float, default=99.0)
    ap.add_argument("--blur-frac", type=float, default=0.012)
    ap.add_argument("--grid-blur", type=float, default=1.5, help="sigma (en celdas) del pre-suavizado de la rejilla")
    ap.add_argument("--floor", type=float, default=0.0, help="recorta el heatmap por debajo de este valor")
    ap.add_argument("--min-area-frac", type=float, default=0.0008, help="elimina manchas menores que esta fracción del área")
    ap.add_argument("--align", action="store_true", help="alinea las imágenes con ECC antes de codificar")
    ap.add_argument("--match-hist", action="store_true", help="iguala el color del before al after (quita diferencia global de luz)")
    ap.add_argument("--no-center", action="store_true", help="desactiva el centrado de features")
    ap.add_argument("--save-grid", default="", help="guarda la rejilla de cambio cruda (.npy) para iterar el render")
    ap.add_argument("--load-grid", default="", help="carga una rejilla .npy y salta el encoder (render instantáneo)")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "out"))
    args = ap.parse_args()

    before = load_rgb(args.before)
    after = load_rgb(args.after)
    if args.align:
        before = align_ecc(before, after)
    if args.match_hist:
        before = match_histograms(before, after)

    if args.load_grid:
        grid = np.load(args.load_grid)
        print(f"grid cargada de {args.load_grid}  shape={grid.shape}")
    else:
        dev = device()
        print(f"backend={args.backend}  device={dev}")
        if args.backend == "sam":
            f0, f1 = features_sam(before, after, dev, args.sam_arch)
        elif args.backend == "sam3":
            f0, f1 = features_sam3(before, after, dev, args.sam3_weights, args.sam3_target)
        elif args.backend == "dinov2":
            f0, f1 = features_dinov2(before, after, dev, args.dinov2_arch, args.target)
        else:
            f0, f1 = features_dinov3(before, after, dev, args.dinov3_arch, args.target, args.dinov3_weights)
        print(f"  rejilla de features: {tuple(f0.shape)}")
        grid = change_grid(f0, f1, center=not args.no_center)
        if args.save_grid:
            np.save(args.save_grid, grid)

    base_src = after if args.overlay_on == "after" else before
    h0, w0 = base_src.shape[:2]
    w = args.out_width
    h = round(h0 * w / w0)
    base = cv2.resize(base_src, (w, h), interpolation=cv2.INTER_AREA)
    cm = postprocess(grid, h, w, args.p_lo, args.p_hi, args.blur_frac, args.floor, args.min_area_frac, args.grid_blur)
    overlay = render_overlay(base, cm, args.colormap, args.alpha, args.gamma)

    os.makedirs(args.out, exist_ok=True)
    tag = args.backend
    before_r = cv2.resize(before, (w, h), interpolation=cv2.INTER_AREA)
    after_r = cv2.resize(after, (w, h), interpolation=cv2.INTER_AREA)
    p_overlay = os.path.join(args.out, f"overlay-{tag}.jpg")
    p_before = os.path.join(args.out, "before.jpg")
    p_after = os.path.join(args.out, "after.jpg")
    cv2.imwrite(p_overlay, cv2.cvtColor(overlay, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(p_before, cv2.cvtColor(before_r, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(p_after, cv2.cvtColor(after_r, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])

    # hoja de contacto para revisión rápida: antes | después | overlay
    sep = np.full((h, 6, 3), 255, np.uint8)
    sheet = np.concatenate([before_r, sep, after_r, sep, overlay], axis=1)
    p_sheet = os.path.join(args.out, f"review-{tag}.jpg")
    cv2.imwrite(p_sheet, cv2.cvtColor(sheet, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
    print(f"  -> {os.path.relpath(p_overlay)}")
    print(f"  -> {os.path.relpath(p_sheet)} (antes | después | overlay)")


if __name__ == "__main__":
    main()
