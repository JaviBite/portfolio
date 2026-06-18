#!/usr/bin/env python3
"""Descarga ortofotos históricas del IGN (servicio WMS «PNOA histórico»).

Cada vuelo PNOA cubre años distintos según la zona; el servicio expone una capa
por año (``PNOA2004`` … ``PNOA2024``). Pedimos la **misma bbox** para varios años,
de modo que las imágenes quedan co-registradas geográficamente (mismo extent,
mismo CRS) — justo lo que necesita la detección de cambios: nada de registro
manual, el orthomosaico ya está georreferenciado.

Ojo: no todos los años tienen cobertura en toda España. Para Plaza de España
(Madrid) los vuelos con datos reales son 2006, 2009, 2011, 2014, 2017, 2020 y
2023. El script avisa cuando un año devuelve un tile en blanco.

Fuente: https://www.ign.es/wms/pnoa-historico  (© Instituto Geográfico Nacional / PNOA, CC-BY 4.0)
"""
from __future__ import annotations

import argparse
import math
import os

import numpy as np
import requests
from PIL import Image

# Fuentes de ortofotos. Cada una expone una capa por año.
#   ign    -> PNOA histórico del IGN: un único WMS, capa PNOA{year} (25-50 cm).
#   madrid -> Ayuntamiento de Madrid: un WMS por año, capa ORTO_{year}_10_10.
#             ¡ORTOFOTO VERDADERA (true ortho) a 10 cm! Los edificios NO se abaten,
#             así que apenas hay paralaje -> detección de cambios mucho más limpia.
SOURCES = {
    "ign": {
        "wms": "https://www.ign.es/wms/pnoa-historico",
        "layer": "PNOA{year}",
    },
    "madrid": {
        "wms": "https://servpub.madrid.es/georaster/ORTOFOTOS_COMPLETAS/ORTO_{year}_10_10/ows",
        "layer": "ORTO_{year}_10_10",
    },
}
R = 6378137.0  # radio esférico de Web Mercator (EPSG:3857)


def lonlat_to_3857(lon: float, lat: float) -> tuple[float, float]:
    """Proyecta lon/lat (grados) a EPSG:3857 (metros Web Mercator)."""
    x = R * math.radians(lon)
    y = R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return x, y


def getmap_url(wms: str, layer: str, bbox: tuple[float, float, float, float], size: int) -> str:
    """Construye una petición WMS 1.3.0 GetMap en EPSG:3857 (eje X,Y)."""
    params = {
        "SERVICE": "WMS",
        "VERSION": "1.3.0",
        "REQUEST": "GetMap",
        "LAYERS": layer,
        "STYLES": "",
        "CRS": "EPSG:3857",
        "BBOX": ",".join(f"{v:.4f}" for v in bbox),
        "WIDTH": str(size),
        "HEIGHT": str(size),
        "FORMAT": "image/jpeg",
    }
    from urllib.parse import urlencode

    sep = "&" if "?" in wms else "?"
    return f"{wms}{sep}{urlencode(params)}"


def coverage_stats(path: str) -> tuple[float, float]:
    a = np.asarray(Image.open(path).convert("L"), dtype=np.float32)
    return float(a.mean()), float(a.std())


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", choices=list(SOURCES), default="madrid", help="fuente de ortofotos")
    ap.add_argument("--lon", type=float, default=-3.7122, help="longitud del centro (def: Plaza de España)")
    ap.add_argument("--lat", type=float, default=40.4224, help="latitud del centro (def: encuadre c1, ~155 m al sur)")
    ap.add_argument("--size-m", type=float, default=520.0, help="lado del cuadrado en metros 3857")
    ap.add_argument("--years", default="2019,2023", help="años separados por comas")
    ap.add_argument("--width", type=int, default=2560, help="px de lado (Madrid es true-ortho 10 cm nativo)")
    ap.add_argument("--out-dir", default=os.path.join(os.path.dirname(__file__), "raw"))
    ap.add_argument("--prefix", default="plaza-espana")
    ap.add_argument("--wms", default="", help="override del endpoint WMS (usa {year})")
    ap.add_argument("--layer", default="", help="override del nombre de capa (usa {year})")
    args = ap.parse_args()

    src = SOURCES[args.source]
    wms_tpl = args.wms or src["wms"]
    layer_tpl = args.layer or src["layer"]

    cx, cy = lonlat_to_3857(args.lon, args.lat)
    half = args.size_m / 2
    bbox = (cx - half, cy - half, cx + half, cy + half)
    os.makedirs(args.out_dir, exist_ok=True)
    print(f"fuente={args.source}  centro EPSG:3857 = ({cx:.1f}, {cy:.1f})  bbox={tuple(round(v,1) for v in bbox)}")

    for year in (s.strip() for s in args.years.split(",") if s.strip()):
        wms = wms_tpl.format(year=year)
        layer = layer_tpl.format(year=year)
        out = os.path.join(args.out_dir, f"{args.prefix}-{year}.jpg")
        url = getmap_url(wms, layer, bbox, args.width)
        r = requests.get(url, timeout=90)
        r.raise_for_status()
        with open(out, "wb") as fh:
            fh.write(r.content)
        mean, std = coverage_stats(out)
        flag = "  ⚠ BLANK (sin cobertura ese año)" if std < 8.0 else ""
        print(f"  {layer:10s} -> {os.path.relpath(out)}  ({len(r.content)//1024} KB, mean={mean:.1f} std={std:.1f}){flag}")


if __name__ == "__main__":
    main()
