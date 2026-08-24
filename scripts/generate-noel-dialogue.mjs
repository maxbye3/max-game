import { readFile, writeFile } from 'node:fs/promises';

const sourceUrl = new URL('../chat/noel/example_character/dialogue.txt', import.meta.url);
const outputUrl = new URL('../js/noel-dialogue.ts', import.meta.url);
const dialogue = await readFile(sourceUrl, 'utf8');
const lines = dialogue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const generated = `// Generated from chat/noel/example_character/dialogue.txt. Run npm run generate:noel-dialogue after editing it.\nexport const NOEL_DIALOGUE_LINES = ${JSON.stringify(lines, null, 2)} as const;\n`;
await writeFile(outputUrl, generated);
