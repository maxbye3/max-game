import { readFile, writeFile } from 'node:fs/promises';

const dialogues = [
  { name: 'ADAM', source: '../chat/adam/player/dialogue.txt', output: '../js/adam-dialogue.ts' },
  { name: 'ED', source: '../chat/ed/player/dialogue.txt', output: '../js/ed-dialogue.ts' },
  { name: 'MIKE', source: '../chat/mike/player/dialogue.txt', output: '../js/mike-dialogue.ts' },
  { name: 'NOEL', source: '../chat/noel/player/dialogue.txt', output: '../js/noel-dialogue.ts' },
  { name: 'NIALL', source: '../chat/niall/dialogue.txt', output: '../js/niall-dialogue.ts' },
  { name: 'REI', source: '../chat/rei/player/dialogue.txt', output: '../js/rei-dialogue.ts' },
  { name: 'ANDY', source: '../chat/andy/dialogue.txt', output: '../js/andy-dialogue.ts' },
  { name: 'LUCY', source: '../chat/lucy/player/dialogue.txt', output: '../js/lucy-dialogue.ts' },
  { name: 'ALEX_S', source: '../chat/alex s/dialogue.txt', output: '../js/alex-s-dialogue.ts' },
  { name: 'JULIAN', source: '../chat/julian/dialogue.txt', output: '../js/julian-dialogue.ts' },
  { name: 'KATY', source: '../chat/katy/dialogue.txt', output: '../js/katy-dialogue.ts' },
  { name: 'GEORGIA', source: '../chat/georgia/dialogue.txt', output: '../js/georgia-dialogue.ts' },
  { name: 'HELEN', source: '../chat/helen/dialogue.txt', output: '../js/helen-dialogue.ts' },
  { name: 'TIM', source: '../chat/tim/dialogue.txt', output: '../js/tim-dialogue.ts' },
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
