"""
AthiVerse — Manual PNG → WebP Converter
========================================
Use this for any character the auto-downloader missed.

Usage:
    python scripts/convert_png.py <input_image> <universe> <character_id>

Examples:
    python scripts/convert_png.py ~/Downloads/spiderman.png marvel spiderman
    python scripts/convert_png.py ~/Downloads/zenitsu.jpg demonslayer zenitsu

Supported input formats: PNG, JPG, JPEG, WEBP, BMP, GIF (first frame)
Output: public/characters/private-pack/<universe>/<id>.webp (512×512)
"""

import sys
import os
from PIL import Image

def convert(src: str, universe: str, char_id: str):
    out_dir = os.path.join("public", "characters", "private-pack", universe)
    out_path = os.path.join(out_dir, f"{char_id}.webp")
    os.makedirs(out_dir, exist_ok=True)

    img = Image.open(src).convert("RGBA")

    # Resize keeping aspect ratio, center on transparent canvas
    size = 512
    img.thumbnail((size, size), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = ((size - img.width) // 2, (size - img.height) // 2)
    canvas.paste(img, offset, img)

    canvas.save(out_path, "WEBP", quality=85, method=6)
    print(f"✓ Saved: {out_path}  ({size}×{size} WEBP)")

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python scripts/convert_png.py <input> <universe> <id>")
        print("       universe = marvel | dc | naruto | onepiece | demonslayer")
        sys.exit(1)

    src, universe, char_id = sys.argv[1], sys.argv[2], sys.argv[3]

    valid_universes = {"marvel", "dc", "naruto", "onepiece", "demonslayer"}
    if universe not in valid_universes:
        print(f"✗ Invalid universe '{universe}'. Must be one of: {valid_universes}")
        sys.exit(1)

    if not os.path.exists(src):
        print(f"✗ File not found: {src}")
        sys.exit(1)

    convert(src, universe, char_id)
