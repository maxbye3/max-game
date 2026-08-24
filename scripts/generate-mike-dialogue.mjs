import { readFile, writeFile } from 'node:fs/promises';

const sourceUrl = new URL('../chat/mike/example_character/dialogue.txt', import.meta.url);
const outputUrl = new URL('../js/mike-dialogue.ts', import.meta.url);
const dialogue = await readFile(sourceUrl, 'utf8');
const lines = dialogue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const generated = `// Generated from chat/mike/example_character/dialogue.txt. Run npm run generate:mike-dialogue after editing it.\nexport const MIKE_DIALOGUE_LINES = ${JSON.stringify(lines, null, 2)} as const;\n`;
await writeFile(outputUrl, generated);
