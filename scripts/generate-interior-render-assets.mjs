import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { interiorRenderPlan } from './lib/interior-render-plan.mjs';
import { sampleFrame, packFrames } from './lib/render-pixels.mjs';

const directory = 'img/generated/interiors';
const canonical = source => source.replace(/^\.\.\//, '').split('?')[0];
const result = { backgrounds: {}, doors: {}, siblings: {} }, active = new Set(), loaded = new Map();
await mkdir(directory, { recursive: true });
async function load(source) {
  const path = canonical(source);
  if (!loaded.has(path)) {
    const { data, info } = await sharp(await readFile(path)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    loaded.set(path, { width: info.width, height: info.height, pixels: data });
  }
  return loaded.get(path);
}
async function save(name, image) {
  const hash = createHash('sha256').update(`${image.width}:${image.height}:lossless-v1:`).update(image.pixels).digest('hex').slice(0, 12);
  const raw = { width: image.width, height: image.height, channels: 4 };
  const webp = await sharp(image.pixels, { raw }).webp({ lossless: true, exact: true, effort: 6 }).toBuffer();
  const png = await sharp(image.pixels, { raw }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  const bytes = webp.length < png.length ? webp : png;
  const source = `${directory}/${name}.${hash}.${bytes === webp ? 'webp' : 'png'}`;
  await writeFile(source, bytes);
  active.add(source);
  return source;
}
const { scenes, siblingFrames } = await interiorRenderPlan();
for (const scene of scenes) {
  if (scene.sourceScale > 1) {
    const sources = scene.backgroundAnimation?.sources ?? [scene.backgroundSource];
    const candidates = [];
    for (const [index, source] of sources.entries()) {
      // A room shorter than the portrait canvas can stretch vertically. Keep
      // its original vertical resolution to avoid a second sampling step.
      const scaleY = scene.height < 768 ? scene.sourceScale : 1;
      const image = sampleFrame(await load(source), [0, 0, scene.width * scene.sourceScale, scene.height * scene.sourceScale], scene.width, scene.height * scaleY);
      const prepared = await save(`${scene.kind}-background-${index}`, image);
      const originalBytes = await readFile(canonical(source));
      const preparedBytes = await readFile(prepared);
      candidates.push({ original: canonical(source), source: prepared, scaleX: 1, scaleY, smaller: preparedBytes.length < originalBytes.length });
    }
    // Every animation pose must use the same coordinate scale.
    for (const candidate of candidates) {
      if (candidates.every(image => image.smaller)) result.backgrounds[candidate.original] = { source: candidate.source, scaleX: candidate.scaleX, scaleY: candidate.scaleY };
      else active.delete(candidate.source);
    }
  }
  if (scene.doorOverlaySource) {
    const original = await load(scene.doorOverlaySource);
    const atlas = packFrames(scene.doors.map(door => sampleFrame(original, [door.sourceX, door.sourceY, door.sourceWidth, door.sourceHeight], door.width, door.height)));
    result.doors[scene.kind] = { source: await save(`${scene.kind}-doors`, atlas), frames: atlas.frames };
  }
}
const manifest = JSON.parse(await readFile('char/manifest.json', 'utf8'));
const original = await load(`char/${manifest.characters.siblings.directory}/${manifest.characters.siblings.files.girlsSprite}`);
// Crop the four poses used indoors. Keep their full source resolution so the
// cave zoom and chase rendering can scale them exactly as before.
const padding = 4;
const siblings = packFrames(siblingFrames.map(([x, y, width, height]) => sampleFrame(original, [x - padding, y - padding, width + padding * 2, height + padding * 2], width + padding * 2, height + padding * 2)));
const frames = siblings.frames.map(([x, y, width, height]) => [x + padding, y + padding, width - padding * 2, height - padding * 2]);
result.siblings = { source: await save('siblings', siblings), idle: frames[0], walk: frames.slice(1) };
const module = `// Generated from room geometry and original artwork. Do not edit.\nexport const INTERIOR_RENDER_ASSETS = ${JSON.stringify(result, null, 2)} as const;\n`;
await mkdir('js/generated/interiors', { recursive: true });
await writeFile('js/generated/interiors/render-assets.generated.ts', module);
for (const file of await readdir(directory)) if (!active.has(`${directory}/${file}`)) await unlink(`${directory}/${file}`);
