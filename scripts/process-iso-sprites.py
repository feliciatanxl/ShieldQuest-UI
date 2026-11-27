#!/usr/bin/env python3
"""
Process raw AI-generated isometric Singapore hero sprites (magenta-keyed JPGs)
and the existing PixelLab rain tree into crisp transparent pixel-art sprites
aligned to ShieldQuest's 32x16 native (64x32 canvas) 2:1 isometric grid.

Updates:
  public/assets/iso/props/<id>-day.png
  public/assets/iso/props/<id>-night.png
  public/assets/iso/manifest.json
"""

from __future__ import annotations

import argparse
import json
import math
from collections import deque
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "scripts" / "raw_iso_sprites"
OUT_DIR = ROOT / "public" / "assets" / "iso"
PROPS_DIR = OUT_DIR / "props"
MANIFEST_PATH = OUT_DIR / "manifest.json"
PIXELLAB_TREE = ROOT / "public" / "assets" / "expansion" / "linkway-tree.png"

INK = (35, 26, 22, 255)
TRANSPARENT = (0, 0, 0, 0)

# Target native pixel widths & footprint (footCols, footRows) for anchor calculation.
# Canvas scales everything by ART_SCALE = 2 (so 176 native px = 352 px on screen).
SPRITE_SPECS: Dict[str, dict] = {
    "hdb_blk260": {"file": "hdb_blk260.jpg", "target_w": 176, "fc": 4, "fr": 2, "dy_adj": 2},
    "hdb_blk261": {"file": "hdb_blk261.jpg", "target_w": 152, "fc": 3, "fr": 2, "dy_adj": 2},
    "hdb_blk262": {"file": "hdb_blk262.jpg", "target_w": 152, "fc": 3, "fr": 2, "dy_adj": 2},
    "minimart_front": {"file": "minimart_front.jpg", "target_w": 136, "fc": 3, "fr": 2, "dy_adj": 2},
    "dragon_playground": {"file": "dragon_playground.jpg", "target_w": 172, "fc": 4, "fr": 2, "dy_adj": 3},
    "sg_bus": {"file": "sg_bus.jpg", "target_w": 146, "fc": 4, "fr": 1, "dy_adj": 2},
    "sunhub_atrium": {"file": "sunhub_atrium.jpg", "target_w": 192, "fc": 4, "fr": 2, "dy_adj": 3},
    "hawker_stall_chicken": {"file": "hawker_stall_chicken.jpg", "target_w": 98, "fc": 2, "fr": 2, "dy_adj": 2},
    "hawker_stall_caifan": {"file": "hawker_stall_caifan.jpg", "target_w": 102, "fc": 2, "fr": 2, "dy_adj": 2},
    "hawker_stall_noodles": {"file": "hawker_stall_noodles.jpg", "target_w": 102, "fc": 2, "fr": 2, "dy_adj": 2},
}


def rgb_dist(a: Tuple[int, int, int], b: Tuple[int, int, int]) -> float:
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)


def is_magenta_like(r: int, g: int, b: int, bg_rgb: Tuple[int, int, int], strict: bool = False) -> bool:
    d = rgb_dist((r, g, b), bg_rgb)
    if strict:
        return d < 50 or (r > g + 55 and b > g + 40 and d < 95)
    return d < 72 or (r > g + 46 and b > g + 30 and d < 115)


def sample_corner_bg(img: Image.Image) -> Tuple[int, int, int]:
    w, h = img.size
    px = img.load()
    samples: List[Tuple[int, int, int]] = []
    for cx, cy in ((4, 4), (w - 5, 4), (4, h - 5), (w - 5, h - 5)):
        samples.append(px[cx, cy][:3])
    rs = sorted(s[0] for s in samples)
    gs = sorted(s[1] for s in samples)
    bs = sorted(s[2] for s in samples)
    return (rs[1], gs[1], bs[1])


def chroma_key_magenta(img: Image.Image) -> Image.Image:
    """Remove solid/textured magenta background, void-deck holes, and edge magenta fringe."""
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    bg_rgb = sample_corner_bg(rgba)

    visited = bytearray(w * h)
    q: deque[Tuple[int, int]] = deque()

    def try_push(x: int, y: int) -> None:
        if 0 <= x < w and 0 <= y < h:
            idx = y * w + x
            if not visited[idx]:
                r, g, b, _ = px[x, y]
                if is_magenta_like(r, g, b, bg_rgb, strict=False):
                    visited[idx] = 1
                    q.append((x, y))

    for x in range(w):
        try_push(x, 0)
        try_push(x, h - 1)
    for y in range(h):
        try_push(0, y)
        try_push(w - 1, y)

    while q:
        x, y = q.popleft()
        px[x, y] = TRANSPARENT
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            try_push(nx, ny)

    # Interior gap cleanup (between HDB void-deck columns & dragon playground hoops)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if is_magenta_like(r, g, b, bg_rgb, strict=True):
                px[x, y] = TRANSPARENT

    # 1px boundary magenta despill so zero purple/pink halo remains
    despill: List[Tuple[int, int, Tuple[int, int, int, int]]] = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            adj_trans = any(
                0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
            )
            if adj_trans and (r > g + 28 and b > g + 20):
                if rgb_dist((r, g, b), bg_rgb) < 95:
                    despill.append((x, y, TRANSPARENT))
                else:
                    # Shift toward neutral dark ink outline
                    despill.append((x, y, (max(20, min(r, g + 10)), g, max(20, min(b, g + 10)), a)))
    for x, y, col in despill:
        px[x, y] = col

    bbox = rgba.getbbox()
    return rgba.crop(bbox) if bbox else rgba


def downscale_pixel_crisp(img: Image.Image, target_w: int) -> Image.Image:
    w, h = img.size
    target_h = max(1, int(round(h * (target_w / w))))
    resized = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
    px = resized.load()
    for y in range(target_h):
        for x in range(target_w):
            r, g, b, a = px[x, y]
            if a < 118:
                px[x, y] = TRANSPARENT
            else:
                # Extra safety check against residual pink fringe after LANCZOS
                if r > g + 42 and b > g + 34 and r > 140 and b > 140:
                    px[x, y] = TRANSPARENT
                else:
                    px[x, y] = (r, g, b, 255)
    bbox = resized.getbbox()
    return resized.crop(bbox) if bbox else resized


def relight_sg_night(day_img: Image.Image) -> Image.Image:
    """
    Create cosy Singapore twilight night version:
    darken structural concrete/foliage into cool indigo while letting warm/bright
    signboards, chillers, windows, and LED displays glow cleanly.
    """
    w, h = day_img.size
    src = day_img.load()
    out = Image.new("RGBA", (w, h), TRANSPARENT)
    dst = out.load()
    night_tint = (34, 42, 74)

    for y in range(h):
        for x in range(w):
            r, g, b, a = src[x, y]
            if a == 0:
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            sat = (max(r, g, b) - min(r, g, b)) / max(1, max(r, g, b))
            # Emissive heuristic: bright saturated signboards, warm yellow/orange windows, cyan chillers
            is_glow = (
                (r > 205 and g > 165 and b < 130)  # warm lit yellow/amber
                or (r > 215 and g > 80 and sat > 0.62)  # glowing red/orange sign
                or (b > 205 and g > 195 and r < 165 and sat > 0.25)  # lit chiller cyan
            )
            if is_glow:
                dst[x, y] = (min(255, int(r * 1.05)), min(255, int(g * 1.02)), min(255, int(b * 0.95)), a)
            elif max(r, g, b) < 48:
                dst[x, y] = (20, 17, 26, a)
            else:
                nr = int(r * 0.43 + night_tint[0] * 0.25)
                ng = int(g * 0.45 + night_tint[1] * 0.25)
                nb = int(b * 0.56 + night_tint[2] * 0.30)
                dst[x, y] = (min(255, nr), min(255, ng), min(255, nb), a)
    return out


def compute_anchor(w: int, h: int, fc: int, fr: int, dy_adj: int = 0) -> Tuple[int, int]:
    dx = ((fc - fr) / 2.0) * 16.0
    dy_bot = (fc + fr - 1) * 8.0
    ax = int(round(w / 2.0 - dx))
    ay = int(round(h - 2 - dy_bot + dy_adj))
    return (ax, ay)


def process_all(preview_path: Optional[Path] = None) -> None:
    PROPS_DIR.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    processed_ids: List[str] = []

    for pid, spec in SPRITE_SPECS.items():
        raw_p = RAW_DIR / spec["file"]
        if not raw_p.exists():
            print(f"[WARN] Missing raw sprite: {raw_p}")
            continue
        raw = Image.open(raw_p)
        keyed = chroma_key_magenta(raw)
        day_im = downscale_pixel_crisp(keyed, spec["target_w"])
        night_im = relight_sg_night(day_im)

        day_out = PROPS_DIR / f"{pid}-day.png"
        night_out = PROPS_DIR / f"{pid}-night.png"
        day_im.save(day_out)
        night_im.save(night_out)

        w, h = day_im.size
        ax, ay = compute_anchor(w, h, spec["fc"], spec["fr"], spec.get("dy_adj", 0))
        manifest["props"][pid] = {
            "day": f"/assets/iso/props/{pid}-day.png",
            "night": f"/assets/iso/props/{pid}-night.png",
            "w": w,
            "h": h,
            "ax": ax,
            "ay": ay,
        }
        processed_ids.append(pid)

    # Also integrate the PixelLab lush rain tree (128x128 -> 112px wide crisp native sprite)
    if PIXELLAB_TREE.exists():
        tree_raw = Image.open(PIXELLAB_TREE).convert("RGBA")
        bbox = tree_raw.getbbox()
        if bbox:
            tree_raw = tree_raw.crop(bbox)
        tree_day = downscale_pixel_crisp(tree_raw, 108)
        tree_night = relight_sg_night(tree_day)
        tree_day.save(PROPS_DIR / "rain_tree-day.png")
        tree_night.save(PROPS_DIR / "rain_tree-night.png")
        tw, th = tree_day.size
        manifest["props"]["rain_tree"] = {
            "day": "/assets/iso/props/rain_tree-day.png",
            "night": "/assets/iso/props/rain_tree-night.png",
            "w": tw,
            "h": th,
            "ax": tw // 2,
            "ay": th - 7,
        }
        processed_ids.append("rain_tree")

    # 4-frame spinning wheel animation variants for sg_bus (day + night)
    bus_day_path = PROPS_DIR / "sg_bus-day.png"
    if bus_day_path.exists():
        bus_base = Image.open(bus_day_path).convert("RGBA")
        # Clean slight purple reflection on far-right mirror pixels
        bpx = bus_base.load()
        bw, bh = bus_base.size
        for y in range(bh):
            for x in range(max(0, bw - 14), bw):
                r, g, b, a = bpx[x, y]
                if a > 0 and r > g + 25 and b > g + 25:
                    bpx[x, y] = (46, 48, 56, a)
        bus_base.save(bus_day_path)
        relight_sg_night(bus_base).save(PROPS_DIR / "sg_bus-night.png")

        bus_meta = manifest["props"]["sg_bus"]
        hubs = [(27, 73), (42, 80), (90, 103)]
        spoke_hi = (228, 232, 236, 255)
        spoke_lo = (74, 78, 84, 255)
        for frame in range(4):
            ang = frame * (math.pi / 4.0)
            f_day = bus_base.copy()
            fpx = f_day.load()
            for hx, hy in hubs:
                # 2 perpendicular rotating spokes inside the rim ellipse (rx=2, ry=3 in iso view)
                for s in (0, 1):
                    a = ang + s * (math.pi / 2.0)
                    dx = int(round(math.cos(a) * 2.1))
                    dy = int(round(math.sin(a) * 2.6))
                    for sign, col in ((1, spoke_hi), (-1, spoke_lo)):
                        sx, sy = hx + sign * dx, hy + sign * dy
                        if 0 <= sx < bw and 0 <= sy < bh and fpx[sx, sy][3] > 0:
                            fpx[sx, sy] = col
                if 0 <= hx < bw and 0 <= hy < bh:
                    fpx[hx, hy] = (155, 160, 168, 255)
            f_night = relight_sg_night(f_day)
            fid = f"sg_bus_f{frame}"
            f_day.save(PROPS_DIR / f"{fid}-day.png")
            f_night.save(PROPS_DIR / f"{fid}-night.png")
            manifest["props"][fid] = {
                "day": f"/assets/iso/props/{fid}-day.png",
                "night": f"/assets/iso/props/{fid}-night.png",
                "w": bus_meta["w"],
                "h": bus_meta["h"],
                "ax": bus_meta["ax"],
                "ay": bus_meta["ay"],
            }
            processed_ids.append(fid)

    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"Processed {len(processed_ids)} realistic Singapore sprites: {', '.join(processed_ids)}")

    if preview_path:
        cols = 4
        cell_w, cell_h = 240, 210
        # Show day & night side-by-side per sprite (2 columns of pairs -> 4 cols)
        rows = math.ceil(len(processed_ids) / 2)
        sheet = Image.new("RGBA", (cols * cell_w, rows * cell_h), (58, 62, 70, 255))
        draw = ImageDraw.Draw(sheet)
        for idx, pid in enumerate(processed_ids):
            row = idx // 2
            pair_col = (idx % 2) * 2
            for variant_idx, variant in enumerate(("day", "night")):
                gx = (pair_col + variant_idx) * cell_w
                gy = row * cell_h
                bg = (96, 112, 74, 255) if variant == "day" else (34, 40, 58, 255)
                draw.rectangle([gx + 4, gy + 4, gx + cell_w - 4, gy + cell_h - 4], fill=bg, outline=(28, 24, 22, 255))
                im = Image.open(PROPS_DIR / f"{pid}-{variant}.png")
                scale = 1 if (im.width > 180 or im.height > 160) else 2
                if im.width * scale > cell_w - 16 or im.height * scale > cell_h - 32:
                    scale = 1
                disp = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
                ix = gx + (cell_w - disp.width) // 2
                iy = gy + (cell_h - 22 - disp.height) // 2 + 4
                sheet.paste(disp, (ix, iy), disp)
                draw.text((gx + 10, gy + cell_h - 18), f"{pid} ({variant})", fill=(250, 244, 228, 255))
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(preview_path)
        print(f"Saved realistic sprite inspection sheet to {preview_path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", type=str, default="", help="Optional contact sheet PNG path")
    args = parser.parse_args()
    process_all(Path(args.preview) if args.preview else None)


if __name__ == "__main__":
    main()
