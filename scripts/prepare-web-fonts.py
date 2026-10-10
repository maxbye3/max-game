"""Prepare full WOFF2 fonts; never subset glyphs or modify the TTF sources."""
from hashlib import sha256
from pathlib import Path
import re
import json
from fontTools.ttLib import TTFont

stylesheet = Path('style.css')
css = stylesheet.read_text()
manifest_path = Path('scripts/web-assets.manifest.json')
manifest = json.loads(manifest_path.read_text())
manifest['fonts'] = {}
for source in sorted(Path('fonts').glob('*.ttf')):
    output = source.with_name(f'{source.stem}.{sha256(source.read_bytes()).hexdigest()[:12]}.woff2')
    original = TTFont(source, recalcTimestamp=False)
    if not output.exists():
        original.flavor = 'woff2'
        original.save(output)
    compressed = TTFont(output)
    assert compressed.getBestCmap() == original.getBestCmap(), f'Glyphs changed: {source}'
    assert compressed['hmtx'].metrics == original['hmtx'].metrics, f'Layout metrics changed: {source}'
    assert output.stat().st_size < source.stat().st_size
    pattern = rf'src: url\("fonts/{re.escape(source.stem)}(?:\.[a-f0-9]{{12}})?\.(?:ttf|woff2)"\) format\("(?:truetype|woff2)"\);'
    css = re.sub(pattern, f'src: url("{output.as_posix()}") format("woff2");', css)
    manifest['fonts'][source.as_posix()] = {'sourceHash': sha256(source.read_bytes()).hexdigest()[:12], 'output': output.as_posix()}
    print(f'{source.name}: {source.stat().st_size} -> {output.stat().st_size} bytes (all glyphs retained)')
if css != stylesheet.read_text():
    stylesheet.write_text(css)
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
