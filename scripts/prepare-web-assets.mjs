// Images are built automatically; this additionally prepares short music and fonts.
// Requires ffmpeg. Sources are never changed.
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(`${command}: ${result.error ?? result.stderr}`);
}
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex').slice(0, 12);
run('node', ['scripts/generate-source.mjs', 'seal-sprite', 'battle-avatars', 'web-images']);
await mkdir('audio/powers', { recursive: true });
const existingManifest = JSON.parse(await readFile('scripts/web-assets.manifest.json', 'utf8'));
const characterManifest = JSON.parse(await readFile('char/manifest.json', 'utf8'));
const manifest = { ...existingManifest, themes: {} };
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
console.log(`Prepared ${Object.keys(manifest.images).length} lossless images and ${Object.keys(themes).length} short soundtracks.`);
