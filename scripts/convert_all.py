"""
AthiVerse — Batch Image Converter
===================================
Converts all PNG/JPG images in public/characters/private-pack/ to 512×512 WebP.

Setup:
  1. Put your downloaded images into the correct universe folder, renamed to match the character ID:
       public/characters/private-pack/marvel/spiderman.png
       public/characters/private-pack/dc/batman.jpg
       public/characters/private-pack/demonslayer/zenitsu.png
       ... etc

  2. Run:
       pip install Pillow
       python scripts/convert_all.py

  The script converts every .png / .jpg / .jpeg it finds to .webp (512×512)
  and deletes the original after a successful conversion.
"""

import os
from PIL import Image

BASE = os.path.join("public", "characters", "private-pack")
EXTS = {".png", ".jpg", ".jpeg"}

def convert(src: str):
    out = os.path.splitext(src)[0] + ".webp"
    img = Image.open(src).convert("RGBA")

    size = 512
    img.thumbnail((size, size), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = ((size - img.width) // 2, (size - img.height) // 2)
    canvas.paste(img, offset, img)

    canvas.save(out, "WEBP", quality=85)
    os.remove(src)
    print(f"  ✓  {os.path.relpath(out)}")

def main():
    converted = 0
    for root, _, files in os.walk(BASE):
        for f in files:
            if os.path.splitext(f)[1].lower() in EXTS:
                convert(os.path.join(root, f))
                converted += 1

    if converted == 0:
        print("No images found. Make sure your files are inside:")
        print(f"  {BASE}/<universe>/<character_id>.png")
    else:
        print(f"\nDone! {converted} image(s) converted to 512×512 WebP.")

if __name__ == "__main__":
    main()
