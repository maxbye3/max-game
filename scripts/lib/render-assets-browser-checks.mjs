import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { interiorRenderPlan } from './interior-render-plan.mjs';

export async function checkPreparedRenderAssets(browser, server) {
  const module = await readFile('js/generated/interiors/render-assets.generated.ts', 'utf8');
  const assets = JSON.parse(module.match(/= ([\s\S]+) as const;/)[1]);
  const manifest = JSON.parse(await readFile('scripts/web-assets.manifest.json', 'utf8'));
  const characters = JSON.parse(await readFile('char/manifest.json', 'utf8'));
  const { scenes, siblingFrames } = await interiorRenderPlan();
  const canonical = source => source.replace(/^\.\.\//, '').split('?')[0];
  const original = source => manifest.images[canonical(source)]?.output ?? canonical(source);
  const tasks = [];
  for (const scene of scenes) {
    for (const source of new Set(scene.backgroundAnimation?.sources ?? [scene.backgroundSource])) {
      const prepared = assets.backgrounds[canonical(source)];
      if (!prepared) continue;
      for (const [width, height] of [[scene.width, scene.height], [Math.min(390, scene.width), 768], [480, 480]]) {
        const vw = Math.min(width, scene.width), vh = Math.min(height, scene.height);
        const x = Math.floor((scene.width - vw) / 2), y = scene.height - vh;
        tasks.push({ name: `${scene.kind} background ${width}x${height}`, a: original(source), b: prepared.source, ar: [x * scene.sourceScale, y * scene.sourceScale, vw * scene.sourceScale, vh * scene.sourceScale], br: [x * prepared.scaleX, y * prepared.scaleY, vw * prepared.scaleX, vh * prepared.scaleY], width, height, exact: true });
      }
    }
    const prepared = assets.doors[scene.kind];
    if (prepared) scene.doors.forEach((door, index) => tasks.push({ name: `${scene.kind} door ${index}`, a: original(scene.doorOverlaySource), b: prepared.source, ar: [door.sourceX, door.sourceY, door.sourceWidth, door.sourceHeight], br: prepared.frames[index], width: door.width, height: door.height, exact: false }));
  }
  const siblingSource = `char/${characters.characters.siblings.directory}/${characters.characters.siblings.files.girlsSprite}`;
  siblingFrames.forEach((frame, index) => {
    for (const [width, height] of [[96, 83], [72, 62], [56, 44]]) tasks.push({ name: `cave pose ${index} ${width}x${height}`, a: original(siblingSource), b: assets.siblings.source, ar: frame, br: [assets.siblings.idle, ...assets.siblings.walk][index], width, height, exact: true });
  });
  const page = await browser.newPage();
  try {
    await page.route('**/render-pixel-check', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html></html>' }));
    await page.goto(`${server.url}/render-pixel-check`);
    for (const task of tasks) {
      const difference = await page.evaluate(async task => {
        const load = source => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = '/' + source; });
        const [original, prepared] = await Promise.all([load(task.a), load(task.b)]);
        const canvas = document.createElement('canvas'); canvas.width = task.width; canvas.height = task.height;
        const context = canvas.getContext('2d'); context.imageSmoothingEnabled = false;
        context.drawImage(original, ...task.ar, 0, 0, task.width, task.height);
        const a = context.getImageData(0, 0, task.width, task.height).data;
        context.clearRect(0, 0, task.width, task.height);
        context.drawImage(prepared, ...task.br, 0, 0, task.width, task.height);
        const b = context.getImageData(0, 0, task.width, task.height).data;
        let count = 0, error = 0;
        for (let index = 0; index < a.length; index++) { if (a[index] !== b[index]) count++; error += Math.abs(a[index] - b[index]); }
        return { fraction: count / a.length, meanError: error / a.length };
      }, task);
      if (task.exact) assert.equal(difference.fraction, 0, `${task.name} retains every displayed pixel`);
      // Canvas scaling and alpha rounding can change a few doorway edge channels.
      else assert.ok(difference.fraction < 0.02 && difference.meanError < 0.1, `${task.name} keeps its doorway outline and colours`);
    }
    console.log(`PASS prepared render assets: ${tasks.length} canvas comparisons across room views, doors and cave poses.`);
  } finally { await page.close(); }
}
