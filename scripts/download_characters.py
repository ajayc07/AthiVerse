"""
AthiVerse — Automated Character Image Downloader
================================================
Downloads transparent PNGs for all 41 characters from DuckDuckGo Images,
converts them to 512×512 WebP, and saves them to the correct folders.

Usage:
    pip install Pillow requests
    python scripts/download_characters.py

Output: public/characters/private-pack/<universe>/<id>.webp

Tips:
  - Run from the AthiVerse project root
  - Already-downloaded files are skipped (safe to re-run)
  - If a character fails, it's listed at the end — download that one manually
"""

import os
import io
import re
import time
import random
import requests
from PIL import Image

# ── Output base ───────────────────────────────────────────────────────────────
BASE = os.path.join("public", "characters", "private-pack")

# ── All 41 characters ─────────────────────────────────────────────────────────
CHARACTERS = [
    # (universe_folder, file_id, search_query)
    # MARVEL
    ("marvel", "spiderman",       "Spider-Man full body transparent PNG"),
    ("marvel", "ironman",         "Iron Man full body transparent PNG"),
    ("marvel", "captainamerica",  "Captain America full body transparent PNG"),
    ("marvel", "thor",            "Thor Marvel full body transparent PNG"),
    ("marvel", "wolverine",       "Wolverine X-Men full body transparent PNG"),
    ("marvel", "hulk",            "Hulk Marvel full body transparent PNG"),
    ("marvel", "blackpanther",    "Black Panther Marvel full body transparent PNG"),
    ("marvel", "deadpool",        "Deadpool full body transparent PNG"),
    # DC
    ("dc", "superman",            "Superman DC full body transparent PNG"),
    ("dc", "batman",              "Batman DC full body transparent PNG"),
    ("dc", "flash",               "The Flash DC full body transparent PNG"),
    ("dc", "wonderwoman",         "Wonder Woman DC full body transparent PNG"),
    ("dc", "greenlantern",        "Green Lantern DC full body transparent PNG"),
    ("dc", "aquaman",             "Aquaman DC full body transparent PNG"),
    # NARUTO
    ("naruto", "naruto",          "Naruto Uzumaki full body transparent PNG"),
    ("naruto", "sasuke",          "Sasuke Uchiha full body transparent PNG"),
    ("naruto", "kakashi",         "Kakashi Hatake full body transparent PNG"),
    ("naruto", "minato",          "Minato Namikaze Yellow Flash transparent PNG"),
    # ONE PIECE
    ("onepiece", "luffy",         "Monkey D Luffy full body transparent PNG"),
    ("onepiece", "zoro",          "Roronoa Zoro full body transparent PNG"),
    ("onepiece", "nami",          "Nami One Piece full body transparent PNG"),
    ("onepiece", "usopp",         "Usopp One Piece full body transparent PNG"),
    ("onepiece", "sanji",         "Sanji One Piece full body transparent PNG"),
    ("onepiece", "chopper",       "Tony Tony Chopper full body transparent PNG"),
    ("onepiece", "robin",         "Nico Robin full body transparent PNG"),
    ("onepiece", "franky",        "Franky One Piece full body transparent PNG"),
    ("onepiece", "brook",         "Brook One Piece skeleton full body transparent PNG"),
    ("onepiece", "jinbe",         "Jinbe One Piece full body transparent PNG"),
    # DEMON SLAYER
    ("demonslayer", "tanjiro",    "Tanjiro Kamado full body transparent PNG"),
    ("demonslayer", "nezuko",     "Nezuko Kamado full body transparent PNG"),
    ("demonslayer", "zenitsu",    "Zenitsu Agatsuma full body transparent PNG"),
    ("demonslayer", "inosuke",    "Inosuke Hashibira full body transparent PNG"),
    ("demonslayer", "giyu",       "Giyu Tomioka full body transparent PNG"),
    ("demonslayer", "rengoku",    "Kyojuro Rengoku full body transparent PNG"),
    ("demonslayer", "tengen",     "Tengen Uzui full body transparent PNG"),
    ("demonslayer", "muichiro",   "Muichiro Tokito full body transparent PNG"),
    ("demonslayer", "mitsuri",    "Mitsuri Kanroji full body transparent PNG"),
    ("demonslayer", "shinobu",    "Shinobu Kocho full body transparent PNG"),
    ("demonslayer", "obanai",     "Obanai Iguro full body transparent PNG"),
    ("demonslayer", "gyomei",     "Gyomei Himejima full body transparent PNG"),
    ("demonslayer", "sanemi",     "Sanemi Shinazugawa full body transparent PNG"),
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

# ── DuckDuckGo image search ────────────────────────────────────────────────────

def get_ddg_vqd(query: str, session: requests.Session) -> str:
    """Get the vqd token needed for DDG image search."""
    resp = session.get(
        "https://duckduckgo.com/",
        params={"q": query, "iax": "images", "ia": "images"},
        headers=HEADERS,
        timeout=15,
    )
    match = re.search(r"vqd=['\"]([\d-]+)['\"]", resp.text)
    if not match:
        raise ValueError("Could not extract vqd token")
    return match.group(1)


def search_images(query: str, session: requests.Session, max_results: int = 10):
    """Return a list of image URLs from DuckDuckGo image search."""
    vqd = get_ddg_vqd(query, session)
    resp = session.get(
        "https://duckduckgo.com/i.js",
        params={
            "q": query,
            "vqd": vqd,
            "o": "json",
            "p": "1",
            "s": "0",
            "u": "bing",
            "f": ",,,,,",
            "l": "us-en",
        },
        headers={**HEADERS, "Referer": "https://duckduckgo.com/"},
        timeout=15,
    )
    data = resp.json()
    results = data.get("results", [])
    return [r["image"] for r in results[:max_results] if r.get("image")]


# ── Image download + convert ───────────────────────────────────────────────────

def download_image(url: str, session: requests.Session) -> Image.Image:
    resp = session.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    img = Image.open(io.BytesIO(resp.content))
    return img


def process_image(img: Image.Image, size: int = 512) -> Image.Image:
    """Resize to size×size, keep transparency, add white bg fallback."""
    img = img.convert("RGBA")
    # Resize keeping aspect ratio, then center on a transparent canvas
    img.thumbnail((size, size), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = ((size - img.width) // 2, (size - img.height) // 2)
    canvas.paste(img, offset, img)
    return canvas


def save_webp(img: Image.Image, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "WEBP", quality=85, method=6)


# ── Main loop ─────────────────────────────────────────────────────────────────

def main():
    session = requests.Session()
    failed = []
    skipped = []

    total = len(CHARACTERS)
    for i, (universe, char_id, query) in enumerate(CHARACTERS, 1):
        out_path = os.path.join(BASE, universe, f"{char_id}.webp")

        if os.path.exists(out_path):
            print(f"[{i:02}/{total}] SKIP  {char_id} (already exists)")
            skipped.append(char_id)
            continue

        print(f"[{i:02}/{total}] ⬇  {char_id} — searching...")

        try:
            urls = search_images(query, session)
            if not urls:
                raise ValueError("No image results found")

            downloaded = False
            for url in urls:
                try:
                    img = download_image(url, session)
                    img = process_image(img)
                    save_webp(img, out_path)
                    print(f"           ✓  saved → {out_path}")
                    downloaded = True
                    break
                except Exception as e:
                    # Try next URL
                    continue

            if not downloaded:
                raise ValueError("All URLs failed")

        except Exception as e:
            print(f"           ✗  FAILED: {e}")
            failed.append((char_id, str(e)))

        # Polite delay to avoid rate limiting
        time.sleep(random.uniform(1.5, 3.0))

    # ── Summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print(f"Done! {total - len(failed) - len(skipped)} downloaded, "
          f"{len(skipped)} skipped, {len(failed)} failed.")

    if failed:
        print("\n⚠  These need manual download from cleanpng.com:")
        for char_id, reason in failed:
            print(f"   • {char_id}: {reason}")
        print("\nFor each, search cleanpng.com → download PNG → "
              "run the converter below to convert it:\n")
        print("  python scripts/convert_png.py <input.png> <universe> <id>")


if __name__ == "__main__":
    main()
