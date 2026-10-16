// Optional asset preparation; normal builds use the checked-in derivatives.
// Requires cwebp, ImageMagick and ffmpeg. Sources are never changed.
import { readFile, writeFile, mkdir, stat, unlink, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { basename } from 'node:path';

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(`${command}: ${result.error ?? result.stderr}`);
}
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex').slice(0, 12);
await mkdir('img/web', { recursive: true });
await mkdir('audio/powers', { recursive: true });
const existingManifest = JSON.parse(await readFile('scripts/web-assets.manifest.json', 'utf8'));
const characterManifest = JSON.parse(await readFile('char/manifest.json', 'utf8'));
const images = {};
const manifest = { images: {}, themes: {}, fonts: existingManifest.fonts ?? {} };
const prepared = new Set();
const sizes = { 'img/external/music-shop-sign.png': '68x100!', 'char/katie/map-sprite.png': '208x208!' };
for (const path of Object.keys(existingManifest.images ?? {})) {
  if (prepared.has(path) || path.includes('collision')) continue;
  prepared.add(path);
  const bytes = await readFile(path).catch(() => null);
  if (!bytes || bytes.length < 40_000) continue;
  const size = sizes[path];
  const output = `img/web/${basename(path, '.png')}.${hash(Buffer.concat([bytes, Buffer.from(size ?? '')]))}.webp`;
  const input = size ? `${output}.png` : path;
  if (!(await stat(output).catch(() => null))?.size) {
    if (size) run('magick', [path, '-sample', size, input]);
    run('cwebp', ['-quiet', '-lossless', '-z', '9', input, '-o', output]);
    if (size) await unlink(input);
  }
  if ((await stat(output)).size < bytes.length) {
    images[path] = output;
    manifest.images[path] = { sourceHash: hash(bytes), output };
  }
  else await unlink(output);
}
const themes = {};
async function prepareTheme(name, path, duration) {
  if (themes[path]) return;
  const bytes = await readFile(path);
  const output = `audio/powers/${name.toLowerCase()}.${hash(Buffer.concat([bytes, Buffer.from(`:${duration}:96k`)]))}.mp3`;
  if (!(await stat(output).catch(() => null))?.size) run('ffmpeg', ['-y', '-loglevel', 'error', '-i', path, '-t', String(duration), '-vn', '-map_metadata', '-1', '-codec:a', 'libmp3lame', '-b:a', '96k', output]);
  themes[path] = output;
  manifest.themes[path] = { sourceHash: hash(bytes), output };
}
for (const [id, character] of Object.entries(characterManifest.characters)) {
  const path = character.files.theme && `char/${character.directory}/${character.files.theme}`;
  if (path && await stat(path).catch(() => null)) {
    await prepareTheme(id, path, id === 'sam' ? 13 : id === 'niall' ? 20 : 10);
  }
}
const dialogues = await readFile('js/generated/core/dialogue-themes.generated.ts', 'utf8');
for (const [, name, path] of dialogues.matchAll(/^\s+"([^"]+)": "([^"]+)"/gm)) {
  await prepareTheme(`${name.replace(/\W+/g, '-')}-dialogue`, path, name === 'sam' ? 13 : 10);
}
await writeFile('scripts/web-assets.manifest.json', JSON.stringify(manifest, null, 2) + '\n');
run('node', ['scripts/refresh-web-assets.mjs']);
console.log(`Prepared ${Object.keys(images).length} lossless images and ${Object.keys(themes).length} short soundtracks.`);
// This directory contains generated copies only; discard obsolete hashes.
for (const file of await readdir('img/web')) {
  if (!Object.values(images).includes(`img/web/${file}`)) await unlink(`img/web/${file}`);
}
