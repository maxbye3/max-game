import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';

// An edited source must never keep displaying an older prepared copy.
// Stale copies fall back to the source until preparation is run again.
const manifest = JSON.parse(await readFile('scripts/web-assets.manifest.json', 'utf8'));
for (const [kind, file, variable] of [
  ['images', 'js/web-images.generated.ts', 'WEB_IMAGE_SOURCES'],
  ['themes', 'js/power-themes.generated.ts', 'POWER_THEME_SOURCES'],
]) {
  const sources = {};
  for (const [source, asset] of Object.entries(manifest[kind])) {
    const bytes = await readFile(source).catch(() => null);
    const hash = bytes && createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    if (hash === asset.sourceHash && (await stat(asset.output).catch(() => null))?.size) sources[source] = asset.output;
    else console.warn(`Using original asset ${source}; run npm run prepare:web-assets to prepare its updated copy.`);
  }
  const content = `// Generated from prepared assets. Stale copies fall back to the original source.\nexport const ${variable}: Readonly<Record<string, string>> = ${JSON.stringify(sources, null, 2)};\n`;
  if (content !== await readFile(file, 'utf8').catch(() => '')) await writeFile(file, content);
}
let stylesheet = await readFile('style.css', 'utf8');
for (const [source, asset] of Object.entries(manifest.fonts ?? {})) {
  const bytes = await readFile(source).catch(() => null);
  const hash = bytes && createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const prepared = hash === asset.sourceHash && (await stat(asset.output).catch(() => null))?.size;
  const stem = basename(source, '.ttf').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`src: url\\("fonts/${stem}(?:\\.[a-f0-9]{12})?\\.(?:ttf|woff2)"\\) format\\("(?:truetype|woff2)"\\);`, 'g');
  stylesheet = stylesheet.replace(pattern, `src: url("${prepared ? asset.output : source}") format("${prepared ? 'woff2' : 'truetype'}");`);
  if (!prepared) console.warn(`Using original font ${source}; run npm run prepare:web-assets after editing it.`);
}
if (stylesheet !== await readFile('style.css', 'utf8')) await writeFile('style.css', stylesheet);
