import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateTask, readCache, writeCache } from '../lib/generation-cache.mjs';

const directory = await mkdtemp(join(tmpdir(), 'max-generation-test-'));
try {
  const input = join(directory, 'input'), output = join(directory, 'output');
  await writeFile(input, 'first');
  let runs = 0;
  const task = { inputs: async () => [input], outputs: async () => [output], run: async () => { runs++; await writeFile(output, await readFile(input)); } };
  let cache = await generateTask(task);
  assert.equal(runs, 1);
  assert.equal(await generateTask(task, cache), null, 'unchanged input and output skip generation');
  await writeFile(input, 'second');
  cache = await generateTask(task, cache); assert.equal(runs, 2);
  await writeFile(output, 'corrupted');
  cache = await generateTask(task, cache); assert.equal(runs, 3);
  await unlink(output);
  cache = await generateTask(task, cache); assert.equal(runs, 4, 'a missing output is regenerated');
  assert.equal(await readFile(output, 'utf8'), 'second');
  cache = await generateTask(task, cache, true); assert.equal(runs, 5, '--force bypasses the cache');
  const cachePath = join(directory, 'cache.json');
  await writeCache(cachePath, { task: cache });
  assert.deepEqual(await readCache(cachePath), { task: cache });
  await writeFile(cachePath, 'interrupted JSON');
  assert.deepEqual(await readCache(cachePath), {}, 'a corrupt cache rebuilds safely');
  const missing = join(directory, 'new-input');
  task.inputs = async () => [input, missing];
  cache = await generateTask(task, cache); assert.equal(runs, 6, 'adding an input invalidates the cache');
  await writeFile(missing, 'new');
  cache = await generateTask(task, cache); assert.equal(runs, 7);
  await unlink(missing);
  await generateTask(task, cache); assert.equal(runs, 8, 'deleting an input invalidates the cache');
} finally { await rm(directory, { recursive: true, force: true }); }
