import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat, readdir, unlink } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import sharp from 'sharp';

// Build these lossless browser copies on CI too; never depend on a developer's cache.
const sources = JSON.parse(await readFile('scripts/web-image-sources.json', 'utf8'));
const manifest = JSON.parse(await readFile('scripts/web-assets.manifest.json', 'utf8'));
const images = {};
const hash = bytes => createHash('sha256').update(bytes).digest('hex').slice(0, 12);
await mkdir('img/web', { recursive: true });
for (const [source, size] of Object.entries(sources)) {
  if (source.includes('collision')) throw new Error(`Cannot optimize collision guide: ${source}`);
  const bytes = await readFile(source);
  const sourceHash = hash(bytes);
  const outputHash = hash(Buffer.concat([bytes, Buffer.from(JSON.stringify(size))]));
  const output = `img/web/${basename(source, extname(source))}.${outputHash}.webp`;
  if (!(await stat(output).catch(() => null))?.size) {
    const image = sharp(bytes);
    if (size.width) image.resize(size.width, size.height, { fit: 'fill', kernel: 'nearest' });
    await image.webp({ lossless: true, effort: 6, exact: true }).toFile(output);
  }
  if ((await stat(output)).size < bytes.length) images[source] = { sourceHash, output };
  else await unlink(output);
}
manifest.images = images;
await writeFile('scripts/web-assets.manifest.json', JSON.stringify(manifest, null, 2) + '\n');
const active = new Set(Object.values(images).map(asset => basename(asset.output)));
for (const file of await readdir('img/web')) if (!active.has(file)) await unlink(`img/web/${file}`);
