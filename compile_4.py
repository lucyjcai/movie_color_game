"""
RUN WITH:
python compile_4.py <folder_name>
"""

from pathlib import Path
from PIL import Image
import numpy as np
import sys
from natsort import natsorted

# ---- Config ----
STRIP_HEIGHT = 575   # height (px) of the final strip image
ASPECT_RATIO = 3.2  # width:height ratio (width = height * 3.2)

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

    # Sort naturally by filename (e.g., 8'59" before 10'50")
    image_paths = natsorted(
        [p for p in input_dir.iterdir() if p.suffix.lower() in VALID_EXTS]
    )
    # print(image_paths)

    if not image_paths:
        raise RuntimeError(f"No images found in {input_dir}")

    colors = []
    total_images = len(image_paths)
    print(f"Processing {total_images} images...")

    for i, p in enumerate(image_paths, 1):
        try:
            colors.append(avg_rgb(p))
            if i % 10 == 0 or i == total_images:
                print(f"  Processed {i}/{total_images} images ({i*100//total_images}%)")
        except Exception as e:
            print(f"Skipping {p.name} (could not read): {e}")

    if not colors:
        raise RuntimeError("No readable images found.")

    # Calculate fixed dimensions based on aspect ratio
    num_frames = len(colors)
    target_width = int(STRIP_HEIGHT * ASPECT_RATIO)
    strip_width = target_width / num_frames  # Can be fractional

    strip = Image.new("RGB", (target_width, STRIP_HEIGHT))

    for i, c in enumerate(colors):
        # Calculate x positions with sub-pixel precision
        x0 = int(i * strip_width)
        x1 = int((i + 1) * strip_width)
        actual_width = x1 - x0

        block = Image.new("RGB", (actual_width, STRIP_HEIGHT), c)
        strip.paste(block, (x0, 0))

    strip.save(output_path)
    print(f"Saved: {output_path}")
    print(f"Frames used: {num_frames}")
    print(f"Resolution: {target_width}x{STRIP_HEIGHT} (aspect ratio 1:{ASPECT_RATIO})")
    print(f"Strip width per frame: {strip_width:.2f}px")


if __name__ == "__main__":
    main()
