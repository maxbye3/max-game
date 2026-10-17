import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const directory = await mkdtemp(join(tmpdir(), 'max-dialogue-generation-'));
try {
  await mkdir(join(directory, 'char/nova'), { recursive: true });
  await mkdir(join(directory, 'char/wheldon'), { recursive: true });
  await writeFile(join(directory, 'char/nova/dialogue.txt'), 'First line\n\nSecond line\n');
  await writeFile(join(directory, 'char/wheldon/dialogue.txt'), 'Legacy diary-room dialogue\n');
  const manifest = join(directory, 'char/manifest.json');
  await writeFile(manifest, JSON.stringify({characters:{nova:{directory:'nova',files:{dialogue:'dialogue.txt'}}}}));
  const generate = () => execFileSync(process.execPath, [resolve('scripts/generate-dialogues.mjs')], { cwd: directory, stdio: 'pipe' });
  generate();
  const module = join(directory, 'js/generated/dialogues/nova-dialogue.ts');
  assert.match(await readFile(module, 'utf8'), /export const NOVA_DIALOGUE_LINES/);
  assert.match(await readFile(module, 'utf8'), /"First line",\s*"Second line"/);
  assert.match(await readFile(join(directory, 'js/generated/dialogues/index.ts'), 'utf8'), /'nova': NOVA_DIALOGUE_LINES/);
  await writeFile(join(directory, 'char/nova/dialogue.txt'), 'Changed line\n');
  generate();
  assert.match(await readFile(module, 'utf8'), /Changed line/);
  await writeFile(manifest, '{"characters":{}}');
  generate();
  await assert.rejects(stat(module), {code:'ENOENT'}, 'retired characters leave no stale generated module');
} finally { await rm(directory, {recursive:true,force:true}); }
