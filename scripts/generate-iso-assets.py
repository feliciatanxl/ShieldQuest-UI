#!/usr/bin/env python3
"""
Generate Habbo-style 2:1 isometric pixel-art ground tiles, Singapore heartland
buildings, street furniture, vehicles, and props for ShieldQuest.

Outputs:
  public/assets/iso/tiles/<id>-day.png, <id>-night.png   (32x16 native px)
  public/assets/iso/props/<id>-day.png, <id>-night.png   (variable native px)
  public/assets/iso/manifest.json                        (dimensions + tile-center anchor)

Run with --preview to also export inspection sheets to scratch/ if --preview-dir is passed.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import random
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional, Tuple

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "assets" / "iso"
TILES_DIR = OUT_DIR / "tiles"
PROPS_DIR = OUT_DIR / "props"

INK = (35, 26, 22, 255)       # #231a16 crisp dark ink outline
INK_SOFT = (54, 42, 36, 255)  # softer seam line
TRANSPARENT = (0, 0, 0, 0)

RGBA = Tuple[int, int, int, int]
RGB = Tuple[int, int, int]


def hex_rgba(h: str, a: int = 255) -> RGBA:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def shade(c: RGBA, factor: float) -> RGBA:
    return (
        max(0, min(255, int(round(c[0] * factor)))),
        max(0, min(255, int(round(c[1] * factor)))),
        max(0, min(255, int(round(c[2] * factor)))),
        c[3],
    )


def mix(a: RGBA, b: RGBA, t: float) -> RGBA:
    return (
        int(round(a[0] + (b[0] - a[0]) * t)),
        int(round(a[1] + (b[1] - a[1]) * t)),
        int(round(a[2] + (b[2] - a[2]) * t)),
        int(round(a[3] + (b[3] - a[3]) * t)),
    )


def relight_image(day_img: Image.Image, emissive_mask: Optional[Image.Image] = None) -> Image.Image:
    """
    Create a cosy Singapore evening/night version of a day sprite.
    Pixels marked non-zero in `emissive_mask` stay bright / glow warmly instead of darkening.
    """
    w, h = day_img.size
    src = day_img.load()
    em = emissive_mask.load() if emissive_mask else None
    out = Image.new("RGBA", (w, h), TRANSPARENT)
    dst = out.load()

    night_tint = (38, 46, 78)  # cool twilight indigo
    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            if a == 0:
                continue
            glow = em[x, y] if em else (0, 0, 0, 0)
            if glow[3] > 0:
                # Blend toward emissive colour so lit windows, signs, chillers glow warmly
                t = glow[3] / 255.0
                nr = int(r * (1 - t * 0.65) + glow[0] * (t * 0.65))
                ng = int(g * (1 - t * 0.65) + glow[1] * (t * 0.65))
                nb = int(b * (1 - t * 0.65) + glow[2] * (t * 0.65))
                dst[x, y] = (min(255, nr), min(255, ng), min(255, nb), a)
            elif (r, g, b) == INK[:3]:
                dst[x, y] = (20, 17, 26, a)
            else:
                # Darken and shift slightly cool twilight while preserving contrast
                nr = int(r * 0.44 + night_tint[0] * 0.24)
                ng = int(g * 0.46 + night_tint[1] * 0.24)
                nb = int(b * 0.56 + night_tint[2] * 0.28)
                dst[x, y] = (min(255, nr), min(255, ng), min(255, nb), a)
    return out


# ---------------- 2:1 Isometric Tile Helpers (32x16 native) ----------------

TILE_W = 32
TILE_H = 16


def diamond_mask() -> List[Tuple[int, int]]:
    """All (x, y) pixel coordinates inside the 32x16 isometric tile diamond."""
    pts: List[Tuple[int, int]] = []
    for y in range(TILE_H):
        # Rows 0..7 expand from half-width 2..16; rows 8..15 mirror 16..2
        half = (y + 1) * 2 if y < 8 else (TILE_H - y) * 2
        x0 = 16 - half
        x1 = 16 + half
        for x in range(x0, x1):
            pts.append((x, y))
    return pts


DIAMOND_PTS = diamond_mask()
DIAMOND_SET = set(DIAMOND_PTS)


def make_tile(fill_fn: Callable[[int, int, float, float], RGBA]) -> Image.Image:
    """
    Create a 32x16 diamond tile.
    `fill_fn(x, y, u, v)` receives pixel (x, y) and normalised iso coords u, v in [-0.5, 0.5].
    """
    img = Image.new("RGBA", (TILE_W, TILE_H), TRANSPARENT)
    px = img.load()
    for x, y in DIAMOND_PTS:
        dx = (x + 0.5 - 16.0) / 16.0
        dy = (y + 0.5 - 8.0) / 8.0
        u = (dx + dy) * 0.5
        v = (dy - dx) * 0.5
        px[x, y] = fill_fn(x, y, u, v)
    return img


def generate_tiles(manifest: Dict[str, dict]) -> None:
    TILES_DIR.mkdir(parents=True, exist_ok=True)
    rng = random.Random(260)

    def save_tile(tid: str, img: Image.Image, em: Optional[Image.Image] = None) -> None:
        day_p = TILES_DIR / f"{tid}-day.png"
        night_p = TILES_DIR / f"{tid}-night.png"
        img.save(day_p)
        relight_image(img, em).save(night_p)
        manifest["tiles"][tid] = {
            "day": f"/assets/iso/tiles/{tid}-day.png",
            "night": f"/assets/iso/tiles/{tid}-night.png",
            "w": TILE_W,
            "h": TILE_H,
        }

    # 1. Grass variants (matching warm tropical olive-green from street-day.png)
    grass_base = hex_rgba("#7f8c46")
    grass_hi = hex_rgba("#92a152")
    grass_lo = hex_rgba("#6c7839")
    grass_dark = hex_rgba("#55612a")

    def grass_fn(variant: int):
        r_local = random.Random(100 + variant)
        speckles = {(x, y): r_local.random() for x, y in DIAMOND_PTS}

        def fn(x: int, y: int, u: float, v: float) -> RGBA:
            s = speckles[(x, y)]
            c = grass_hi if s > 0.86 else (grass_lo if s < 0.14 else grass_base)
            if variant == 1 and (x, y) in {(13, 6), (14, 7), (15, 6), (19, 9), (20, 8)}:
                return grass_dark if y % 2 == 0 else grass_hi
            if variant == 2:
                if (x, y) in {(11, 7), (21, 9)}:
                    return hex_rgba("#f5e37c")
                if (x, y) in {(16, 5), (17, 10)}:
                    return hex_rgba("#f29ab2")
            return c
        return fn

    save_tile("grass", make_tile(grass_fn(0)))
    save_tile("grass_tuft", make_tile(grass_fn(1)))
    save_tile("grass_flower", make_tile(grass_fn(2)))

    # 2. HDB / AMK Town Centre granite pavement slabs (calm sunlit sandstone/granite)
    pav_base = hex_rgba("#d5cab4")
    pav_hi = hex_rgba("#dfd6c3")
    pav_seam = hex_rgba("#beb19a")
    pav_alt = hex_rgba("#ccc0a8")

    def pavement_fn(alt: bool = False):
        r_local = random.Random(201 if alt else 200)
        noise = {(x, y): r_local.random() for x, y in DIAMOND_PTS}

        def fn(x: int, y: int, u: float, v: float) -> RGBA:
            base = pav_alt if alt else pav_base
            if abs(u) > 0.46 or abs(v) > 0.46:
                return mix(base, pav_seam, 0.55)
            if abs(u) < 0.03 or abs(v) < 0.03:
                return mix(base, pav_seam, 0.25)
            n = noise[(x, y)]
            return pav_hi if n > 0.92 else (mix(base, pav_seam, 0.14) if n < 0.07 else base)
        return fn

    save_tile("pavement", make_tile(pavement_fn(False)))
    save_tile("pavement_alt", make_tile(pavement_fn(True)))

    # 3. Void deck terrazzo floor (soft warm cream)
    vd_base = hex_rgba("#ddd3c2")
    vd_speck = hex_rgba("#c8bdab")
    vd_line = hex_rgba("#bfb3a0")

    def void_deck_fn(x: int, y: int, u: float, v: float) -> RGBA:
        if abs(u) > 0.46 or abs(v) > 0.46:
            return vd_line
        if (x * 7 + y * 13) % 23 == 0:
            return vd_speck
        return vd_base

    save_tile("void_deck", make_tile(void_deck_fn))

    # 4. SUNhub Plaza checkered sandstone (low-contrast calm pattern)
    pl_a = hex_rgba("#ddd0b6")
    pl_b = hex_rgba("#d0c1a3")
    pl_seam = hex_rgba("#b7a78a")

    def plaza_fn(alt: bool):
        def fn(x: int, y: int, u: float, v: float) -> RGBA:
            if abs(u) > 0.45 or abs(v) > 0.45:
                return pl_seam
            q = ((u > 0) ^ (v > 0)) ^ alt
            return pl_a if q else pl_b
        return fn

    save_tile("plaza", make_tile(plaza_fn(False)))
    save_tile("plaza_alt", make_tile(plaza_fn(True)))

    # 5. Asphalt road + Singapore road markings
    asphalt = hex_rgba("#4b494e")
    asphalt_hi = hex_rgba("#57555b")
    asphalt_lo = hex_rgba("#3e3c41")
    road_white = hex_rgba("#ece7da")
    road_yellow = hex_rgba("#e8b648")
    road_noise = {(x, y): rng.random() for x, y in DIAMOND_PTS}

    def base_asphalt(x: int, y: int) -> RGBA:
        n = road_noise[(x, y)]
        return asphalt_hi if n > 0.88 else (asphalt_lo if n < 0.12 else asphalt)

    save_tile("road_plain", make_tile(lambda x, y, u, v: base_asphalt(x, y)))
    save_tile("road_se", make_tile(
        lambda x, y, u, v: road_white if (abs(v) < 0.08 and -0.25 < u < 0.25) else base_asphalt(x, y)
    ))
    save_tile("road_sw", make_tile(
        lambda x, y, u, v: road_white if (abs(u) < 0.08 and -0.25 < v < 0.25) else base_asphalt(x, y)
    ))
    save_tile("road_busbay", make_tile(
        lambda x, y, u, v: road_yellow if (abs(v - 0.34) < 0.08 or (abs(u) < 0.09 and abs(v) < 0.22)) else base_asphalt(x, y)
    ))
    save_tile("road_taxibay", make_tile(
        lambda x, y, u, v: road_yellow if (abs(v + 0.34) < 0.08 or abs(v - 0.34) < 0.07 or (abs(u) > 0.38 and abs(v) < 0.36)) else base_asphalt(x, y)
    ))
    save_tile("road_yellowbox", make_tile(
        lambda x, y, u, v: road_yellow if (abs(u - v) < 0.1 or abs(u + v) < 0.1 or abs(u) > 0.42 or abs(v) > 0.42) else base_asphalt(x, y)
    ))
    save_tile("zebra_sw", make_tile(
        lambda x, y, u, v: road_white if (int((u + 0.5) * 6) % 2 == 0 and abs(v) < 0.38) else base_asphalt(x, y)
    ))
    save_tile("zebra_se", make_tile(
        lambda x, y, u, v: road_white if (int((v + 0.5) * 6) % 2 == 0 and abs(u) < 0.38) else base_asphalt(x, y)
    ))

    # 6. Authentic Singapore black-and-yellow striped roadside curb + drain grate
    drain_curb = hex_rgba("#c2b6a1")
    curb_black = hex_rgba("#2f3138")
    curb_yellow = hex_rgba("#ebb838")
    drain_hole = hex_rgba("#383a3f")
    drain_grate = hex_rgba("#7d858c")

    def drain_se_fn(x: int, y: int, u: float, v: float) -> RGBA:
        if v > 0.20:
            return curb_yellow if u < 0.0 else curb_black
        if abs(v) < 0.14:
            return drain_grate if int((u + 0.5) * 8) % 2 == 0 else drain_hole
        return drain_curb

    save_tile("drain_se", make_tile(drain_se_fn))
    save_tile("drain_sw", make_tile(
        lambda x, y, u, v: (drain_grate if (int((v + 0.5) * 8) % 2 == 0 and abs(u) < 0.18) else drain_hole)
        if abs(u) < 0.22 else drain_curb
    ))

    # 7. Tactile yellow blister paving
    tac_base = hex_rgba("#e0b247")
    tac_dot = hex_rgba("#f5cf6e")
    tac_edge = hex_rgba("#b5892b")

    def tactile_fn(x: int, y: int, u: float, v: float) -> RGBA:
        if abs(u) > 0.44 or abs(v) > 0.44:
            return tac_edge
        if (x % 3 == 0) and (y % 2 == 0):
            return tac_dot
        return tac_base

    save_tile("tactile", make_tile(tactile_fn))

    # 8. NParks Park Connector (red jogging + green cycling)
    pcn_r = hex_rgba("#b85249")
    pcn_r_hi = hex_rgba("#cc6258")
    pcn_r_edge = hex_rgba("#8e3932")
    pcn_g = hex_rgba("#458a66")
    pcn_g_hi = hex_rgba("#56a17a")
    pcn_g_edge = hex_rgba("#2f6348")

    save_tile("pcn_red", make_tile(
        lambda x, y, u, v: pcn_r_edge if (abs(u) > 0.44 or abs(v) > 0.44) else (pcn_r_hi if (x + y) % 7 == 0 else pcn_r)
    ))
    save_tile("pcn_green", make_tile(
        lambda x, y, u, v: pcn_g_edge if (abs(u) > 0.44 or abs(v) > 0.44) else (pcn_g_hi if (x + y) % 7 == 0 else pcn_g)
    ))

    # 9. Playground EPDM mat + smooth continuous sunlit sandpit
    pg_o = hex_rgba("#d97e4a")
    pg_b = hex_rgba("#4b88ad")
    sand = hex_rgba("#ebd6a4")
    sand_hi = hex_rgba("#f5e3b8")
    sand_lo = hex_rgba("#dfc892")
    save_tile("playground_orange", make_tile(
        lambda x, y, u, v: shade(pg_o, 0.88) if (abs(u) > 0.44 or abs(v) > 0.44) else (shade(pg_o, 1.07) if (x * 5 + y) % 11 == 0 else pg_o)
    ))
    save_tile("playground_blue", make_tile(
        lambda x, y, u, v: shade(pg_b, 0.88) if (abs(u) > 0.44 or abs(v) > 0.44) else (shade(pg_b, 1.07) if (x * 5 + y) % 11 == 0 else pg_b)
    ))
    save_tile("sandpit", make_tile(
        lambda x, y, u, v: sand_hi if (x * 7 + y * 13) % 19 == 0 else (sand_lo if (x * 11 + y * 5) % 23 == 0 else sand)
    ))

    # 10. Basketball court
    ct_o = hex_rgba("#d47344")
    ct_c = hex_rgba("#e5c48e")
    ct_line = hex_rgba("#f5efe2")
    save_tile("court_orange", make_tile(
        lambda x, y, u, v: ct_line if (abs(u) > 0.43 or abs(v) > 0.43) else ct_o
    ))
    save_tile("court_cream", make_tile(
        lambda x, y, u, v: ct_line if (abs(u) > 0.43 or abs(v) > 0.43) else ct_c
    ))

    # 11. Hawker & Wet Market floor (soft warm tiles)
    hw_base = hex_rgba("#c9baa2")
    hw_seam = hex_rgba("#b0a088")
    mk_base = hex_rgba("#9fa39f")
    mk_wet = hex_rgba("#7b919c")
    save_tile("hawker_floor", make_tile(
        lambda x, y, u, v: hw_seam if (abs(u) > 0.44 or abs(v) > 0.44) else (mix(hw_base, hw_seam, 0.35) if (x * 3 + y * 7) % 13 == 0 else hw_base)
    ))
    save_tile("market_floor", make_tile(
        lambda x, y, u, v: hex_rgba("#767b7a") if (abs(u) > 0.44 or abs(v) > 0.44) else (mk_wet if (u * u + v * v < 0.04) else mk_base)
    ))


# ---------------- 2:1 Isometric Prop Canvas & Primitives ----------------

class IsoCanvas:
    """
    2:1 isometric pixel art canvas with exact tile-grid projection.
    Reference tile (col=0, row=0) has center at (ax, ay).
    +u goes SE (+16, +8), +v goes SW (-16, +8), +z goes UP (0, -1).
    """

    def __init__(self, w: int, h: int, ax: int, ay: int) -> None:
        self.w = w
        self.h = h
        self.ax = ax
        self.ay = ay
        self.img = Image.new("RGBA", (w, h), TRANSPARENT)
        self.em = Image.new("RGBA", (w, h), TRANSPARENT)
        self.draw = ImageDraw.Draw(self.img)
        self.em_draw = ImageDraw.Draw(self.em)

    def pt(self, u: float, v: float, z: float = 0.0) -> Tuple[int, int]:
        x = self.ax + int(round((u - v) * 16.0))
        y = self.ay + int(round((u + v) * 8.0 - z))
        return (x, y)

    def poly(self, pts: Iterable[Tuple[float, float, float]], fill: RGBA, outline: Optional[RGBA] = None, emissive: Optional[RGBA] = None) -> None:
        xy = [self.pt(u, v, z) for (u, v, z) in pts]
        self.draw.polygon(xy, fill=fill, outline=outline)
        if emissive is not None:
            self.em_draw.polygon(xy, fill=emissive)

    def line(self, a: Tuple[float, float, float], b: Tuple[float, float, float], color: RGBA = INK, emissive: Optional[RGBA] = None) -> None:
        pa, pb = self.pt(*a), self.pt(*b)
        self.draw.line([pa, pb], fill=color, width=1)
        if emissive is not None:
            self.em_draw.line([pa, pb], fill=emissive, width=1)

    def box(
        self,
        u0: float,
        u1: float,
        v0: float,
        v1: float,
        z0: float,
        z1: float,
        top: RGBA,
        left_sw: RGBA,
        right_se: RGBA,
        outline: RGBA = INK,
        emissive_faces: Tuple[Optional[RGBA], Optional[RGBA], Optional[RGBA]] = (None, None, None),
    ) -> None:
        """
        Draw an axis-aligned isometric box with 3 visible faces:
        - top (z = z1)
        - left_sw face (v = v1, facing South-West / viewer-left)
        - right_se face (u = u1, facing South-East / viewer-right)
        """
        # Left/SW face (v = v1)
        self.poly(
            [(u0, v1, z1), (u1, v1, z1), (u1, v1, z0), (u0, v1, z0)],
            fill=left_sw,
            outline=outline,
            emissive=emissive_faces[1],
        )
        # Right/SE face (u = u1)
        self.poly(
            [(u1, v0, z1), (u1, v1, z1), (u1, v1, z0), (u1, v0, z0)],
            fill=right_se,
            outline=outline,
            emissive=emissive_faces[2],
        )
        # Top face (z = z1)
        self.poly(
            [(u0, v0, z1), (u1, v0, z1), (u1, v1, z1), (u0, v1, z1)],
            fill=top,
            outline=outline,
            emissive=emissive_faces[0],
        )

    def pset(self, x: int, y: int, c: RGBA, em: Optional[RGBA] = None) -> None:
        if 0 <= x < self.w and 0 <= y < self.h:
            self.img.putpixel((x, y), c)
            if em is not None:
                self.em.putpixel((x, y), em)

    def disc(self, u: float, v: float, z: float, rx: int, ry: int, fill: Optional[RGBA], outline: Optional[RGBA] = INK, em: Optional[RGBA] = None) -> None:
        cx, cy = self.pt(u, v, z)
        self.draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=fill, outline=outline)
        if em is not None and fill is not None:
            self.em_draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=em)

    def add_outer_outline(self, color: RGBA = INK) -> None:
        """Ensure every silhouette edge has a clean 1px crisp dark pixel outline."""
        px = self.img.load()
        edges: List[Tuple[int, int]] = []
        for y in range(self.h):
            for x in range(self.w):
                if px[x, y][3] == 0:
                    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                        if 0 <= nx < self.w and 0 <= ny < self.h and px[nx, ny][3] > 0:
                            edges.append((x, y))
                            break
        for x, y in edges:
            px[x, y] = color


def draw_tiny_text(c: IsoCanvas, u: float, v: float, z: float, text: str, color: RGBA, step_u: float = 0.14, on_se: bool = False, em: Optional[RGBA] = None) -> None:
    """Stamp crisp 3x5 pixel bitmap glyphs along either the SW or SE iso face."""
    FONT: Dict[str, List[str]] = {
        "0": ["111", "101", "101", "101", "111"],
        "1": ["010", "110", "010", "010", "111"],
        "2": ["111", "001", "111", "100", "111"],
        "3": ["111", "001", "111", "001", "111"],
        "4": ["101", "101", "111", "001", "001"],
        "5": ["111", "100", "111", "001", "111"],
        "6": ["111", "100", "111", "101", "111"],
        "7": ["111", "001", "001", "010", "010"],
        "8": ["111", "101", "111", "101", "111"],
        "9": ["111", "101", "111", "001", "111"],
        "A": ["010", "101", "111", "101", "101"],
        "B": ["110", "101", "110", "101", "110"],
        "C": ["111", "100", "100", "100", "111"],
        "D": ["110", "101", "101", "101", "110"],
        "E": ["111", "100", "110", "100", "111"],
        "F": ["111", "100", "110", "100", "100"],
        "G": ["111", "100", "101", "101", "111"],
        "H": ["101", "101", "111", "101", "101"],
        "I": ["111", "010", "010", "010", "111"],
        "K": ["101", "101", "110", "101", "101"],
        "L": ["100", "100", "100", "100", "111"],
        "M": ["101", "111", "101", "101", "101"],
        "N": ["101", "111", "111", "101", "101"],
        "O": ["111", "101", "101", "101", "111"],
        "P": ["111", "101", "111", "100", "100"],
        "R": ["110", "101", "110", "101", "101"],
        "S": ["111", "100", "111", "001", "111"],
        "T": ["111", "010", "010", "010", "010"],
        "U": ["101", "101", "101", "101", "111"],
        "V": ["101", "101", "101", "101", "010"],
        "W": ["101", "101", "101", "111", "101"],
        "Y": ["101", "101", "010", "010", "010"],
        "h": ["100", "100", "111", "101", "101"],
        "u": ["000", "000", "101", "101", "111"],
        "b": ["100", "100", "111", "101", "111"],
        " ": ["000", "000", "000", "000", "000"],
    }
    cx, cy = c.pt(u, v, z)
    dx = 0
    for ch in text:
        glyph = FONT.get(ch, FONT[" "])
        for gy, row in enumerate(glyph):
            for gx, bit in enumerate(row):
                if bit == "1":
                    px = cx + dx + gx
                    # Follow 2:1 iso slope (+2px right -> +1px down on SW face, -1px down on SE face)
                    slope = -((dx + gx) // 2) if on_se else ((dx + gx) // 2)
                    py = cy + gy + slope
                    c.pset(px, py, color, em)
        dx += 4


# ---------------- Prop Builders ----------------

def build_hdb_pillar() -> IsoCanvas:
    c = IsoCanvas(24, 48, 12, 38)
    cream = hex_rgba("#efe1c6")
    cream_l = hex_rgba("#d9c6a6")
    cream_r = hex_rgba("#b8a384")
    # Iconic orange/teal/cream HDB mosaic base
    c.box(-0.22, 0.22, -0.22, 0.22, 0, 14, cream, cream_l, cream_r)
    c.box(-0.22, 0.22, -0.22, 0.22, 14, 34, cream, cream_l, cream_r)
    # Mosaic tiles along bottom 14px
    mosaic = [hex_rgba("#d97848"), hex_rgba("#5297a6"), hex_rgba("#e3c898"), hex_rgba("#d97848")]
    x0, y0 = c.pt(-0.2, 0.22, 12)
    for row in range(4):
        for col in range(3):
            col_c = mosaic[(row + col) % len(mosaic)]
            c.draw.rectangle([x0 + col * 2, y0 + row * 3 + col, x0 + col * 2 + 1, y0 + row * 3 + col + 2], fill=col_c)
    x1, y1 = c.pt(0.22, 0.2, 12)
    for row in range(4):
        for col in range(3):
            col_c = shade(mosaic[(row + col + 1) % len(mosaic)], 0.85)
            c.draw.rectangle([x1 + col * 2, y1 + row * 3 - col, x1 + col * 2 + 1, y1 + row * 3 - col + 2], fill=col_c)
    return c


def build_hdb_facade(kind: str) -> IsoCanvas:
    """
    2x1 HDB upper-floor block facade resting on back corridor/pillars so the ground
    looks like an authentic Singapore HDB block (Blk 260, 261, 262).
    """
    c = IsoCanvas(96, 118, 40, 102)
    cream = hex_rgba("#f0e3ca")
    cream_l = hex_rgba("#dfcfb1")
    cream_r = hex_rgba("#baa689")
    terra_l = hex_rgba("#c86646")
    terra_r = hex_rgba("#a65035")
    sky_l = hex_rgba("#6098b8")
    sky_r = hex_rgba("#4c7c99")
    roof = hex_rgba("#9c8f7f")

    # Void deck support pillars at back corners (so ground stays airy)
    for u_p in (-0.35, 1.25):
        c.box(u_p - 0.15, u_p + 0.15, -0.3, 0.0, 0, 26, cream, cream_l, cream_r)

    # Back wall (lift/corridor recessed)
    c.box(-0.4, 1.4, -0.42, -0.18, 0, 26, cream, hex_rgba("#9c8c77"), hex_rgba("#827361"))

    # Upper HDB storeys (z = 26..80)
    c.box(-0.42, 1.42, -0.42, 0.42, 26, 80, roof, cream_l, cream_r)
    # Terracotta / sky-blue facade bands
    c.box(-0.43, 1.43, 0.40, 0.44, 28, 38, terra_l, terra_l, terra_r)
    c.box(-0.43, 1.43, 0.40, 0.44, 54, 66, sky_l, sky_l, sky_r)
    # Rooftop parapet
    c.box(-0.45, 1.45, -0.45, 0.45, 80, 84, hex_rgba("#c8bba4"), cream_l, cream_r)

    # Flat windows (2 bays across u) + warm night glow!
    win_glass = hex_rgba("#38495c")
    win_glow = hex_rgba("#ffcf6b", 230)
    for bay, u_w in enumerate((-0.18, 0.65)):
        for fl, z_w in enumerate((40, 66)):
            lit = (bay + fl + (1 if kind == "261" else 0)) % 2 == 0
            c.poly(
                [(u_w, 0.44, z_w), (u_w + 0.55, 0.44, z_w), (u_w + 0.55, 0.44, z_w + 11), (u_w, 0.44, z_w + 11)],
                fill=win_glass,
                outline=INK,
                emissive=win_glow if lit else None,
            )
            # Bamboo laundry pole + clothes hanging!
            if (bay + fl) % 2 == 0:
                c.line((u_w + 0.1, 0.44, z_w - 2), (u_w + 0.45, 0.78, z_w - 5), hex_rgba("#b58958"))
                shirt_col = hex_rgba("#d95b4b") if bay == 0 else hex_rgba("#5297c7")
                c.poly(
                    [(u_w + 0.18, 0.54, z_w - 3), (u_w + 0.36, 0.68, z_w - 4), (u_w + 0.36, 0.68, z_w - 10), (u_w + 0.18, 0.54, z_w - 9)],
                    fill=shirt_col,
                    outline=INK_SOFT,
                )
            else:
                # Aircon compressor box
                c.box(u_w + 0.05, u_w + 0.32, 0.42, 0.58, z_w - 6, z_w, hex_rgba("#e5e1d8"), hex_rgba("#cfc9be"), hex_rgba("#b0a99d"))

    # Block number sign
    label = {"260": "BLK 260", "261": "261", "262": "BLK 262"}[kind]
    c.poly([(-0.32, 0.44, 71), (0.55, 0.44, 71), (0.55, 0.44, 79), (-0.32, 0.44, 79)], fill=hex_rgba("#f5efe2"), outline=INK)
    draw_tiny_text(c, -0.24, 0.45, 77, label, hex_rgba("#b83932"))
    return c


def build_minimart_front() -> IsoCanvas:
    """Sunshine Minimart shopfront (2x1 footprint) with yellow signboard, chiller, crates."""
    c = IsoCanvas(98, 96, 40, 74)
    cream = hex_rgba("#efe1c6")
    wall_l = hex_rgba("#dfd0b2")
    wall_r = hex_rgba("#bda98b")
    sign_bg = hex_rgba("#f5c242")
    sign_em = hex_rgba("#ffe585", 220)
    chiller = hex_rgba("#8bd4e6")
    chiller_em = hex_rgba("#b8f5ff", 235)

    # Main shop enclosure
    c.box(-0.42, 1.42, -0.42, 0.40, 0, 52, hex_rgba("#a89b88"), wall_l, wall_r)
    # Recessed interior alcove
    c.poly([(-0.25, 0.40, 2), (1.28, 0.40, 2), (1.28, 0.40, 26), (-0.25, 0.40, 26)], fill=hex_rgba("#4c423b"), outline=INK)
    # Lit drinks chiller inside
    c.poly([(-0.15, 0.41, 4), (0.45, 0.41, 4), (0.45, 0.41, 24), (-0.15, 0.41, 24)], fill=chiller, outline=INK, emissive=chiller_em)
    # Drink rows inside chiller
    for rz, rc in ((8, "#e35b4f"), (14, "#f0c94d"), (19, "#6bc272")):
        c.line((-0.10, 0.42, rz), (0.40, 0.42, rz), hex_rgba(rc), emissive=hex_rgba(rc, 200))
    # Shop shelves on right half
    for sz in (8, 15, 21):
        c.line((0.55, 0.42, sz), (1.20, 0.42, sz), hex_rgba("#d98b48"))
    # Yellow "SUNSHINE" signboard across shopfront
    c.box(-0.42, 1.42, 0.36, 0.48, 28, 39, hex_rgba("#f7d66d"), sign_bg, hex_rgba("#d9a52e"), emissive_faces=(None, sign_em, None))
    draw_tiny_text(c, -0.34, 0.49, 36, "SUNSHINE", hex_rgba("#b82b24"), em=hex_rgba("#ff5e4d", 200))
    # Stacked blue & green drink crates outside left
    c.box(-0.42, -0.14, 0.40, 0.68, 0, 7, hex_rgba("#4c7eb8"), hex_rgba("#3c679c"), hex_rgba("#2f5380"))
    c.box(-0.42, -0.14, 0.40, 0.68, 7, 14, hex_rgba("#52a167"), hex_rgba("#3f8552"), hex_rgba("#326b42"))
    # Upper HDB facade cap
    c.box(-0.44, 1.44, -0.42, 0.44, 42, 54, hex_rgba("#c8bba4"), hex_rgba("#c86646"), hex_rgba("#a65035"))
    return c


def build_snack_rack() -> IsoCanvas:
    c = IsoCanvas(36, 36, 18, 26)
    c.box(-0.32, 0.32, -0.22, 0.22, 0, 16, hex_rgba("#b8b3a8"), hex_rgba("#8e8a80"), hex_rgba("#736f67"))
    for z, col in ((5, "#e05a47"), (10, "#f0c243"), (15, "#59a87a")):
        c.box(-0.28, 0.28, -0.16, 0.24, z - 3, z, hex_rgba(col), shade(hex_rgba(col), 0.9), shade(hex_rgba(col), 0.78))
    return c


def build_stone_table() -> IsoCanvas:
    """Classic Singapore circular void-deck stone Xiangqi chess table + 4 stools."""
    c = IsoCanvas(44, 34, 22, 22)
    st_top = hex_rgba("#d4cec4")
    st_side = hex_rgba("#a69f95")
    # 4 round stools
    for u, v in ((-0.36, 0.0), (0.36, 0.0), (0.0, -0.36), (0.0, 0.36)):
        c.disc(u, v, 2, 4, 2, st_side)
        c.disc(u, v, 5, 4, 2, st_top)
    # Central pedestal + wide circular tabletop
    c.box(-0.14, 0.14, -0.14, 0.14, 0, 8, st_side, st_side, shade(st_side, 0.85))
    c.disc(0, 0, 8, 10, 5, st_side)
    c.disc(0, 0, 10, 10, 5, st_top)
    # Xiangqi board lines
    c.line((-0.18, -0.18, 10), (0.18, -0.18, 10), hex_rgba("#8c4438"))
    c.line((-0.18, 0.18, 10), (0.18, 0.18, 10), hex_rgba("#8c4438"))
    return c


def build_letterboxes() -> IsoCanvas:
    c = IsoCanvas(42, 40, 21, 30)
    c.box(-0.42, 0.42, -0.18, 0.18, 0, 20, hex_rgba("#b9bec4"), hex_rgba("#9da3aa"), hex_rgba("#7f858c"))
    x0, y0 = c.pt(-0.36, 0.19, 17)
    for r in range(3):
        for k in range(4):
            c.draw.rectangle([x0 + k * 4, y0 + r * 4 + k * 2, x0 + k * 4 + 2, y0 + r * 4 + k * 2 + 2], fill=hex_rgba("#585d63"))
    return c


def build_noticeboard() -> IsoCanvas:
    c = IsoCanvas(42, 42, 21, 32)
    wood = hex_rgba("#8c5c38")
    wood_d = hex_rgba("#6e4628")
    c.box(-0.36, -0.26, -0.06, 0.06, 0, 20, wood, wood, wood_d)
    c.box(0.26, 0.36, -0.06, 0.06, 0, 20, wood, wood, wood_d)
    c.box(-0.38, 0.38, -0.08, 0.08, 9, 24, wood, wood, wood_d)
    # Corkboard + flyers
    c.poly([(-0.32, 0.09, 11), (0.32, 0.09, 11), (0.32, 0.09, 22), (-0.32, 0.09, 22)], fill=hex_rgba("#c89d6b"), outline=INK)
    for fu, fc in ((-0.24, "#f5efe2"), (-0.02, "#f2d16b"), (0.14, "#7cc4b5")):
        c.poly([(fu, 0.10, 14), (fu + 0.14, 0.10, 14), (fu + 0.14, 0.10, 20), (fu, 0.10, 20)], fill=hex_rgba(fc), outline=INK_SOFT)
    return c


def build_recycle_bin() -> IsoCanvas:
    """Authentic Singapore NEA Blue Bloobox recycling bin."""
    c = IsoCanvas(28, 34, 14, 24)
    b1 = hex_rgba("#3880c9")
    b2 = hex_rgba("#2963a3")
    b3 = hex_rgba("#1e4b80")
    c.box(-0.24, 0.24, -0.22, 0.22, 0, 14, b1, b2, b3)
    c.box(-0.26, 0.26, -0.24, 0.24, 14, 18, hex_rgba("#4b97e3"), b1, b2)
    # White & yellow NEA recycling badge + paper/bottle slots
    c.poly([(-0.16, 0.23, 5), (0.16, 0.23, 5), (0.16, 0.23, 12), (-0.16, 0.23, 12)], fill=hex_rgba("#f5f2e6"), outline=INK_SOFT)
    px, py = c.pt(0, 0.24, 9)
    c.draw.rectangle([px - 2, py - 1, px + 2, py + 2], fill=hex_rgba("#4ca662"))
    c.poly([(-0.14, 0.24, 15), (0.14, 0.24, 15), (0.14, 0.24, 17), (-0.14, 0.24, 17)], fill=hex_rgba("#f0c443"))
    return c


def build_cat(calico: bool) -> IsoCanvas:
    c = IsoCanvas(20, 18, 10, 13)
    body = hex_rgba("#e8d9c5") if calico else hex_rgba("#c99d6b")
    patch = hex_rgba("#d97342") if calico else hex_rgba("#7a5c42")
    c.draw.rectangle([7, 9, 12, 13], fill=body, outline=INK)
    c.draw.rectangle([6, 6, 10, 9], fill=body, outline=INK)
    c.pset(6, 5, INK); c.pset(9, 5, INK)
    c.pset(9, 10, patch); c.pset(10, 11, patch)
    c.pset(13, 10, INK); c.pset(14, 9, INK)
    return c


def build_linkway_post() -> IsoCanvas:
    c = IsoCanvas(16, 46, 8, 38)
    c.box(-0.10, 0.10, -0.10, 0.10, 0, 34, hex_rgba("#9da3a8"), hex_rgba("#82888d"), hex_rgba("#676c70"))
    return c


def build_linkway_roof(orient: str) -> IsoCanvas:
    """Elevated corrugated HDB covered linkway canopy (drawn on overhead layer)."""
    c = IsoCanvas(40, 56, 20, 46)
    top = hex_rgba("#9c958b")
    ridge = hex_rgba("#b8b0a5")
    side = hex_rgba("#7a746c")
    if orient == "se":
        c.box(-0.5, 0.5, -0.45, 0.45, 32, 36, top, side, shade(side, 0.85))
        c.box(-0.5, 0.5, -0.18, 0.18, 36, 39, ridge, top, side)
    elif orient == "sw":
        c.box(-0.45, 0.45, -0.5, 0.5, 32, 36, top, side, shade(side, 0.85))
        c.box(-0.18, 0.18, -0.5, 0.5, 36, 39, ridge, top, side)
    else:  # corner
        c.box(-0.48, 0.48, -0.48, 0.48, 32, 37, ridge, top, side)
    return c


def build_railing(orient: str) -> IsoCanvas:
    c = IsoCanvas(36, 28, 18, 20)
    col = hex_rgba("#a8afb5")
    dark = hex_rgba("#757b80")
    if orient == "se":
        for u in (-0.35, 0.0, 0.35):
            c.line((u, 0.0, 0), (u, 0.0, 10), dark)
        c.line((-0.45, 0.0, 10), (0.45, 0.0, 10), INK)
        c.line((-0.45, 0.0, 9), (0.45, 0.0, 9), col)
        c.line((-0.45, 0.0, 5), (0.45, 0.0, 5), col)
    else:
        for v in (-0.35, 0.0, 0.35):
            c.line((0.0, v, 0), (0.0, v, 10), dark)
        c.line((0.0, -0.45, 10), (0.0, 0.45, 10), INK)
        c.line((0.0, -0.45, 9), (0.0, 0.45, 9), col)
        c.line((0.0, -0.45, 5), (0.0, 0.45, 5), col)
    return c


def build_lamp_post() -> IsoCanvas:
    c = IsoCanvas(20, 48, 10, 40)
    c.box(-0.08, 0.08, -0.08, 0.08, 0, 32, hex_rgba("#525861"), hex_rgba("#3d424a"), hex_rgba("#2f333b"))
    c.box(-0.18, 0.18, -0.18, 0.18, 32, 36, hex_rgba("#d8d3c8"), hex_rgba("#f5df96"), hex_rgba("#e0c26b"),
          emissive_faces=(hex_rgba("#fff0a8", 240), hex_rgba("#ffe480", 255), hex_rgba("#ffd260", 255)))
    return c


def build_park_bench() -> IsoCanvas:
    c = IsoCanvas(36, 28, 18, 20)
    wood = hex_rgba("#b57845")
    wood_s = hex_rgba("#8c5a32")
    leg = hex_rgba("#4a4f54")
    c.box(-0.35, 0.35, -0.16, 0.16, 3, 6, wood, wood_s, shade(wood_s, 0.85))
    c.box(-0.35, 0.35, -0.16, -0.06, 6, 12, wood, wood_s, shade(wood_s, 0.85))
    c.line((-0.28, 0.14, 0), (-0.28, 0.14, 3), leg)
    c.line((0.28, 0.14, 0), (0.28, 0.14, 3), leg)
    return c


def build_bike_rack() -> IsoCanvas:
    c = IsoCanvas(42, 30, 21, 22)
    steel = hex_rgba("#8e959c")
    for u in (-0.3, 0.0, 0.3):
        c.line((u, -0.2, 0), (u, -0.2, 7), steel)
        c.line((u, 0.2, 0), (u, 0.2, 7), steel)
        c.line((u, -0.2, 7), (u, 0.2, 7), steel)
    # Two parked pixel bicycles
    for u, col in ((-0.15, "#d95248"), (0.18, "#4ba66a")):
        c.disc(u, -0.15, 3, 3, 2, hex_rgba("#2f3338"))
        c.disc(u, 0.18, 3, 3, 2, hex_rgba("#2f3338"))
        c.line((u, -0.15, 4), (u, 0.18, 7), hex_rgba(col))
    return c


def build_planter_box() -> IsoCanvas:
    c = IsoCanvas(36, 28, 18, 20)
    c.box(-0.38, 0.38, -0.28, 0.28, 0, 7, hex_rgba("#75573c"), hex_rgba("#b5a793"), hex_rgba("#998c7a"))
    for u, v, rad in ((-0.18, 0.0, 5), (0.14, -0.05, 5), (0.0, 0.08, 4)):
        c.disc(u, v, 9, rad, rad - 1, hex_rgba("#52803a"))
        c.disc(u, v, 11, rad - 1, rad - 2, hex_rgba("#78a84a"))
    # Bougainvillea blossoms
    for u, v in ((-0.15, 0.02), (0.12, -0.02)):
        cx, cy = c.pt(u, v, 11)
        c.pset(cx, cy, hex_rgba("#e66ea0"))
        c.pset(cx + 2, cy - 1, hex_rgba("#f595bd"))
    return c


def build_bollard() -> IsoCanvas:
    c = IsoCanvas(16, 24, 8, 17)
    c.box(-0.10, 0.10, -0.10, 0.10, 0, 9, hex_rgba("#c8ced4"), hex_rgba("#9aa1a8"), hex_rgba("#7a8187"))
    return c


def build_bus_shelter() -> IsoCanvas:
    """99% faithful Singapore LTA sheltered bus stop (2x1 footprint)."""
    c = IsoCanvas(86, 68, 36, 54)
    steel = hex_rgba("#7a828a")
    steel_d = hex_rgba("#575e66")
    roof_top = hex_rgba("#46855c")
    roof_rim = hex_rgba("#c8cfd4")
    roof_s = hex_rgba("#326142")
    # Back glass & illuminated route timetable panel
    c.box(-0.42, 1.38, -0.36, -0.28, 0, 23, steel, hex_rgba("#8fc2d4"), hex_rgba("#6791a1"))
    c.poly([(-0.34, -0.27, 4), (0.16, -0.27, 4), (0.16, -0.27, 20), (-0.34, -0.27, 20)],
           fill=hex_rgba("#f5efe2"), outline=INK, emissive=hex_rgba("#fff2bd", 220))
    # Signature Singapore orange/silver perforated bench inside
    c.box(-0.15, 1.18, -0.20, 0.08, 4, 7, hex_rgba("#e07c3e"), hex_rgba("#b85d28"), hex_rgba("#94491d"))
    c.line((-0.10, 0.08, 0), (-0.10, 0.08, 4), steel_d)
    c.line((1.10, 0.08, 0), (1.10, 0.08, 4), steel_d)
    # Slim front posts
    c.box(-0.42, -0.32, 0.28, 0.38, 0, 23, steel, steel, steel_d)
    c.box(1.28, 1.38, 0.28, 0.38, 0, 23, steel, steel, steel_d)
    # Curved silver-trimmed green LTA canopy roof
    c.box(-0.48, 1.44, -0.44, 0.44, 23, 27, roof_top, roof_rim, shade(roof_rim, 0.85))
    c.box(-0.44, 1.40, -0.34, 0.34, 27, 29, shade(roof_top, 1.12), roof_top, roof_s)
    return c


def build_bus_pole() -> IsoCanvas:
    c = IsoCanvas(18, 36, 9, 28)
    c.box(-0.07, 0.07, -0.07, 0.07, 0, 20, hex_rgba("#8c949c"), hex_rgba("#717880"), hex_rgba("#595f66"))
    c.box(-0.14, 0.14, -0.09, 0.09, 17, 25, hex_rgba("#e05248"), hex_rgba("#f5efe2"), hex_rgba("#c74238"))
    return c


def build_sg_bus() -> IsoCanvas:
    """Iconic Singapore lush-green SBS-style double/single decker bus (3x1)."""
    c = IsoCanvas(116, 68, 42, 54)
    g_top = hex_rgba("#76c25b")
    g_sw = hex_rgba("#5ca644")
    g_se = hex_rgba("#458231")
    win = hex_rgba("#334454")
    win_em = hex_rgba("#ffdf88", 180)
    # Wheels
    for u in (-0.05, 1.75):
        c.disc(u, 0.42, 3, 4, 3, hex_rgba("#232528"))
    # Main green bus body
    c.box(-0.42, 2.38, -0.38, 0.40, 4, 26, g_top, g_sw, g_se)
    # Side windows + night interior light
    for u in (-0.25, 0.35, 0.95, 1.55):
        c.poly([(u, 0.41, 14), (u + 0.48, 0.41, 14), (u + 0.48, 0.41, 22), (u, 0.41, 22)], fill=win, outline=INK, emissive=win_em)
    # Front windshield + headlights + LED route number
    c.poly([(2.39, -0.30, 12), (2.39, 0.32, 12), (2.39, 0.32, 22), (2.39, -0.30, 22)], fill=win, outline=INK)
    c.poly([(2.39, -0.22, 23), (2.39, 0.22, 23), (2.39, 0.22, 25), (2.39, -0.22, 25)], fill=hex_rgba("#f5b83d"), outline=INK, emissive=hex_rgba("#ffd25e", 240))
    c.poly([(2.39, -0.32, 6), (2.39, -0.14, 6), (2.39, -0.14, 9), (2.39, -0.32, 9)], fill=hex_rgba("#fff2b2"), outline=INK, emissive=hex_rgba("#fff7c2", 255))
    c.poly([(2.39, 0.14, 6), (2.39, 0.32, 6), (2.39, 0.32, 9), (2.39, 0.14, 9)], fill=hex_rgba("#fff2b2"), outline=INK, emissive=hex_rgba("#fff7c2", 255))
    # Roof AC unit
    c.box(0.2, 1.4, -0.22, 0.22, 26, 29, hex_rgba("#e5e2d8"), hex_rgba("#c9c4b8"), hex_rgba("#aba598"))
    return c


def build_sg_taxi() -> IsoCanvas:
    """Iconic Singapore ComfortDelGro royal-blue sedan taxi (2x1)."""
    c = IsoCanvas(68, 46, 28, 34)
    blue_t = hex_rgba("#2774c4")
    blue_l = hex_rgba("#1f5fa8")
    blue_r = hex_rgba("#164680")
    c.disc(-0.18, 0.36, 2, 3, 2, hex_rgba("#232528"))
    c.disc(0.88, 0.36, 2, 3, 2, hex_rgba("#232528"))
    c.box(-0.40, 1.18, -0.32, 0.32, 3, 10, blue_t, blue_l, blue_r)
    # Cabin + tinted glass
    c.box(-0.14, 0.82, -0.26, 0.26, 10, 16, blue_t, hex_rgba("#38495c"), hex_rgba("#2a3747"))
    # Front headlights + rear red lights
    c.poly([(1.19, -0.28, 5), (1.19, -0.10, 5), (1.19, -0.10, 8), (1.19, -0.28, 8)],
           fill=hex_rgba("#fff2b2"), outline=INK, emissive=hex_rgba("#fff7c2", 255))
    c.poly([(1.19, 0.10, 5), (1.19, 0.28, 5), (1.19, 0.28, 8), (1.19, 0.10, 8)],
           fill=hex_rgba("#fff2b2"), outline=INK, emissive=hex_rgba("#fff7c2", 255))
    # Yellow TAXI roof sign
    c.box(0.22, 0.50, -0.14, 0.14, 16, 19, hex_rgba("#ffe05c"), hex_rgba("#f0be35"), hex_rgba("#d19e24"),
          emissive_faces=(hex_rgba("#ffeb85", 245), hex_rgba("#ffeb85", 245), hex_rgba("#ffd25e", 225)))
    return c


def build_traffic_light() -> IsoCanvas:
    c = IsoCanvas(20, 44, 10, 36)
    c.box(-0.08, 0.08, -0.08, 0.08, 0, 26, hex_rgba("#525861"), hex_rgba("#3e434a"), hex_rgba("#2e3238"))
    c.box(-0.14, 0.14, -0.12, 0.12, 16, 25, hex_rgba("#383c42"), hex_rgba("#282b30"), hex_rgba("#1f2226"))
    px, py = c.pt(0, 0.13, 22)
    c.pset(px, py, hex_rgba("#eb4d42"), hex_rgba("#ff5c52", 255))
    c.pset(px, py + 3, hex_rgba("#4cd97b"), hex_rgba("#62ff95", 255))
    return c


def build_mama_shop() -> IsoCanvas:
    """Cosy roadside Mama Shop kiosk (2x1)."""
    c = IsoCanvas(86, 68, 36, 56)
    c.box(-0.4, 1.4, -0.4, 0.4, 0, 30, hex_rgba("#a89b88"), hex_rgba("#e6d5b8"), hex_rgba("#c4b193"))
    # Striped red/cream awning
    c.box(-0.44, 1.44, 0.34, 0.56, 20, 25, hex_rgba("#d95345"), hex_rgba("#b83e32"), hex_rgba("#993127"))
    # Orange sign
    c.box(-0.36, 1.36, 0.38, 0.46, 26, 33, hex_rgba("#f5a942"), hex_rgba("#e08f2b"), hex_rgba("#ba721e"),
          emissive_faces=(None, hex_rgba("#ffc461", 210), None))
    draw_tiny_text(c, -0.18, 0.47, 31, "MAMA", hex_rgba("#fff5dc"), em=hex_rgba("#fff7e0", 230))
    # Display goods rack
    c.box(-0.30, 1.10, 0.40, 0.54, 0, 9, hex_rgba("#d97848"), hex_rgba("#b85d32"), hex_rgba("#994a26"))
    return c


def build_dragon_playground() -> IsoCanvas:
    """Iconic Singapore Emerald Dragon Playground (3x2 footprint) in red/orange/gold mosaic."""
    c = IsoCanvas(132, 98, 56, 70)
    red_t = hex_rgba("#e6583e")
    red_l = hex_rgba("#c4412b")
    red_r = hex_rgba("#9e301e")
    gold = hex_rgba("#f2b644")
    cream = hex_rgba("#f2e4cc")
    steel = hex_rgba("#b8c2c9")

    # Undulating dragon tail & body segments along u = -0.25 .. 1.65
    for seg_u, seg_z, seg_h in ((-0.15, 0, 16), (0.55, 3, 18), (1.25, 0, 17)):
        c.box(seg_u - 0.28, seg_u + 0.36, -0.26, 0.28, seg_z, seg_z + seg_h, red_t, red_l, red_r)
        # Yellow dorsal spikes
        c.box(seg_u - 0.06, seg_u + 0.16, -0.09, 0.09, seg_z + seg_h, seg_z + seg_h + 5, gold, shade(gold, 0.9), shade(gold, 0.78))

    # Steel climbing hoops connecting body
    for u_r in (0.28, 0.96):
        c.disc(u_r, 0.0, 13, 8, 8, None, outline=steel)

    # Dragon head at front-right (u = 1.6..2.38, v = -0.32..0.38)
    c.box(1.58, 2.35, -0.32, 0.38, 4, 28, red_t, red_l, red_r)
    # Horns & snout
    c.box(1.75, 1.94, -0.24, -0.06, 28, 36, gold, shade(gold, 0.9), shade(gold, 0.75))
    c.box(1.75, 1.94, 0.12, 0.30, 28, 36, gold, shade(gold, 0.9), shade(gold, 0.75))
    # White teeth & cute bright eyes
    c.poly([(2.36, -0.20, 7), (2.36, 0.26, 7), (2.36, 0.26, 14), (2.36, -0.20, 14)], fill=hex_rgba("#38211b"), outline=INK)
    for tv in (-0.14, 0.0, 0.14):
        c.line((2.37, tv, 11), (2.37, tv, 14), cream)
    ex, ey = c.pt(2.05, 0.39, 22)
    c.draw.rectangle([ex - 2, ey - 2, ex + 1, ey + 1], fill=cream, outline=INK)
    c.pset(ex, ey, INK)

    # Steel slide emerging into sandpit (v = 0.35..1.18)
    c.poly([(1.92, 0.35, 12), (2.26, 0.35, 12), (2.26, 1.18, 0), (1.92, 1.18, 0)], fill=steel, outline=INK)
    return c


def build_climbing_frame() -> IsoCanvas:
    c = IsoCanvas(48, 42, 24, 32)
    bar = hex_rgba("#d97e4a")
    c.box(-0.35, 0.35, -0.3, 0.3, 0, 14, TRANSPARENT, TRANSPARENT, TRANSPARENT, outline=TRANSPARENT)
    for u in (-0.32, 0.32):
        for v in (-0.28, 0.28):
            c.line((u, v, 0), (u, v, 16), INK)
            c.line((u, v, 1), (u, v, 15), bar)
    for z in (6, 11, 16):
        c.line((-0.32, -0.28, z), (0.32, -0.28, z), bar)
        c.line((-0.32, 0.28, z), (0.32, 0.28, z), bar)
        c.line((-0.32, -0.28, z), (-0.32, 0.28, z), bar)
        c.line((0.32, -0.28, z), (0.32, 0.28, z), bar)
    return c


def build_fitness_station() -> IsoCanvas:
    c = IsoCanvas(36, 36, 18, 27)
    g = hex_rgba("#4fa364")
    y = hex_rgba("#e8b848")
    c.box(-0.18, 0.18, -0.18, 0.18, 0, 3, hex_rgba("#7a8085"), hex_rgba("#63686e"), hex_rgba("#4e5358"))
    c.line((0, 0, 3), (0, 0, 20), g)
    c.line((-0.24, 0, 14), (0.24, 0, 14), y)
    c.disc(-0.26, 0, 10, 3, 2, y)
    c.disc(0.26, 0, 10, 3, 2, y)
    return c


def build_pavilion_base() -> IsoCanvas:
    c = IsoCanvas(76, 54, 38, 40)
    col = hex_rgba("#e5d7bd")
    col_s = hex_rgba("#bfb097")
    for u, v in ((-0.42, -0.42), (1.35, -0.42), (-0.42, 1.35), (1.35, 1.35)):
        c.box(u - 0.12, u + 0.12, v - 0.12, v + 0.12, 0, 22, col, col_s, shade(col_s, 0.85))
    # Central stone table + seats
    c.disc(0.45, 0.45, 7, 8, 4, hex_rgba("#cbc3b6"))
    c.disc(0.45, 0.45, 9, 8, 4, hex_rgba("#ddd6cb"))
    return c


def build_pavilion_roof() -> IsoCanvas:
    """Pitched terracotta roof for the 2x2 Community Pavilion (overhead layer)."""
    c = IsoCanvas(92, 68, 46, 52)
    r_l = hex_rgba("#b05a3e")
    r_r = hex_rgba("#8c432b")
    r_t = hex_rgba("#c96d4f")
    # Stepped pyramidal hip roof
    c.box(-0.55, 1.48, -0.55, 1.48, 21, 26, r_t, r_l, r_r)
    c.box(-0.22, 1.15, -0.22, 1.15, 26, 31, r_t, r_l, r_r)
    c.box(0.15, 0.78, 0.15, 0.78, 31, 35, hex_rgba("#e08665"), r_t, r_l)
    return c


def build_basketball_hoop() -> IsoCanvas:
    c = IsoCanvas(32, 48, 16, 38)
    c.box(-0.07, 0.07, -0.07, 0.07, 0, 24, hex_rgba("#7a828a"), hex_rgba("#626970"), hex_rgba("#4e545a"))
    c.box(-0.26, 0.26, 0.06, 0.14, 21, 33, hex_rgba("#f5f2ea"), hex_rgba("#e3ded2"), hex_rgba("#c9c3b6"))
    c.disc(0, 0.26, 22, 4, 2, TRANSPARENT, outline=hex_rgba("#e04a38"))
    return c


def build_rain_tree() -> IsoCanvas:
    """Lush wide Singapore rain tree (1x1 trunk, wide canopy)."""
    c = IsoCanvas(80, 82, 40, 68)
    trunk = hex_rgba("#7a5034")
    trunk_d = hex_rgba("#593923")
    c.box(-0.14, 0.14, -0.14, 0.14, 0, 18, trunk, trunk, trunk_d)
    # Roots
    c.line((-0.14, 0.14, 2), (-0.30, 0.26, 0), trunk_d)
    c.line((0.14, 0.14, 2), (0.30, 0.26, 0), trunk_d)
    # Layered leafy clouds
    blobs = [
        (-0.55, -0.15, 22, 14, 9, "#4d7830"),
        (0.55, -0.15, 22, 14, 9, "#4d7830"),
        (0.0, 0.35, 24, 15, 9, "#5d8c3a"),
        (-0.35, 0.05, 30, 15, 10, "#6fa146"),
        (0.35, 0.05, 30, 15, 10, "#6fa146"),
        (0.0, -0.10, 36, 17, 11, "#86b856"),
        (0.0, -0.08, 41, 12, 8, "#9ecf68"),
    ]
    for u, v, z, rx, ry, col in blobs:
        c.disc(u, v, z, rx, ry, hex_rgba(col), outline=INK)
    return c


def build_palm_tree() -> IsoCanvas:
    c = IsoCanvas(68, 84, 34, 70)
    t1, t2 = hex_rgba("#8f6b4c"), hex_rgba("#6e4f36")
    for seg in range(6):
        off = math.sin(seg * 0.4) * 0.05
        c.box(-0.09 + off, 0.09 + off, -0.09, 0.09, seg * 7, seg * 7 + 7, t1, t1, t2)
    fronds = [
        (-0.68, -0.15, 42, 14, 5, "#4d8033"),
        (0.68, -0.15, 42, 14, 5, "#4d8033"),
        (-0.35, 0.45, 40, 12, 6, "#5e963e"),
        (0.35, 0.45, 40, 12, 6, "#5e963e"),
        (0.0, -0.60, 45, 11, 6, "#70aa4b"),
        (0.0, 0.62, 40, 11, 6, "#7eb856"),
        (0.0, 0.0, 47, 10, 6, "#96cf68"),
    ]
    for u, v, z, rx, ry, col in fronds:
        c.disc(u, v, z, rx, ry, hex_rgba(col), outline=INK)
    return c


def build_potted_plant() -> IsoCanvas:
    c = IsoCanvas(24, 30, 12, 22)
    c.box(-0.18, 0.18, -0.18, 0.18, 0, 7, hex_rgba("#b56241"), hex_rgba("#9c5033"), hex_rgba("#7d3e26"))
    c.disc(0, 0, 10, 6, 4, hex_rgba("#5d8f3c"))
    c.disc(0, 0, 13, 5, 3, hex_rgba("#7fb354"))
    return c


def build_hawker_stall(variant: str) -> IsoCanvas:
    """Authentic Singapore hawker stall (2x1) with bright signboard, urns/tins & counter."""
    c = IsoCanvas(90, 74, 38, 60)
    colors = {
        "chicken": ("#d9483b", "#f7d463", "CHICKEN"),
        "caifan": ("#e8b838", "#b8362c", "CAIFAN"),
        "noodles": ("#e07b39", "#fff2d1", "NOODLE"),
        "kopi": ("#663b22", "#ffe7b5", "KOPI TEH"),
    }
    bg_hex, fg_hex, text = colors[variant]
    # Base wall + tiled counter
    c.box(-0.42, 1.42, -0.40, 0.35, 0, 36, hex_rgba("#9c958b"), hex_rgba("#e3d8c3"), hex_rgba("#c4b8a1"))
    c.poly([(-0.28, 0.36, 9), (1.28, 0.36, 9), (1.28, 0.36, 25), (-0.28, 0.36, 25)],
           fill=hex_rgba("#453830"), outline=INK, emissive=hex_rgba("#ffe099", 185))
    # Stainless steel food/kopi counter
    c.box(-0.36, 1.36, 0.25, 0.46, 0, 10, hex_rgba("#d8dee3"), hex_rgba("#aeb7bf"), hex_rgba("#8a939c"))
    if variant == "kopi":
        # Stainless kopi urn + stacked condensed milk tins + kopi cups
        c.box(-0.18, 0.14, 0.10, 0.32, 10, 21, hex_rgba("#dce3e8"), hex_rgba("#b8c2c9"), hex_rgba("#939ea6"))
        for tc in (0.40, 0.56, 0.72):
            c.box(tc, tc + 0.12, 0.22, 0.34, 10, 16, hex_rgba("#e8d8b0"), hex_rgba("#d95b4b"), hex_rgba("#b84739"))
    # Bright backlit signboard
    c.box(-0.40, 1.40, 0.32, 0.45, 25, 36, hex_rgba(bg_hex), hex_rgba(bg_hex), shade(hex_rgba(bg_hex), 0.85),
          emissive_faces=(None, hex_rgba(bg_hex, 235), None))
    draw_tiny_text(c, -0.32 if variant == "kopi" else -0.24, 0.46, 33, text, hex_rgba(fg_hex), em=hex_rgba("#fff8d6", 240))
    return c


def build_hawker_table() -> IsoCanvas:
    """Round Singapore Formica hawker table with 4 bolted stools, plates & chope tissue."""
    c = IsoCanvas(46, 34, 23, 22)
    top = hex_rgba("#f5efe2")
    stool = hex_rgba("#5ea892")
    for u, v in ((-0.36, 0), (0.36, 0), (0, -0.36), (0, 0.36)):
        c.disc(u, v, 4, 3, 2, stool)
    c.disc(0, 0, 8, 10, 5, hex_rgba("#b8b2a6"))
    c.disc(0, 0, 9, 10, 5, top)
    # Chicken rice plate, kopi cup & white/blue chope tissue pack
    c.disc(-0.14, 0.05, 10, 2, 1, hex_rgba("#d95b4b"), outline=INK_SOFT)
    c.disc(0.14, -0.06, 10, 1, 1, hex_rgba("#6e4429"), outline=INK_SOFT)
    c.box(0.02, 0.14, 0.08, 0.18, 9, 11, hex_rgba("#ffffff"), hex_rgba("#4c82bd"), hex_rgba("#386599"))
    return c


def build_tray_return() -> IsoCanvas:
    """Authentic Singapore NEA green-and-steel Tray Return Station rack."""
    c = IsoCanvas(42, 40, 21, 28)
    steel = hex_rgba("#b8c0c7")
    c.box(-0.34, 0.34, -0.22, 0.22, 0, 22, steel, hex_rgba("#8e969c"), hex_rgba("#71787e"))
    # Stacked trays inside
    for tz, tc in ((7, "#59a86b"), (10, "#e89242"), (13, "#59a86b")):
        c.box(-0.26, 0.26, -0.14, 0.22, tz, tz + 2, hex_rgba(tc), shade(hex_rgba(tc), 0.9), shade(hex_rgba(tc), 0.78))
    # Green NEA header
    c.box(-0.32, 0.32, 0.14, 0.25, 17, 23, hex_rgba("#4da361"), hex_rgba("#3b854d"), hex_rgba("#2d693c"))
    return c


def build_market_stall(variant: str) -> IsoCanvas:
    """Sunshine Wet Market stall (2x1) with corrugated awning, durians/produce & dial scale."""
    c = IsoCanvas(92, 68, 38, 54)
    c.box(-0.4, 1.4, -0.4, 0.3, 0, 25, hex_rgba("#999084"), hex_rgba("#d1c5b4"), hex_rgba("#b0a493"))
    # Slanted market awning
    awn = hex_rgba("#e06848") if variant == "fruit" else hex_rgba("#438f5e")
    c.box(-0.44, 1.44, -0.20, 0.50, 23, 28, awn, shade(awn, 0.9), shade(awn, 0.78))
    # Tiered display crates + produce
    c.box(-0.34, 1.34, 0.20, 0.48, 0, 9, hex_rgba("#7a583b"), hex_rgba("#5e422b"), hex_rgba("#4a3320"))
    if variant == "fruit":
        # Bananas, thorny durians, watermelons
        c.disc(-0.18, 0.34, 10, 4, 3, hex_rgba("#f5d442"))
        c.disc(0.32, 0.34, 10, 5, 3, hex_rgba("#6c8a38"))
        c.disc(0.88, 0.34, 10, 4, 3, hex_rgba("#4ca652"))
    else:
        # Leafy bok choy, chye sim, red chillies
        c.disc(-0.18, 0.34, 10, 5, 3, hex_rgba("#68b550"))
        c.disc(0.32, 0.34, 10, 4, 3, hex_rgba("#84cf69"))
        c.disc(0.88, 0.34, 10, 4, 3, hex_rgba("#d94c3d"))
    # Hanging dial weighing scale
    c.line((1.15, 0.42, 23), (1.15, 0.42, 16), hex_rgba("#7a8085"))
    c.disc(1.15, 0.42, 15, 3, 3, hex_rgba("#f0ece0"), outline=INK)
    return c


def build_sunhub_atrium() -> IsoCanvas:
    """SUNhub Shopping Centre (3x2): curved rainbow glass facade + colourful SUNhub sign."""
    c = IsoCanvas(154, 134, 62, 102)
    cream = hex_rgba("#ebe3d3")
    cream_l = hex_rgba("#d4cab8")
    cream_r = hex_rgba("#b0a694")
    # Ground floor entrance frame
    c.box(-0.45, 2.45, -0.45, 1.40, 0, 68, hex_rgba("#a8b2ba"), cream_l, cream_r)
    # Sliding glass doors (lit warm inside at night)
    c.poly([(0.40, 1.41, 1), (1.60, 1.41, 1), (1.60, 1.41, 20), (0.40, 1.41, 20)],
           fill=hex_rgba("#527b8c"), outline=INK, emissive=hex_rgba("#ffe79c", 230))
    # Rainbow awning rim
    rainbow = ["#e3564b", "#f0b642", "#68b865", "#4c98c9", "#9b6fc9"]
    for idx, col_h in enumerate(rainbow):
        u0 = -0.40 + idx * 0.56
        c.box(u0, u0 + 0.54, 1.38, 1.50, 22, 26, hex_rgba(col_h), hex_rgba(col_h), shade(hex_rgba(col_h), 0.85),
              emissive_faces=(None, hex_rgba(col_h, 210), None))
    # Curtain glass wall panes
    glass_cols = ["#6ab6c4", "#7bc4b4", "#a898d4", "#78aed9"]
    for idx in range(4):
        u0 = -0.32 + idx * 0.66
        gc = hex_rgba(glass_cols[idx])
        c.poly([(u0, 1.42, 28), (u0 + 0.58, 1.42, 28), (u0 + 0.58, 1.42, 56), (u0, 1.42, 56)],
               fill=gc, outline=INK, emissive=shade(gc, 1.25))
    # Rooftop SUNhub sign
    c.box(-0.20, 2.20, 1.20, 1.46, 58, 70, hex_rgba("#f5efe2"), hex_rgba("#ede4d3"), hex_rgba("#cfc5b4"),
          emissive_faces=(None, hex_rgba("#fff6db", 210), None))
    draw_tiny_text(c, 0.05, 1.48, 66, "SUNhub", hex_rgba("#e04a3d"), em=hex_rgba("#ff6354", 240))
    return c


def build_mall_shop(kind: str) -> IsoCanvas:
    """Adjacent SUNhub shopfront (2x1): Bakery, Pharmacy, Bubble Tea."""
    c = IsoCanvas(90, 86, 36, 68)
    pal = {
        "bakery": ("#8c5838", "#f5d79b", "BAKERY"),
        "pharmacy": ("#3a9470", "#f2faf6", "PHARM"),
        "bubbletea": ("#4a3c36", "#f2b866", "BOBA"),
    }
    bg_h, fg_h, label = pal[kind]
    c.box(-0.42, 1.42, -0.42, 0.40, 0, 48, hex_rgba("#d9ceb8"), hex_rgba("#e8dec8"), hex_rgba("#c7bc9f"))
    c.poly([(-0.22, 0.41, 2), (1.22, 0.41, 2), (1.22, 0.41, 22), (-0.22, 0.41, 22)],
           fill=hex_rgba("#6b8fa3"), outline=INK, emissive=hex_rgba("#ffe599", 210))
    c.box(-0.42, 1.42, 0.36, 0.46, 24, 34, hex_rgba(bg_h), hex_rgba(bg_h), shade(hex_rgba(bg_h), 0.85),
          emissive_faces=(None, hex_rgba(bg_h, 220), None))
    draw_tiny_text(c, -0.22, 0.47, 31, label, hex_rgba(fg_h), em=hex_rgba("#fff9e6", 230))
    if kind == "pharmacy":
        cx, cy = c.pt(1.15, 0.48, 29)
        c.draw.rectangle([cx - 2, cy - 4, cx + 2, cy + 4], fill=hex_rgba("#4cd97b"))
        c.draw.rectangle([cx - 4, cy - 2, cx + 4, cy + 2], fill=hex_rgba("#4cd97b"))
    return c


PROP_BUILDERS: Dict[str, Callable[[], IsoCanvas]] = {
    "hdb_pillar": build_hdb_pillar,
    "hdb_blk260": lambda: build_hdb_facade("260"),
    "hdb_blk261": lambda: build_hdb_facade("261"),
    "hdb_blk262": lambda: build_hdb_facade("262"),
    "minimart_front": build_minimart_front,
    "snack_rack": build_snack_rack,
    "stone_table": build_stone_table,
    "letterboxes": build_letterboxes,
    "noticeboard": build_noticeboard,
    "recycle_bin": build_recycle_bin,
    "cat_tabby": lambda: build_cat(False),
    "cat_calico": lambda: build_cat(True),
    "linkway_post": build_linkway_post,
    "linkway_roof_se": lambda: build_linkway_roof("se"),
    "linkway_roof_sw": lambda: build_linkway_roof("sw"),
    "linkway_roof_corner": lambda: build_linkway_roof("corner"),
    "railing_se": lambda: build_railing("se"),
    "railing_sw": lambda: build_railing("sw"),
    "lamp_post": build_lamp_post,
    "park_bench": build_park_bench,
    "bike_rack": build_bike_rack,
    "planter_box": build_planter_box,
    "bollard": build_bollard,
    "bus_shelter": build_bus_shelter,
    "bus_pole": build_bus_pole,
    "sg_bus": build_sg_bus,
    "sg_taxi": build_sg_taxi,
    "traffic_light": build_traffic_light,
    "mama_shop": build_mama_shop,
    "dragon_playground": build_dragon_playground,
    "climbing_frame": build_climbing_frame,
    "fitness_station": build_fitness_station,
    "pavilion_base": build_pavilion_base,
    "pavilion_roof": build_pavilion_roof,
    "basketball_hoop": build_basketball_hoop,
    "rain_tree": build_rain_tree,
    "palm_tree": build_palm_tree,
    "potted_plant": build_potted_plant,
    "hawker_stall_chicken": lambda: build_hawker_stall("chicken"),
    "hawker_stall_caifan": lambda: build_hawker_stall("caifan"),
    "hawker_stall_noodles": lambda: build_hawker_stall("noodles"),
    "hawker_stall_kopi": lambda: build_hawker_stall("kopi"),
    "hawker_table": build_hawker_table,
    "tray_return": build_tray_return,
    "market_stall_fruit": lambda: build_market_stall("fruit"),
    "market_stall_veg": lambda: build_market_stall("veg"),
    "sunhub_atrium": build_sunhub_atrium,
    "shop_bakery": lambda: build_mall_shop("bakery"),
    "shop_pharmacy": lambda: build_mall_shop("pharmacy"),
    "shop_bubbletea": lambda: build_mall_shop("bubbletea"),
}


def generate_props(manifest: Dict[str, dict]) -> None:
    PROPS_DIR.mkdir(parents=True, exist_ok=True)
    for pid, fn in PROP_BUILDERS.items():
        canvas = fn()
        day_p = PROPS_DIR / f"{pid}-day.png"
        night_p = PROPS_DIR / f"{pid}-night.png"
        canvas.img.save(day_p)
        relight_image(canvas.img, canvas.em).save(night_p)
        manifest["props"][pid] = {
            "day": f"/assets/iso/props/{pid}-day.png",
            "night": f"/assets/iso/props/{pid}-night.png",
            "w": canvas.w,
            "h": canvas.h,
            "ax": canvas.ax,
            "ay": canvas.ay,
        }


def render_contact_sheet(manifest: Dict[str, dict], out_path: Path) -> None:
    """Export a clean contact sheet of all tiles & props for visual inspection."""
    items: List[Tuple[str, Image.Image]] = []
    for tid in manifest["tiles"]:
        items.append((tid, Image.open(ROOT / "public" / manifest["tiles"][tid]["day"].lstrip("/"))))
    for pid in manifest["props"]:
        items.append((pid, Image.open(ROOT / "public" / manifest["props"][pid]["day"].lstrip("/"))))

    cols = 8
    cell_w, cell_h = 170, 150
    rows = math.ceil(len(items) / cols)
    sheet = Image.new("RGBA", (cols * cell_w, rows * cell_h), hex_rgba("#2f2a27"))
    draw = ImageDraw.Draw(sheet)
    for idx, (name, im) in enumerate(items):
        gx = (idx % cols) * cell_w
        gy = (idx // cols) * cell_h
        draw.rectangle([gx + 4, gy + 4, gx + cell_w - 4, gy + cell_h - 4], fill=hex_rgba("#423b36"), outline=hex_rgba("#635952"))
        scale = 1 if im.width > 120 or im.height > 110 else 2
        scaled = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        ix = gx + (cell_w - scaled.width) // 2
        iy = gy + (cell_h - 22 - scaled.height) // 2 + 4
        sheet.paste(scaled, (ix, iy), scaled)
        draw.text((gx + 8, gy + cell_h - 18), name[:22], fill=hex_rgba("#f5efe2"))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", type=str, default="", help="Optional path to export contact sheet PNG")
    args = parser.parse_args()

    manifest: Dict[str, dict] = {"tiles": {}, "props": {}}
    generate_tiles(manifest)
    generate_props(manifest)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Generated {len(manifest['tiles'])} tiles and {len(manifest['props'])} props into {OUT_DIR}")

    if args.preview:
        render_contact_sheet(manifest, Path(args.preview))
        print(f"Saved contact sheet preview to {args.preview}")


if __name__ == "__main__":
    main()
