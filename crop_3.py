"""
RUN WITH:
python crop_3.py <folder_name>
"""


from pathlib import Path
from PIL import Image
import sys

TOP_CROP = 215
BOTTOM_CROP = 215
VALID_EXTS = {".png", ".jpg", ".jpeg"}


def main():
    if len(sys.argv) != 2:
        print("Usage: python crop_3.py <folder_name>")
        sys.exit(1)

    folder_name = sys.argv[1]
    folder = Path.home() / "Downloads" / folder_name

    if not folder.exists() or not folder.is_dir():
        print(f"Folder not found: {folder}")
        sys.exit(1)

    for img_path in folder.iterdir():
        if img_path.suffix.lower() not in VALID_EXTS:
            continue

        with Image.open(img_path) as img:
            w, h = img.size
            if h <= TOP_CROP + BOTTOM_CROP:
                print(f"Skipping {img_path.name}: image too short")
                continue

            cropped = img.crop((0, TOP_CROP, w, h - BOTTOM_CROP))
            cropped.save(img_path)

            print(f"Cropped {img_path.name}")


if __name__ == "__main__":
    main()
