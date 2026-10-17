import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withGameTest } from './helpers.mjs';
import { entryPoints } from '../lib/entries.mjs';

await withGameTest(async () => {
  const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
  assert.match(packageJson.scripts.watch, /scripts\/bundle\.mjs --watch/);
  assert.match(packageJson.scripts.bundle, /scripts\/bundle\.mjs/);
  for (const entry of ['js/core/main.ts', 'js/interiors/internal.ts', 'js/characters/niall/niall-fight.ts', 'js/core/transform.ts']) {
    assert.ok(entryPoints.includes(entry));
    assert.ok((await readFile(entry)).length > 0);
  }
  assert.equal(packageJson.scripts['watch:bundle'], undefined);
  const lineLimits = {
    'js/interiors/internal.ts': 700,
    'js/core/render.ts': 350,
    'js/overworld/cave-thief.ts': 250,
    'js/characters/niall/niall-fight.ts': 240,
  };
  for (const [file, limit] of Object.entries(lineLimits)) {
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/).filter((line) => line.trim()).length;
    assert.ok(lines < limit, `${file} must stay below ${limit} lines; found ${lines}`);
  }
});
