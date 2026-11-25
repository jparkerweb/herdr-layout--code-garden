"""Rebuilds preview.png from the live Code Garden art.

    python tools/preview/build_preview.py [--keep] [--out preview.png]

Needs: Herdr running with the Code Garden layout installed, `herdr-app` on PATH,
Python 3 with Pillow (`pip install pillow`), and a Herdr window big enough for a
1600 x 640 overlay at your zoom (maximize it).

What it does:
  1. Stages two throwaway mods into Herdr's home: garden-showcase (a staged Code
     Garden window with made-up projects) and garden-poster (the sky, title and
     cast). Each gets plant.js / sky.js / scenes.js copied from this repo's mods;
     the poster's scenes.js is drawn at 3x (U = 6).
  2. Switches to the code-garden layout (the showcase draws with its theme).
  3. Opens each as an overlay, screenshots the window (`herdr-app shot`), closes it.
  4. Crops both, pastes the window into the poster's frame and writes preview.png.
  5. Removes the staged mods (unless --keep).
"""
import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

try:
    from PIL import Image, ImageFilter
except ImportError:
    sys.exit("Pillow is missing: pip install pillow")

REPO = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
HOME = Path(os.environ.get("HERDR_APP_HOME") or Path.home() / ".config" / "herdr-app")
POSTER = (1600, 640)        # garden-poster overlay, logical px
SHOWCASE = (1180, 640)      # garden-showcase overlay, logical px
FRAME = (706, 26, 840, 456)  # the dark frame in the poster the window goes into (x, y, w, h)
SOIL = (0x5A, 0x3E, 0x2B)  # the poster's soil: a full-width band near the bottom, used to measure the screen scale


def herdr(*args):
    r = subprocess.run(["herdr-app", *args], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(f"herdr-app {' '.join(args)} failed:\n{r.stdout}{r.stderr}")
    return r.stdout


def stage():
    shared = {
        "plant.js": REPO / "mods/garden-agents/plant.js",
        "sky.js": REPO / "mods/garden-chrome/sky.js",
        "scenes.js": REPO / "mods/garden-chrome/scenes.js",
    }
    for name in ("garden-showcase", "garden-poster"):
        dest = HOME / "mods" / name
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(TOOLS / name, dest)
        for file, src in shared.items():
            text = src.read_text(encoding="utf-8")
            if name == "garden-poster" and file == "scenes.js":
                text, n = re.subn(r"^export const U = [\d.]+;.*$", "export const U = 6;", text, count=1, flags=re.M)
                if n != 1:
                    sys.exit("couldn't find `export const U = ...` in scenes.js")
            (dest / file).write_text(text, encoding="utf-8", newline="\n")
        print(herdr("check", str(dest)).strip().splitlines()[-1])


def unstage():
    for name in ("garden-showcase", "garden-poster"):
        shutil.rmtree(HOME / "mods" / name, ignore_errors=True)


def capture(mod, out):
    herdr("do", "mod.open", "--name", mod)
    time.sleep(1.5)  # let the overlay's first frame land
    herdr("shot", str(out))
    herdr("do", "overlay.close")
    time.sleep(0.5)
    return Image.open(out).convert("RGB")


def scale_of(shot):
    """Device px per logical px: the widest run of the poster's soil colour on any row.
    (The soil spans the poster's full width well clear of its rounded corners.)"""
    w, h = shot.size
    px = shot.load()
    best = 0
    for y in range(h // 2, h):
        run = 0
        for x in range(w):
            if px[x, y] == SOIL:
                run += 1
                if run > best:
                    best = run
            else:
                run = 0
    if best < POSTER[0] * 0.5:
        sys.exit("couldn't find the poster in the screenshot: is the Herdr window big enough for 1600 x 640?")
    return (best + 2) / POSTER[0]  # + Herdr's 1 px overlay border, which covers the soil's first and last pixel


def centred(shot, size, s):
    w, h = round(size[0] * s), round(size[1] * s)
    x0, y0 = (shot.width - w) // 2, (shot.height - h) // 2
    if x0 < 0 or y0 < 0:
        sys.exit(f"the Herdr window is smaller than the {size[0]} x {size[1]} overlay: maximize it or zoom out")
    return shot.crop((x0, y0, x0 + w, y0 + h))


def compose(poster, window, s):
    fx, fy, fw, fh = (round(v * s) for v in FRAME)
    window = window.resize((fw, fh), Image.LANCZOS)
    shadow = Image.new("RGBA", poster.size, (0, 0, 0, 0))
    shadow.paste(Image.new("RGBA", (fw + round(24 * s / 1.2), fh + round(24 * s / 1.2)), (10, 20, 14, 150)), (fx - round(6 * s / 1.2), fy + round(4 * s / 1.2)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    out = Image.alpha_composite(poster.convert("RGBA"), shadow)
    b1, b2 = round(6 * s / 1.2), round(3 * s / 1.2)
    out.paste(Image.new("RGBA", (fw + 2 * b1, fh + 2 * b1), (31, 77, 42, 255)), (fx - b1, fy - b1))
    out.paste(Image.new("RGBA", (fw + 2 * b2, fh + 2 * b2), (143, 207, 106, 255)), (fx - b2, fy - b2))
    out.paste(window, (fx, fy))
    return out.convert("RGB")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--keep", action="store_true", help="leave the staged mods in Herdr's home")
    ap.add_argument("--out", default=str(REPO / "preview.png"))
    args = ap.parse_args()
    if not (HOME / "layouts" / "code-garden.json").exists():
        sys.exit(f"Code Garden isn't installed in {HOME}: run install.sh / install.ps1 first")
    stage()
    try:
        herdr("do", "layout.switch", "--name", "code-garden")
        time.sleep(1)
        with tempfile.TemporaryDirectory() as tmp:
            poster_shot = capture("garden-poster", Path(tmp) / "poster.png")
            s = scale_of(poster_shot)
            poster = centred(poster_shot, POSTER, s)
            window = centred(capture("garden-showcase", Path(tmp) / "showcase.png"), SHOWCASE, s)
        compose(poster, window, s).save(args.out, optimize=True)
        print(f"wrote {args.out} (scale {s:.2f})")
    finally:
        if not args.keep:
            unstage()


if __name__ == "__main__":
    main()
