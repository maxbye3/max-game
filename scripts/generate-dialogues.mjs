import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('char/manifest.json', 'utf8'));
const characters = Object.entries(manifest.characters)
  .filter(([, character]) => character.files.dialogue)
  .map(([id, character]) => ({ id, source: `char/${character.directory}/${character.files.dialogue}` }));
// Alex S and the diary-room Wheldon have distinct conversations in the same folder.
characters.push({ id: 'wheldon', source: 'char/wheldon/dialogue.txt' });
await mkdir('js/generated/dialogues', { recursive: true });
const expected = new Set(characters.map(({ id }) => `${id}-dialogue.ts`));
for (const name of await readdir('js/generated/dialogues')) {
  if (name.endsWith('-dialogue.ts') && !expected.has(name)) await unlink(`js/generated/dialogues/${name}`);
}
const imports = [], entries = [];
for (const { id, source } of characters) {
  const name = `${id.toUpperCase().replaceAll('-', '_')}_DIALOGUE_LINES`;
  const text = await readFile(source, 'utf8');
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const generated = `// Generated from ${source}. Run npm run generate:dialogues after editing it.\nexport const ${name} = ${JSON.stringify(lines, null, 2)} as const;\n`;
  const output = `js/generated/dialogues/${id}-dialogue.ts`;
  if (generated !== await readFile(output, 'utf8').catch(() => '')) await writeFile(output, generated);
  imports.push(`import { ${name} } from './${id}-dialogue.js';`);
  entries.push(`  '${id}': ${name},`);
}
const registry = '// Generated from char/manifest.json. Do not edit.\n' + imports.join('\n') + '\n\nexport const CHARACTER_DIALOGUE_LINES = {\n' + entries.join('\n') + '\n} as const;\n';
await writeFile('js/generated/dialogues/index.ts', registry);
