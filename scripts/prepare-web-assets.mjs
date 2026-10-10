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
const images = {};
const manifest = { images: {}, themes: {} };
const prepared = new Set();
const sizes = { 'img/external/music-shop-sign.png': '68x100!', 'chat/katie/map-sprite.png': '208x208!' };
for (const file of ['js/assets.ts', 'js/map-characters.ts', 'js/interior-scenes.ts']) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/['"]((?:\.\.\/)?(?:img|chat|player|map)\/[^'"?]+\.png)(?:\?[^'"]*)?['"]/g)) {
    const path = match[1].replace(/^\.\.\//, '');
    if (prepared.has(path) || path.includes('collision')) continue;
    prepared.add(path);
    const bytes = await readFile(path);
    if (bytes.length < 40_000) continue;
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
const inventory = await readFile('js/inventory.ts', 'utf8');
for (const [, name, path] of inventory.matchAll(/const (\w+)_THEME_SOURCE = '([^']+)'/g)) {
  await prepareTheme(name, path, name === 'SAM' ? 13 : name === 'NIALL' ? 20 : 10);
}
const dialogues = await readFile('js/dialogue-themes.generated.ts', 'utf8');
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
