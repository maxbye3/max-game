import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { interiorRenderOutputs } from './lib/interior-render-plan.mjs';
import { legacyProjects } from '../legacy-projects.mjs';

const output = resolve('_site');
await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const path of ['index.html', '404.html', 'legacy-projects.mjs', 'style.css', 'transform.html', 'internal', 'niall-fight', 'dist', 'img', 'audio', 'video', 'fonts', 'char', 'data']) {
  await cp(path, resolve(output, path), { recursive: true });
}

// These static projects share the domain, but keep their own assets and relative URLs.
for (const project of ['stealth-game', 'zen-garden', 'japanese', 'mrMoonhead', 'kindness-website.com']) {
  const source = resolve('.cache/linked-sites', project);
  if (!(await stat(resolve(source, 'index.html'))).isFile()) throw new Error(`Missing linked site: ${project}`);
  await cp(source, resolve(output, project), {
    recursive: true,
    filter: path => !['.git', '.github', 'node_modules', 'CNAME', '.DS_Store'].includes(basename(path)),
  });
}

// Restore the missing icon stylesheet using the fonts already in MrMoonhead's source.
await cp('site-overrides', output, { recursive: true });

// Give each legacy project a successful entry page; 404.html handles its deep links.
for (const project of legacyProjects) {
  const target = `https://maxbye3.github.io/${project}/`;
  await mkdir(resolve(output, project));
  await writeFile(resolve(output, project, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${project}</title><link rel="canonical" href="${target}">
<script type="module" src="/legacy-projects.mjs"></script>
<noscript><meta http-equiv="refresh" content="0;url=${target}"></noscript>
</head><body><p><a href="${target}">Open ${project}</a></p></body></html>\n`);
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
console.log('Packaged game, linked projects, and generated assets in _site.');
