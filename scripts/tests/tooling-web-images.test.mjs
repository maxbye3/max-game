import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, unlink, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { writePng } from '../png.mjs';

const directory = await mkdtemp(join(tmpdir(), 'max-web-images-'));
try {
  await mkdir(join(directory, 'scripts'));
  const source = join(directory, 'sprite.png');
  const pixels = Buffer.alloc(256 * 256 * 4);
  for (let i = 0; i < pixels.length; i += 4) pixels.set([190, 85, 120, i % 20 ? 255 : 0], i);
  const writeSource = () => writeFile(source, writePng({ width: 256, height: 256, colorType: 6, pixels }));
  await writeSource();
  await writeFile(join(directory, 'scripts/web-image-sources.json'), JSON.stringify({ 'sprite.png': {} }));
  const manifestPath = join(directory, 'scripts/web-assets.manifest.json');
  const themes = { original: { sourceHash: 'music', output: 'sound.mp3' } };
  await writeFile(manifestPath, JSON.stringify({ images: {}, themes, fonts: {} }));
  const generate = () => execFileSync(process.execPath, [resolve('scripts/generate-web-images.mjs')], { cwd: directory });
  const manifest = async () => JSON.parse(await readFile(manifestPath, 'utf8'));
  generate();
  const first = await manifest();
  const firstOutput = join(directory, first.images['sprite.png'].output);
  assert.ok((await stat(firstOutput)).size < (await stat(source)).size);
  assert.deepEqual(await sharp(firstOutput).ensureAlpha().raw().toBuffer(), pixels, 'lossless copies preserve every pixel, including transparency');
  assert.deepEqual(first.themes, themes, 'image generation preserves other prepared assets');
  await unlink(firstOutput);
  generate();
  assert.ok((await stat(firstOutput)).size, 'a clean checkout regenerates missing browser copies');
  pixels[0] = 20;
  await writeSource();
  generate();
  const updated = await manifest();
  assert.notEqual(updated.images['sprite.png'].output, first.images['sprite.png'].output, 'source edits change the cache URL');
  await assert.rejects(stat(firstOutput), { code: 'ENOENT' }, 'obsolete copies are removed');
} finally {
  await rm(directory, { recursive: true, force: true });
}
