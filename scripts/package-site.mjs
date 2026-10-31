import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { interiorRenderOutputs } from './lib/interior-render-plan.mjs';

const output = resolve('_site');
await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const path of ['index.html', '404.html', 'style.css', 'transform.html', 'internal', 'niall-fight', 'dist', 'img', 'audio', 'video', 'fonts', 'char', 'data']) {
  await cp(path, resolve(output, path), { recursive: true });
}

// Keep shared game links working after moving from /max-game/ to the domain root.
await mkdir(resolve(output, 'max-game'));
await cp('404.html', resolve(output, 'max-game/index.html'));

// Every optimized file selected by the bundles must be in the deployment too.
for (const name of ['web-images', 'power-themes']) {
  const module = await readFile(`js/generated/core/${name}.generated.ts`, 'utf8');
  const sources = JSON.parse(module.match(/= ([\s\S]*);\s*$/)[1]);
  for (const path of Object.values(sources)) {
    if (!(await stat(resolve(output, path))).isFile()) throw new Error(`Missing published asset: ${path}`);
  }
}
for (const path of ['img/external/overworld.png', 'img/external/road.png', 'img/battle/niall-avatar.png', 'img/battle/max-avatar.png']) {
  if (!(await stat(resolve(output, path))).isFile()) throw new Error(`Missing published asset: ${path}`);
}
for (const path of (await interiorRenderOutputs()).slice(1)) {
  if (!(await stat(resolve(output, path))).isFile()) throw new Error(`Missing published render asset: ${path}`);
}
const cinemaModule = await readFile('js/generated/interiors/cinema-film.generated.ts', 'utf8');
const cinemaSource = JSON.parse(cinemaModule.match(/= ("[^"]+");/)[1]);
if (!(await stat(resolve(output, cinemaSource))).isFile()) throw new Error(`Missing published cinema film: ${cinemaSource}`);
console.log('Packaged game with generated assets in _site.');
