import { readFile, writeFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../character-assets/manifest.json', import.meta.url), 'utf8'));
const themeSources = Object.fromEntries(
  Object.entries(manifest.characters)
    .filter(([, character]) => character.dialogueTheme)
    .map(([id, character]) => [id, `character-assets/${character.directory}/${character.dialogueTheme}`]),
);

const generated = `// Generated from character-assets/manifest.json. Run npm run generate:dialogue-themes after changing dialogue themes.\n` +
  `export const DIALOGUE_THEME_SOURCES = ${JSON.stringify(themeSources, null, 2)} as const;\n`;
await writeFile(new URL('../js/generated/core/dialogue-themes.generated.ts', import.meta.url), generated);
