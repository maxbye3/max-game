import { readFile, writeFile } from 'node:fs/promises';

const dialogues = [
  { name: 'ALICE', source: '../chat/alice/dialogue.txt', output: '../js/alice-dialogue.ts' },
  { name: 'CHRIS', source: '../chat/chris/dialogue.txt', output: '../js/chris-dialogue.ts' },
  { name: 'ADAM', source: '../chat/adam/dialogue.txt', output: '../js/adam-dialogue.ts' },
  { name: 'ED', source: '../chat/ed/dialogue.txt', output: '../js/ed-dialogue.ts' },
  { name: 'MIKE', source: '../chat/mike/dialogue.txt', output: '../js/mike-dialogue.ts' },
  { name: 'NOEL', source: '../chat/noel/dialogue.txt', output: '../js/noel-dialogue.ts' },
  { name: 'NIALL', source: '../chat/niall/dialogue.txt', output: '../js/niall-dialogue.ts' },
  { name: 'REI', source: '../chat/rei/dialogue.txt', output: '../js/rei-dialogue.ts' },
  { name: 'MARINA_D', source: '../chat/marina d/dialogue.txt', output: '../js/marina-d-dialogue.ts' },
  { name: 'SAM', source: '../chat/sam/dialogue.txt', output: '../js/sam-dialogue.ts' },
  { name: 'KATIE', source: '../chat/katie/dialogue.txt', output: '../js/katie-dialogue.ts' },
  { name: 'MASON', source: '../chat/mason/dialogue.txt', output: '../js/mason-dialogue.ts' },
  { name: 'MADDY', source: '../chat/maddy/dialogue.txt', output: '../js/maddy-dialogue.ts' },
  { name: 'MELI', source: '../chat/meli/dialogue.txt', output: '../js/meli-dialogue.ts' },
  { name: 'OSCAR', source: '../chat/oscar/dialogue.txt', output: '../js/oscar-dialogue.ts' },
  { name: 'JU', source: '../chat/ju/dialogue.txt', output: '../js/ju-dialogue.ts' },
  { name: 'BOCHRA', source: '../chat/bochra/dialogue.txt', output: '../js/bochra-dialogue.ts' },
  { name: 'DAN', source: '../chat/dan/dialogue.txt', output: '../js/dan-dialogue.ts' },
  { name: 'JOE', source: '../chat/joe/dialogue.txt', output: '../js/joe-dialogue.ts' },
  { name: 'ANDY', source: '../chat/andy/dialogue.txt', output: '../js/andy-dialogue.ts' },
  { name: 'LUCY', source: '../chat/lucy/dialogue.txt', output: '../js/lucy-dialogue.ts' },
  { name: 'ALEX_S', source: '../chat/alex s/dialogue.txt', output: '../js/alex-s-dialogue.ts' },
  { name: 'JULIAN', source: '../chat/julian/dialogue.txt', output: '../js/julian-dialogue.ts' },
  { name: 'KATY', source: '../chat/katy/dialogue.txt', output: '../js/katy-dialogue.ts' },
  { name: 'GEORGIA', source: '../chat/georgia/dialogue.txt', output: '../js/georgia-dialogue.ts' },
  { name: 'HELEN', source: '../chat/helen/dialogue.txt', output: '../js/helen-dialogue.ts' },
  { name: 'TIM', source: '../chat/tim/dialogue.txt', output: '../js/tim-dialogue.ts' },
];

await Promise.all(dialogues.map(async ({ name, source, output }) => {
  const sourceUrl = new URL(source, import.meta.url);
  let dialogue;
  try {
    dialogue = await readFile(sourceUrl, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }
  const lines = dialogue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const sourcePath = source.replace('../', '');
  const generated = `// Generated from ${sourcePath}. Run npm run generate:dialogues after editing it.\n` +
    `export const ${name}_DIALOGUE_LINES = ${JSON.stringify(lines, null, 2)} as const;\n`;
  await writeFile(new URL(output, import.meta.url), generated);
}));
