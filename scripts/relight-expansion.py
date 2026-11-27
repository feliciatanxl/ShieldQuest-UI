"""Relight PixelLab district paintings in place without moving any scene geometry.

Run from the repository root with Pillow installed: python scripts/relight-expansion.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ASSETS = Path(__file__).resolve().parents[1] / "public" / "assets" / "expansion"

# Light pools and lit surfaces, traced in native 640×360 art coordinates.
POOLS = {
    "estate": [(123, 254, 34, 20), (236, 219, 43, 25), (350, 194, 45, 29),
               (431, 209, 62, 30), (555, 273, 42, 27)],
    "market": [(78, 151, 60, 57), (181, 170, 62, 61), (278, 169, 63, 66),
               (478, 194, 61, 65), (568, 218, 58, 52), (322, 292, 35, 24)],
    "transport": [(289, 179, 61, 35), (317, 125, 47, 35), (421, 216, 36, 26),
                  (480, 193, 33, 30), (517, 126, 42, 26)],
    "park": [(138, 243, 49, 36), (389, 192, 47, 40), (424, 258, 57, 36),
             (548, 247, 52, 38), (327, 298, 31, 22), (483, 104, 56, 32)],
    "mall": [(105, 142, 65, 24), (252, 103, 47, 50), (326, 146, 49, 51),
             (390, 185, 41, 47), (527, 223, 76, 55), (533, 49, 98, 34)],
}

SURFACES = {
    "estate": [
        [(61, 6), (87, 15), (87, 50), (61, 37)],
        [(393, 24), (419, 37), (419, 68), (393, 53)],
        [(542, 48), (577, 63), (577, 87), (542, 72)],
        [(150, 108), (172, 119), (172, 143), (150, 156)],
    ],
    "market": [
        [(34, 116), (119, 108), (119, 133), (34, 137)],
        [(136, 112), (192, 108), (192, 132), (136, 137)],
        [(203, 110), (246, 105), (246, 119), (203, 125)],
        [(298, 104), (361, 101), (361, 114), (298, 117)],
    ],
    "transport": [
        [(215, 6), (247, 18), (247, 33), (215, 21)],
        [(400, 3), (430, 12), (430, 29), (401, 19)],
        [(292, 84), (371, 112), (371, 124), (292, 96)],
        [(239, 164), (281, 158), (333, 172), (332, 175), (281, 164), (241, 168)],
    ],
    "park": [
        [(69, 52), (92, 42), (92, 62), (69, 72)],
        [(250, 37), (268, 45), (268, 69), (250, 58)],
        [(536, 34), (563, 45), (563, 62), (536, 50)],
        [(597, 68), (624, 78), (624, 94), (597, 85)],
        [(392, 247), (423, 254), (449, 246), (442, 255), (420, 260), (391, 251)],
    ],
    "mall": [
        [(458, 14), (505, 18), (559, 18), (608, 13), (611, 42), (550, 60), (481, 56), (457, 44)],
        [(227, 71), (272, 91), (273, 138), (228, 114)],
        [(299, 106), (332, 121), (333, 169), (296, 153)],
        [(363, 142), (403, 154), (403, 192), (363, 180)],
        [(494, 189), (570, 189), (570, 218), (493, 217)],
    ],
}


def relight(day_path):
    district = day_path.stem.removesuffix("-day")
    day = Image.open(day_path).convert("RGB")
    red, green, blue = day.split()
    ambient = Image.merge("RGB", (
        red.point(lambda value: round(value * 0.48 + 12)),
        green.point(lambda value: round(value * 0.47 + 14)),
        blue.point(lambda value: round(value * 0.62 + 24)),
    ))
    warm = Image.merge("RGB", (
        red.point(lambda value: min(255, round(value * 1.04 + 33))),
        green.point(lambda value: min(255, round(value * 0.87 + 22))),
        blue.point(lambda value: min(255, round(value * 0.62 + 10))),
    ))
    light = Image.new("L", day.size)
    draw = ImageDraw.Draw(light)
    for x, y, rx, ry in POOLS[district]:
        draw.ellipse((x - rx, y - ry, x + rx, y + ry), fill=138)
        draw.ellipse((x - rx // 2, y - ry // 2, x + rx // 2, y + ry // 2), fill=205)
    pools = light.filter(ImageFilter.GaussianBlur(14)).point(lambda value: value // 8 * 8)
    for polygon in SURFACES[district]:
        ImageDraw.Draw(pools).polygon(polygon, fill=218)
    Image.composite(warm, ambient, pools).save(day_path.with_name(f"{district}-night.png"), optimize=True)


for path in sorted(ASSETS.glob("*-day.png")):
    relight(path)
