import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dialogues = [
  { name: 'ALICE', source: '../char/alice/dialogue.txt', output: '../js/generated/dialogues/alice-dialogue.ts' },
  { name: 'CHRIS', source: '../char/chris/dialogue.txt', output: '../js/generated/dialogues/chris-dialogue.ts' },
  { name: 'ADAM', source: '../char/adam/dialogue.txt', output: '../js/generated/dialogues/adam-dialogue.ts' },
  { name: 'ED', source: '../char/ed/dialogue.txt', output: '../js/generated/dialogues/ed-dialogue.ts' },
  { name: 'MIKE', source: '../char/mike/dialogue.txt', output: '../js/generated/dialogues/mike-dialogue.ts' },
  { name: 'NOEL', source: '../char/noel/dialogue.txt', output: '../js/generated/dialogues/noel-dialogue.ts' },
  { name: 'WHELDON', source: '../char/wheldon/dialogue.txt', output: '../js/generated/dialogues/wheldon-dialogue.ts' },
  { name: 'JOSH', source: '../char/josh/dialogue.txt', output: '../js/generated/dialogues/josh-dialogue.ts' },
  { name: 'NIALL', source: '../char/niall/dialogue.txt', output: '../js/generated/dialogues/niall-dialogue.ts' },
  { name: 'REI', source: '../char/rei/dialogue.txt', output: '../js/generated/dialogues/rei-dialogue.ts' },
  { name: 'MARINA_D', source: '../char/marina-d/dialogue.txt', output: '../js/generated/dialogues/marina-d-dialogue.ts' },
  { name: 'SAM', source: '../char/sam/dialogue.txt', output: '../js/generated/dialogues/sam-dialogue.ts' },
  { name: 'KATIE', source: '../char/katie/dialogue.txt', output: '../js/generated/dialogues/katie-dialogue.ts' },
  { name: 'MASON', source: '../char/mason/dialogue.txt', output: '../js/generated/dialogues/mason-dialogue.ts' },
  { name: 'MADDY', source: '../char/maddy/dialogue.txt', output: '../js/generated/dialogues/maddy-dialogue.ts' },
  { name: 'MELI', source: '../char/meli/dialogue.txt', output: '../js/generated/dialogues/meli-dialogue.ts' },
  { name: 'OSCAR', source: '../char/oscar/dialogue.txt', output: '../js/generated/dialogues/oscar-dialogue.ts' },
  { name: 'JU', source: '../char/ju/dialogue.txt', output: '../js/generated/dialogues/ju-dialogue.ts' },
  { name: 'BOCHRA', source: '../char/bochra/dialogue.txt', output: '../js/generated/dialogues/bochra-dialogue.ts' },
  { name: 'DAN', source: '../char/dan/dialogue.txt', output: '../js/generated/dialogues/dan-dialogue.ts' },
  { name: 'JOE', source: '../char/joe/dialogue.txt', output: '../js/generated/dialogues/joe-dialogue.ts' },
  { name: 'ANDY', source: '../char/andy/dialogue.txt', output: '../js/generated/dialogues/andy-dialogue.ts' },
  { name: 'LUCY', source: '../char/lucy/dialogue.txt', output: '../js/generated/dialogues/lucy-dialogue.ts' },
  { name: 'ALEX_S', source: '../char/wheldon/alex-s-dialogue.txt', output: '../js/generated/dialogues/alex-s-dialogue.ts' },
  { name: 'JULIAN', source: '../char/julian/dialogue.txt', output: '../js/generated/dialogues/julian-dialogue.ts' },
  { name: 'KATY', source: '../char/katy/dialogue.txt', output: '../js/generated/dialogues/katy-dialogue.ts' },
  { name: 'GEORGIA', source: '../char/georgia/dialogue.txt', output: '../js/generated/dialogues/georgia-dialogue.ts' },
  { name: 'HELEN', source: '../char/helen/dialogue.txt', output: '../js/generated/dialogues/helen-dialogue.ts' },
  { name: 'TIM', source: '../char/tim/dialogue.txt', output: '../js/generated/dialogues/tim-dialogue.ts' },
  { name: 'DAD', source: '../char/dad/dialogue.txt', output: '../js/generated/dialogues/dad-dialogue.ts' },
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
  const outputUrl = new URL(output, import.meta.url);
  await mkdir(dirname(fileURLToPath(outputUrl)), { recursive: true });
  await writeFile(outputUrl, generated);
}));
