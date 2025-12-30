"""
RUN WITH:
python compile_4.py <folder_name>
"""

from pathlib import Path
from PIL import Image
import numpy as np
import sys

# ---- Config ----
STRIP_WIDTH = 10     # width (px) of each vertical color bar
STRIP_HEIGHT = 250   # height (px) of the final strip image

VALID_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}
# ----------------


def avg_rgb(image_path: Path) -> tuple[int, int, int]:
    with Image.open(image_path) as img:
        img = img.convert("RGB")

        arr = np.asarray(img, dtype=np.float32)
        mean = arr.mean(axis=(0, 1))  # (R, G, B)
        return tuple(int(round(x)) for x in mean)


def main():
    if len(sys.argv) != 2:
        print("Usage: python compile_4.py <folder_name>")
        sys.exit(1)

    movie_name = sys.argv[1]

    input_dir = Path.home() / "Downloads" / movie_name
    output_path = input_dir / f"{movie_name}_color_strip.png"

    if not input_dir.exists() or not input_dir.is_dir():
        raise FileNotFoundError(f"Folder not found: {input_dir}")

    # Sorted order: works well for names like frame_0001.png, 0001.png, etc.
    image_paths = sorted(
        p for p in input_dir.iterdir()
        if p.suffix.lower() in VALID_EXTS
    )

    if not image_paths:
        raise RuntimeError(f"No images found in {input_dir}")

    colors = []
    for p in image_paths:
        try:
            colors.append(avg_rgb(p))
        except Exception as e:
            print(f"Skipping {p.name} (could not read): {e}")

    if not colors:
        raise RuntimeError("No readable images found.")

    width = len(colors) * STRIP_WIDTH
    strip = Image.new("RGB", (width, STRIP_HEIGHT))

    for i, c in enumerate(colors):
        x0 = i * STRIP_WIDTH
        block = Image.new("RGB", (STRIP_WIDTH, STRIP_HEIGHT), c)
        strip.paste(block, (x0, 0))

    strip.save(output_path)
    print(f"Saved: {output_path}")
    print(f"Frames used: {len(colors)}")


if __name__ == "__main__":
    main()
