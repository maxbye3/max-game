import { build } from 'esbuild';
import { interiorRenderPlan } from './interior-render-plan.mjs';
import { stat } from 'node:fs/promises';

export async function loadingPreloadPlan() {
  const { outputFiles } = await build({
    stdin: { contents: "export { IMAGE_SOURCES } from './js/core/asset-sources.ts'; export { WEB_IMAGE_SOURCES } from './js/generated/core/web-images.generated.ts'; export { INTERIOR_RENDER_ASSETS } from './js/generated/interiors/render-assets.generated.ts';", resolveDir: process.cwd() },
    bundle: true, format: 'esm', platform: 'node', write: false,
  });
  const model = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
  const canonical = source => source.replace(/^\.\.\//, '').split('?')[0];
  const webSource = source => model.WEB_IMAGE_SOURCES[canonical(source)] ?? source.replace(/^\.\.\//, '');
  const definitions = await interiorRenderPlan();
  const rooms = {};
  for (const [id, scene] of Object.entries(definitions.rooms)) {
    const background = model.INTERIOR_RENDER_ASSETS.backgrounds[canonical(scene.backgroundSource)];
    const source = background?.source ?? webSource(scene.backgroundSource);
    // Measurements show small image hints competing with JS, while large
    // backgrounds benefit from overlapping their download with code startup.
    const bytes = (await stat(canonical(source)).catch(() => ({ size: 0 }))).size;
    rooms[id] = bytes >= 500_000 ? [`../${source}`] : [];
  }
  rooms.default = rooms['diary-lab-left'];
  rooms.cave = rooms['northwest-portal'];
  return { map: ['map', 'road', 'bus'].map(name => webSource(model.IMAGE_SOURCES[name])), rooms };
}

export function loadingPreloadBlock(page, plan) {
  const start = '<!-- game-preloads:start -->', end = '<!-- game-preloads:end -->';
  if (page === 'index.html') return `${start}\n${plan.map.map(source => `    <link rel="preload" as="image" fetchpriority="high" href="${source}">`).join('\n')}\n    ${end}`;
  const rooms = JSON.stringify({ ...Object.fromEntries(Object.entries(plan.rooms).filter(([, sources]) => sources.length)), default: [] }).replace(/</g, '\\u003c');
  return `${start}\n    <script>(()=>{const rooms=${rooms},choice=rooms[new URLSearchParams(location.search).get('door')];for(const href of Array.isArray(choice)?choice:rooms.default){const link=document.createElement('link');link.rel='preload';link.as='image';link.href=href;link.setAttribute('fetchpriority','high');document.head.append(link);}})();</script>\n    ${end}`;
}

export function replaceLoadingPreloads(html, block) {
  if (html.includes('<!-- game-preloads:start -->')) return html.replace(/<!-- game-preloads:start -->[\s\S]*?<!-- game-preloads:end -->/, block);
  return html.replace(/(?=    <link rel="stylesheet")/, `    ${block}\n`);
}
