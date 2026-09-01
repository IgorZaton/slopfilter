#!/usr/bin/env python3
"""Host-side wrapper: find Blender, render one block, assert the three outputs exist.

    python3 sim/run_pipeline.py
    python3 sim/run_pipeline.py --out sim/output --size 512 --samples 16
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "render_block.py"
DEFAULT_OUT = ROOT / "output"


def find_blender() -> Path:
    env = os.environ.get("BLENDER")
    candidates = []
    if env:
        candidates.append(Path(env))
    which = shutil.which("blender")
    if which:
        candidates.append(Path(which))
    home = Path.home()
    candidates.extend(
        [
            home / "bin" / "blender",
            home / "blender" / "blender",
        ]
    )
    for path in candidates:
        if path.is_file() and os.access(path, os.X_OK):
            return path
    sys.exit(
        "Blender not found. Install it and put it on PATH, or set BLENDER=/path/to/blender"
    )


def png_looks_valid(path: Path) -> bool:
    data = path.read_bytes()[:24]
    return data.startswith(b"\x89PNG\r\n\x1a\n") and path.stat().st_size > 200


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the one-block Blender render pipeline")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--size", type=int, default=512)
    parser.add_argument("--samples", type=int, default=16)
    parser.add_argument(
        "--blender",
        type=Path,
        default=None,
        help="Path to the blender binary (overrides PATH / BLENDER)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    blender = args.blender if args.blender else find_blender()
    out = args.out.resolve()
    out.mkdir(parents=True, exist_ok=True)

    cmd = [
        str(blender),
        "--background",
        "--python",
        str(SCRIPT),
        "--",
        "--out",
        str(out),
        "--size",
        str(args.size),
        "--samples",
        str(args.samples),
    ]
    print("running:", " ".join(cmd), flush=True)
    subprocess.run(cmd, check=True)

    required = ["rgb.png", "depth.png", "mask.png", "run.json"]
    missing = [name for name in required if not (out / name).is_file()]
    if missing:
        sys.exit(f"pipeline incomplete, missing: {missing}")

    bad = [name for name in ("rgb.png", "depth.png", "mask.png") if not png_looks_valid(out / name)]
    if bad:
        sys.exit(f"pipeline wrote invalid PNGs: {bad}")

    manifest = json.loads((out / "run.json").read_text())
    print("pipeline ok")
    print(f"  blender {manifest['blender']['version']}  samples={manifest['blender']['samples']}")
    for name in ("rgb.png", "depth.png", "mask.png"):
        print(f"  {out / name}  ({(out / name).stat().st_size} bytes)")


if __name__ == "__main__":
    main()
