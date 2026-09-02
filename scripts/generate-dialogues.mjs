import { readFile, writeFile } from 'node:fs/promises';

const dialogues = [
  { name: 'MIKE', source: '../chat/mike/player/dialogue.txt', output: '../js/mike-dialogue.ts' },
  { name: 'NOEL', source: '../chat/noel/player/dialogue.txt', output: '../js/noel-dialogue.ts' },
  { name: 'REI', source: '../chat/rei/player/dialogue.txt', output: '../js/rei-dialogue.ts' },
];

await Promise.all(dialogues.map(async ({ name, source, output }) => {
  const sourceUrl = new URL(source, import.meta.url);
  const dialogue = await readFile(sourceUrl, 'utf8');
  const lines = dialogue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sourcePath = source.replace('../', '');
  const generated = `// Generated from ${sourcePath}. Run npm run generate:dialogues after editing it.\n` +
    `export const ${name}_DIALOGUE_LINES = ${JSON.stringify(lines, null, 2)} as const;\n`;
  await writeFile(new URL(output, import.meta.url), generated);
}));
