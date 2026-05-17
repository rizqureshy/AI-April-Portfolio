#!/usr/bin/env python3
"""Generate 1024x1024 placeholder avatars for presenters who don't yet have
an AI Art portrait. Initials on a colorful diagonal gradient.

Output: assets/presenters/<slug>.png
"""

import math
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "presenters"
OUT.mkdir(parents=True, exist_ok=True)

SIZE = 1024

# name -> (hex color A, hex color B)
PEOPLE = [
    ("Isabelle Puller",  "#FF7A59", "#D63384"),
    ("Ashley Mims",      "#6FB1FF", "#8B5CF6"),
    ("Elena Cazan",      "#10B981", "#0EA5E9"),
    ("Sol Helou",        "#F59E0B", "#EF4444"),
    ("Jason Sherwood",   "#7DD3FC", "#3B82F6"),
]


def slug(name: str) -> str:
    return name.lower().replace(" ", "-")


def initials(name: str) -> str:
    parts = [p for p in name.split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][0].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def font(size: int, bold: bool = True):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def gradient(a: tuple[int, int, int], b: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (SIZE, SIZE))
    px = img.load()
    for y in range(SIZE):
        for x in range(SIZE):
            t = (x + y) / (2 * SIZE)
            r = int(a[0] * (1 - t) + b[0] * t)
            g = int(a[1] * (1 - t) + b[1] * t)
            b2 = int(a[2] * (1 - t) + b[2] * t)
            px[x, y] = (r, g, b2)
    return img


def soft_dots(canvas: Image.Image) -> None:
    """Sprinkle a few large soft white circles for depth — looks like a portrait lighting bokeh."""
    overlay = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    spots = [
        (180, 220, 320, 90),
        (820, 760, 260, 60),
        (700, 200, 200, 50),
    ]
    for cx, cy, r, alpha in spots:
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255, alpha))
    overlay = overlay.filter(ImageFilter.GaussianBlur(80))
    canvas.paste(overlay, (0, 0), overlay)


def render(name: str, color_a: str, color_b: str) -> Image.Image:
    img = gradient(hex_to_rgb(color_a), hex_to_rgb(color_b)).convert("RGBA")
    soft_dots(img)

    draw = ImageDraw.Draw(img, "RGBA")

    # Big initials, centered slightly above the visual center
    f = font(380, bold=True)
    init = initials(name)
    bw = draw.textlength(init, font=f)
    bbox = draw.textbbox((0, 0), init, font=f)
    bh = bbox[3] - bbox[1]
    x = (SIZE - bw) // 2
    y = (SIZE - bh) // 2 - 110
    # subtle drop shadow
    draw.text((x + 6, y + 8), init, font=f, fill=(0, 0, 0, 110))
    draw.text((x, y), init, font=f, fill=(255, 255, 255, 245))

    # Name banner
    fn = font(56, bold=True)
    nw = draw.textlength(name.upper(), font=fn)
    nx = (SIZE - nw) // 2
    draw.text((nx + 3, SIZE - 175 + 3), name.upper(), font=fn, fill=(0, 0, 0, 110))
    draw.text((nx, SIZE - 175), name.upper(), font=fn, fill=(255, 255, 255, 240))

    # GTM eyebrow
    fe = font(28, bold=True)
    eb = "EQUINIX · GTM ENABLEMENT"
    ew = draw.textlength(eb, font=fe)
    ex = (SIZE - ew) // 2
    draw.text((ex, SIZE - 100), eb, font=fe, fill=(255, 255, 255, 170))

    return img.convert("RGB")


def main():
    for name, a, b in PEOPLE:
        path = OUT / f"{slug(name)}.png"
        render(name, a, b).save(path, "PNG", optimize=True)
        print(f"  ok  {name} -> {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
