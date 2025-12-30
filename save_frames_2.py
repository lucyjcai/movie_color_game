"""
RUN WITH:
python save_frames_2.py <new_folder_name>
"""


from pathlib import Path
import shutil
import sys

# -------- CONFIG --------
DOWNLOADS_DIR = Path.home() / "Downloads"
PREFIX = "VS--"
MAX_FILES_TO_CHECK = 200

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}
# ------------------------


def main():
    if len(sys.argv) != 2:
        print("Usage: python save_frames_2.py <new_folder_name>")
        sys.exit(1)

    folder_name = sys.argv[1]

    if not DOWNLOADS_DIR.exists():
        raise FileNotFoundError("Downloads folder not found")

    target_dir = DOWNLOADS_DIR / folder_name
    target_dir.mkdir(exist_ok=True)

    # Get recent files sorted by modification time (newest first)
    recent_files = sorted(
        (p for p in DOWNLOADS_DIR.iterdir() if p.is_file()),
        key=lambda p: p.stat().st_mtime,
        reverse=True
    )[:MAX_FILES_TO_CHECK]

    moved = 0

    for p in recent_files:
        if (
            p.suffix.lower() in IMAGE_EXTS
            and p.name.startswith(PREFIX)
        ):
            dest = target_dir / p.name

            # Avoid overwriting existing files
            if dest.exists():
                print(f"Skipping (already exists): {p.name}")
                continue

            shutil.move(str(p), str(dest))
            moved += 1
            print(f"Moved: {p.name}")

    print(f"\nDone. Moved {moved} file(s) to {target_dir}")


if __name__ == "__main__":
    main()

