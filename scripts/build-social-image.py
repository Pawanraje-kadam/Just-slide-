#!/usr/bin/env python3
"""Render the Open Graph card from the SVG template and the live library count.

Requires: python3 with fonttools, node with @resvg/resvg-js, and TTF copies of the
display fonts under .cache/fonts. Run `npm run social:build` after a library change;
the rendered card is committed at public/og-image.png.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
template = (root / "content" / "og-template.svg").read_text()
library = json.loads((root / "src" / "data" / "library.json").read_text())
count_line = (
    f"{library['counts']['topics']} CURATED TOPICS   ·   "
    f"{library['counts']['categories']} FIELDS   ·   NO ACCOUNT NEEDED"
)
svg = template.replace("__CONTENT__", count_line)
icon = (root / "content" / "icon.svg").read_text()
(root / ".cache" / "icon.svg").write_text(icon)

target = root / ".cache" / "og.svg"
target.parent.mkdir(exist_ok=True)
target.write_text(svg)
fonts = sorted((root / "content" / "fonts").glob("*.ttf"))
if not fonts:
    sys.exit("Missing content/fonts TTFs.")
script = f"""
const {{ Resvg }} = require('@resvg/resvg-js');
const fs = require('fs');
const svg = fs.readFileSync({json.dumps(str(target))}, 'utf8');
const resvg = new Resvg(svg, {{
  fitTo: {{ mode: 'width', value: 1200 }},
  font: {{ loadSystemFonts: false, fontFiles: {json.dumps([str(f) for f in fonts])} }},
}});
fs.writeFileSync({json.dumps(str(root / 'public' / 'og-image.png'))}, resvg.render().asPng());

const iconSvg = fs.readFileSync({json.dumps(str(root / '.cache' / 'icon.svg'))}, 'utf8');
for (const [size, file] of [[180, 'apple-touch-icon.png'], [512, 'icon-512.png']]) {{
  const icon = new Resvg(iconSvg, {{ fitTo: {{ mode: 'width', value: size }} }});
  fs.writeFileSync({json.dumps(str(root / 'public'))} + '/' + file, icon.render().asPng());
}}
"""
subprocess.run(["node", "--input-type=commonjs", "-e", script], check=True, cwd=root)
print(f"Rendered public/og-image.png + app icons ({library['counts']['topics']} topics)")
