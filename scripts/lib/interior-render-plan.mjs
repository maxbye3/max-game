import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

/** Read the game's actual geometry; asset preparation must not duplicate it. */
export async function interiorRenderPlan() {
  const { outputFiles } = await build({
    stdin: { contents: "export { getInteriorScene } from './js/interiors/interior-scenes.ts'; export { CAVE_SIBLINGS_IDLE_FRAME, CAVE_SIBLINGS_WALK_FRAMES } from './js/interiors/cave-siblings.ts';", resolveDir: process.cwd() },
    bundle: true, format: 'esm', platform: 'node', write: false,
  });
  const definitions = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
  const doors = ['diary-lab-left', 'job-center', 'northwest-portal', 'cinema', 'feedback-center', 'garden-room', 'music-shop', 'gym', 'bookshop', 'artist-studio', 'snow-mansion'];
  const scenes = doors.map(definitions.getInteriorScene);
  return { scenes, rooms: Object.fromEntries(doors.map((door, index) => [door, scenes[index]])), siblingFrames: [definitions.CAVE_SIBLINGS_IDLE_FRAME, ...definitions.CAVE_SIBLINGS_WALK_FRAMES] };
}

export async function interiorRenderInputs() {
  const { scenes } = await interiorRenderPlan();
  const { characters: { siblings } } = JSON.parse(await readFile('char/manifest.json', 'utf8'));
  return ['scripts/lib/interior-render-plan.mjs', 'scripts/lib/render-pixels.mjs', 'js/interiors/interior-scenes.ts', 'js/interiors/cave-siblings.ts', 'char/manifest.json', 'package-lock.json', `char/${siblings.directory}/${siblings.files.girlsSprite}`, ...scenes.flatMap(scene => [scene.backgroundSource, scene.doorOverlaySource, ...(scene.backgroundAnimation?.sources ?? [])].filter(Boolean).map(source => source.replace(/^\.\.\//, '').split('?')[0]))];
}

export async function interiorRenderOutputs() {
  const path = 'js/generated/interiors/render-assets.generated.ts';
  const module = await readFile(path, 'utf8').catch(() => '');
  if (!module) return [path];
  const assets = JSON.parse(module.match(/= ([\s\S]+) as const;/)[1]);
  return [path, ...Object.values(assets.backgrounds).map(asset => asset.source), ...Object.values(assets.doors).map(asset => asset.source), assets.siblings.source];
}
