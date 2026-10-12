import { readFile, writeFile } from 'node:fs/promises';

const dialogues = [
  { name: 'ALICE', source: '../character-assets/alice/dialogue.txt', output: '../js/generated/dialogues/alice-dialogue.ts' },
  { name: 'CHRIS', source: '../character-assets/chris/dialogue.txt', output: '../js/generated/dialogues/chris-dialogue.ts' },
  { name: 'ADAM', source: '../character-assets/adam/dialogue.txt', output: '../js/generated/dialogues/adam-dialogue.ts' },
  { name: 'ED', source: '../character-assets/ed/dialogue.txt', output: '../js/generated/dialogues/ed-dialogue.ts' },
  { name: 'MIKE', source: '../character-assets/mike/dialogue.txt', output: '../js/generated/dialogues/mike-dialogue.ts' },
  { name: 'NOEL', source: '../character-assets/noel/dialogue.txt', output: '../js/generated/dialogues/noel-dialogue.ts' },
  { name: 'NIALL', source: '../character-assets/niall/dialogue.txt', output: '../js/generated/dialogues/niall-dialogue.ts' },
  { name: 'REI', source: '../character-assets/rei/dialogue.txt', output: '../js/generated/dialogues/rei-dialogue.ts' },
  { name: 'MARINA_D', source: '../character-assets/marina-d/dialogue.txt', output: '../js/generated/dialogues/marina-d-dialogue.ts' },
  { name: 'SAM', source: '../character-assets/sam/dialogue.txt', output: '../js/generated/dialogues/sam-dialogue.ts' },
  { name: 'KATIE', source: '../character-assets/katie/dialogue.txt', output: '../js/generated/dialogues/katie-dialogue.ts' },
  { name: 'MASON', source: '../character-assets/mason/dialogue.txt', output: '../js/generated/dialogues/mason-dialogue.ts' },
  { name: 'MADDY', source: '../character-assets/maddy/dialogue.txt', output: '../js/generated/dialogues/maddy-dialogue.ts' },
  { name: 'MELI', source: '../character-assets/meli/dialogue.txt', output: '../js/generated/dialogues/meli-dialogue.ts' },
  { name: 'OSCAR', source: '../character-assets/oscar/dialogue.txt', output: '../js/generated/dialogues/oscar-dialogue.ts' },
  { name: 'JU', source: '../character-assets/ju/dialogue.txt', output: '../js/generated/dialogues/ju-dialogue.ts' },
  { name: 'BOCHRA', source: '../character-assets/bochra/dialogue.txt', output: '../js/generated/dialogues/bochra-dialogue.ts' },
  { name: 'DAN', source: '../character-assets/dan/dialogue.txt', output: '../js/generated/dialogues/dan-dialogue.ts' },
  { name: 'JOE', source: '../character-assets/joe/dialogue.txt', output: '../js/generated/dialogues/joe-dialogue.ts' },
  { name: 'ANDY', source: '../character-assets/andy/dialogue.txt', output: '../js/generated/dialogues/andy-dialogue.ts' },
  { name: 'LUCY', source: '../character-assets/lucy/dialogue.txt', output: '../js/generated/dialogues/lucy-dialogue.ts' },
  { name: 'ALEX_S', source: '../character-assets/alex-s/dialogue.txt', output: '../js/generated/dialogues/alex-s-dialogue.ts' },
  { name: 'JULIAN', source: '../character-assets/julian/dialogue.txt', output: '../js/generated/dialogues/julian-dialogue.ts' },
  { name: 'KATY', source: '../character-assets/katy/dialogue.txt', output: '../js/generated/dialogues/katy-dialogue.ts' },
  { name: 'GEORGIA', source: '../character-assets/georgia/dialogue.txt', output: '../js/generated/dialogues/georgia-dialogue.ts' },
  { name: 'HELEN', source: '../character-assets/helen/dialogue.txt', output: '../js/generated/dialogues/helen-dialogue.ts' },
  { name: 'TIM', source: '../character-assets/tim/dialogue.txt', output: '../js/generated/dialogues/tim-dialogue.ts' },
  { name: 'DAD', source: '../character-assets/dad/dialogue.txt', output: '../js/generated/dialogues/dad-dialogue.ts' },
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
