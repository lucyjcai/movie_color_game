"""
RUN WITH:
python crop_3.py <folder_name> <num_pixels_to_crop>
"""


from pathlib import Path
from PIL import Image
import sys

VALID_EXTS = {".png", ".jpg", ".jpeg"}


def main():
    if len(sys.argv) != 3:
        print("Usage: python crop_3.py <folder_name> <num_pixels_to_crop>")
        sys.exit(1)

    crop_pixels = int(sys.argv[2])
    if type(crop_pixels) != int:
        print(f"Number of pixels to crop must be an int")
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
            if h <= crop_pixels * 2:
                print(f"Skipping {img_path.name}: image too short")
                continue

            cropped = img.crop((0, crop_pixels, w, h - crop_pixels))
            cropped.save(img_path)

            print(f"Cropped {img_path.name}")


if __name__ == "__main__":
    main()
