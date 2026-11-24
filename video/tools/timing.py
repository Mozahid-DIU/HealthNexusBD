"""Measure narration and clip lengths -> src/timing.json (the scenes are timed from it)."""
import json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def seconds(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return round(float(out), 3)

vo = {p.stem: seconds(p) for p in sorted((ROOT / "public/vo").glob("*.mp3"))}
clips = {p.stem: seconds(p) for p in sorted((ROOT / "public/clips").glob("*.mp4"))}
(ROOT / "src/timing.json").write_text(json.dumps({"vo": vo, "clips": clips}, indent=2) + "\n", encoding="utf-8")
print(vo, clips)
