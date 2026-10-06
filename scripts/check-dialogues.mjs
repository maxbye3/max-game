import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const sources = new Set();

for (const name of await readdir(new URL('js/', root))) {
  if (!name.endsWith('-dialogue.ts')) continue;
  const generated = await readFile(new URL(`js/${name}`, root), 'utf8');
  const source = /^\/\/ Generated from (.+)\. Run npm run generate:dialogues after editing it\./.exec(generated)?.[1];
  if (!source) continue;
  assert.match(source, /^chat\/[^/]+\/dialogue\.txt$/, `${name} must use the character's root dialogue file`);
  const text = await readFile(new URL(source, root), 'utf8');
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const array = /export const \w+_DIALOGUE_LINES = (\[[\s\S]*\]) as const;/.exec(generated)?.[1];
  assert.ok(array, `${name} must contain a generated dialogue array`);
  assert.deepEqual(JSON.parse(array), lines, `${name} is out of date; run npm run generate:dialogues`);
  sources.add(source);
}

for (const entry of await readdir(new URL('chat/', root), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const source = `chat/${entry.name}/dialogue.txt`;
  let text;
  try {
    text = await readFile(new URL(source, root), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  if (text.trim()) assert.ok(sources.has(source), `${source} has dialogue but no generated module`);
}

console.log(`All ${sources.size} generated character dialogues match their root chat files.`);
