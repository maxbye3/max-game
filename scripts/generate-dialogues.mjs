import { readFile, writeFile } from 'node:fs/promises';

const dialogues = [
  { name: 'ALICE', source: '../chat/alice/dialogue.txt', output: '../js/characters/alice/alice-dialogue.ts' },
  { name: 'CHRIS', source: '../chat/chris/dialogue.txt', output: '../js/characters/chris/chris-dialogue.ts' },
  { name: 'ADAM', source: '../chat/adam/dialogue.txt', output: '../js/characters/adam/adam-dialogue.ts' },
  { name: 'ED', source: '../chat/ed/dialogue.txt', output: '../js/characters/ed/ed-dialogue.ts' },
  { name: 'MIKE', source: '../chat/mike/dialogue.txt', output: '../js/characters/mike/mike-dialogue.ts' },
  { name: 'NOEL', source: '../chat/noel/dialogue.txt', output: '../js/characters/noel/noel-dialogue.ts' },
  { name: 'NIALL', source: '../chat/niall/dialogue.txt', output: '../js/characters/niall/niall-dialogue.ts' },
  { name: 'REI', source: '../chat/rei/dialogue.txt', output: '../js/characters/rei/rei-dialogue.ts' },
  { name: 'MARINA_D', source: '../chat/marina d/dialogue.txt', output: '../js/characters/marina-d/marina-d-dialogue.ts' },
  { name: 'SAM', source: '../chat/sam/dialogue.txt', output: '../js/characters/sam/sam-dialogue.ts' },
  { name: 'KATIE', source: '../chat/katie/dialogue.txt', output: '../js/characters/katie/katie-dialogue.ts' },
  { name: 'MASON', source: '../chat/mason/dialogue.txt', output: '../js/characters/mason/mason-dialogue.ts' },
  { name: 'MADDY', source: '../chat/maddy/dialogue.txt', output: '../js/characters/maddy/maddy-dialogue.ts' },
  { name: 'MELI', source: '../chat/meli/dialogue.txt', output: '../js/characters/meli/meli-dialogue.ts' },
  { name: 'OSCAR', source: '../chat/oscar/dialogue.txt', output: '../js/characters/oscar/oscar-dialogue.ts' },
  { name: 'JU', source: '../chat/ju/dialogue.txt', output: '../js/characters/ju/ju-dialogue.ts' },
  { name: 'BOCHRA', source: '../chat/bochra/dialogue.txt', output: '../js/characters/bochra/bochra-dialogue.ts' },
  { name: 'DAN', source: '../chat/dan/dialogue.txt', output: '../js/characters/dan/dan-dialogue.ts' },
  { name: 'JOE', source: '../chat/joe/dialogue.txt', output: '../js/characters/joe/joe-dialogue.ts' },
  { name: 'ANDY', source: '../chat/andy/dialogue.txt', output: '../js/characters/andy/andy-dialogue.ts' },
  { name: 'LUCY', source: '../chat/lucy/dialogue.txt', output: '../js/characters/lucy/lucy-dialogue.ts' },
  { name: 'ALEX_S', source: '../chat/alex s/dialogue.txt', output: '../js/characters/alex-s/alex-s-dialogue.ts' },
  { name: 'JULIAN', source: '../chat/julian/dialogue.txt', output: '../js/characters/julian/julian-dialogue.ts' },
  { name: 'KATY', source: '../chat/katy/dialogue.txt', output: '../js/characters/katy/katy-dialogue.ts' },
  { name: 'GEORGIA', source: '../chat/georgia/dialogue.txt', output: '../js/characters/georgia/georgia-dialogue.ts' },
  { name: 'HELEN', source: '../chat/helen/dialogue.txt', output: '../js/characters/helen/helen-dialogue.ts' },
  { name: 'TIM', source: '../chat/tim/dialogue.txt', output: '../js/characters/tim/tim-dialogue.ts' },
  { name: 'DAD', source: '../chat/dad/dialogue.txt', output: '../js/characters/dad/dad-dialogue.ts' },
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
