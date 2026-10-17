import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Include file names and missing files, so additions, deletions and edits invalidate the cache. */
export async function fingerprint(paths) {
  const hash = createHash('sha256');
  for (const path of [...new Set(paths)].sort()) {
    hash.update(`${path}\0`);
    try { hash.update(await readFile(path)); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      hash.update('missing');
    }
    hash.update('\0');
  }
  return hash.digest('hex');
}

export async function readCache(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    return {};
  }
}

export async function writeCache(path, cache) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(cache, null, 2) + '\n');
}

export async function generateTask(task, previous, force = false) {
  const inputs = await task.inputs();
  const outputs = await task.outputs();
  const before = { inputs: await fingerprint(inputs), outputs: await fingerprint(outputs) };
  if (!force && previous?.inputs === before.inputs && previous?.outputs === before.outputs) return null;
  await task.run();
  // A generator may also refresh its input manifest or font references.
  return { inputs: await fingerprint(await task.inputs()), outputs: await fingerprint(await task.outputs()) };
}
