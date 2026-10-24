import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { generateTask, readCache, writeCache } from './lib/generation-cache.mjs';
import { interiorRenderInputs, interiorRenderOutputs } from './lib/interior-render-plan.mjs';

const cachePath = '.cache/generation.json';
const cache = await readCache(cachePath);
const charFiles = await readdir('char', { recursive: true });
const dialogues = charFiles.filter(path => /^[^/]+\/(dialogue|alex-s-dialogue)\.txt$/.test(path)).map(path => `char/${path}`);
const profiles = charFiles.filter(path => /^(?:[^/]+\/profile|siblings\/(?:maddy|marina))\.(png|jpe?g)$/.test(path)).map(path => `char/${path}`);
const itemDescriptions = charFiles.filter(path => /^[^/]+\/(?:item(?:-[12])?|Item)\.txt$|^niall\/player\/item\.txt$/.test(path)).map(path => `char/${path}`);
const collisionImages = ['diary-lab-collision.png', 'cinema-collisions.png', 'internal-music-house-collision.png', 'internal-music.png', 'internal-gym-collision.png', 'mansion-collision.png', 'bookshop-internal-collision.png', 'garden-collisions.png'].map(path => `img/internal/${path}`);
const collisionModules = ['internal', 'cinema', 'music-house', 'gym', 'mansion', 'bookshop', 'garden'].map(name => `js/generated/interiors/${name}-collision-mask.ts`);
const webFiles = async () => {
  const manifest = JSON.parse(await readFile('scripts/web-assets.manifest.json', 'utf8'));
  return ['css/base.css', 'scripts/web-assets.manifest.json', ...Object.values(manifest).flatMap(group => Object.entries(group).flatMap(([source, asset]) => [source, asset.output]))];
};
const definitions = [
  ['dialogues', [...dialogues, 'char/manifest.json'], async () => (await readdir('js/generated/dialogues').catch(error => { if (error.code === 'ENOENT') return []; throw error; })).map(path => `js/generated/dialogues/${path}`)],
  ['profiles', ['char/manifest.json', ...profiles], ['js/generated/core/profile-images.generated.ts']],
  ['dialogue-themes', ['char/manifest.json'], ['js/generated/core/dialogue-themes.generated.ts']],
  ['item-descriptions', ['char/manifest.json', ...itemDescriptions], ['js/generated/core/item-descriptions.generated.ts']],
  ['internal-collision', [...collisionImages, 'scripts/png.mjs', 'scripts/lib/collision-encoding.mjs'], collisionModules],
  ['interior-render-assets', interiorRenderInputs, interiorRenderOutputs],
  ['cinema-film', async () => ['video/film.mp4', 'scripts/cinema-film.manifest.json', JSON.parse(await readFile('scripts/cinema-film.manifest.json', 'utf8').catch(() => 'null'))?.output].filter(Boolean), ['js/generated/interiors/cinema-film.generated.ts']],
  ['ghost-sprite', ['char/player/ghost_sprite.png'], ['js/generated/core/ghost-sprite.generated.ts']],
  ['seal-sprite', ['char/manifest.json', 'char/player/seal-sprite.png', 'scripts/png.mjs'], ['js/generated/core/seal-sprite.generated.ts', 'img/generated/seal-sprite.png']],
  ['battle-avatars', ['char/niall/avatar.png', 'char/player/avatar.png', 'scripts/png.mjs'], ['img/battle/niall-avatar.png', 'img/battle/max-avatar.png', 'js/generated/characters/niall/battle-sprites.generated.ts']],
  ['web-images', async () => ['scripts/web-image-sources.json', 'package-lock.json', ...Object.keys(JSON.parse(await readFile('scripts/web-image-sources.json', 'utf8')))], async () => ['scripts/web-assets.manifest.json', ...Object.values(JSON.parse(await readFile('scripts/web-assets.manifest.json', 'utf8')).images).map(asset => asset.output)]],
  ['web-assets', webFiles, ['js/generated/core/web-images.generated.ts', 'js/generated/core/power-themes.generated.ts']],
  ['styles', async () => (await readdir('css')).filter(path => path.endsWith('.css')).map(path => `css/${path}`), ['style.css']],
];
const selected = process.argv.slice(2).filter(arg => arg !== '--force');
for (const name of selected) {
  if (!definitions.some(([task]) => task === name)) throw new Error(`Unknown generator: ${name}`);
}
const changed = [];
for (const [name, inputs, outputs] of definitions) {
  if (selected.length && !selected.includes(name)) continue;
  const script = `scripts/${name === 'styles' ? 'build-styles' : name === 'web-assets' ? 'refresh-web-assets' : `generate-${name}`}.mjs`;
  const files = value => typeof value === 'function' ? value() : value;
  const result = await generateTask({
    inputs: async () => [script, 'scripts/generate-source.mjs', 'scripts/lib/generation-cache.mjs', ...await files(inputs)],
    outputs: async () => files(outputs),
    run: () => {
      try { execFileSync(process.execPath, [script], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
      catch (error) {
        process.stderr.write(error.stdout ?? '');
        process.stderr.write(error.stderr ?? '');
        throw error;
      }
    },
  }, cache[name], process.argv.includes('--force'));
  if (result) { cache[name] = result; changed.push(name); }
}
await writeCache(cachePath, cache);
console.log(changed.length ? `Generated: ${changed.join(', ')}.` : 'Generated files are current.');
