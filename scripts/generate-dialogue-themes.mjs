import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = JSON.parse(await readFile(new URL('../character-assets/manifest.json', import.meta.url), 'utf8'));
const themeSources = Object.fromEntries(
  Object.entries(manifest.characters)
    .filter(([, character]) => character.dialogueTheme)
    .map(([id, character]) => [id, `character-assets/${character.directory}/${character.dialogueTheme}`]),
);

const generated = `// Generated from character-assets/manifest.json. Run npm run generate:dialogue-themes after changing dialogue themes.\n` +
  `export const DIALOGUE_THEME_SOURCES = ${JSON.stringify(themeSources, null, 2)} as const;\n`;
const outputUrl = new URL('../js/generated/core/dialogue-themes.generated.ts', import.meta.url);
await mkdir(dirname(fileURLToPath(outputUrl)), { recursive: true });
await writeFile(outputUrl, generated);
