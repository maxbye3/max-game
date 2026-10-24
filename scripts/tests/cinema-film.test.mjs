import assert from 'node:assert/strict';
import { readFile, stat, mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { withGameTest } from './helpers.mjs';

const manifest = JSON.parse(await readFile('scripts/cinema-film.manifest.json', 'utf8'));
const original = await readFile('video/film.mp4');
assert.equal(manifest.sourceHash, createHash('sha256').update(original).digest('hex').slice(0, 12));
assert.ok((await stat(manifest.output)).size < original.length / 2, 'the small canvas projection avoids the full movie download');
await withGameTest(async ({ loadModule }) => {
  const { CINEMA_FILM_SOURCE } = await loadModule('cinema-film', 'js/generated/interiors/cinema-film.generated.ts');
  assert.equal(CINEMA_FILM_SOURCE, manifest.output);
});
const directory = await mkdtemp(join(tmpdir(), 'max-cinema-film-'));
try {
  await mkdir(join(directory, 'scripts')); await mkdir(join(directory, 'video'));
  await writeFile(join(directory, 'video/film.mp4'), 'changed film');
  await writeFile(join(directory, 'scripts/cinema-film.manifest.json'), JSON.stringify(manifest));
  execFileSync(process.execPath, [resolve('scripts/generate-cinema-film.mjs')], { cwd: directory });
  const generated = await readFile(join(directory, 'js/generated/interiors/cinema-film.generated.ts'), 'utf8');
  assert.ok(generated.includes('"video/film.mp4"'), 'an edited film cannot keep showing a stale prepared copy');
} finally { await rm(directory, { recursive: true, force: true }); }
