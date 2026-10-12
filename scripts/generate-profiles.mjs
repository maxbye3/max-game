import { readFile, writeFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../character-assets/manifest.json', import.meta.url), 'utf8'));
const profileSources = Object.fromEntries(
  Object.entries(manifest.characters)
    .filter(([, character]) => character.files.profile)
    .map(([id, character]) => [id, `character-assets/${character.directory}/${character.files.profile}`]),
);

const generated = `// Generated from character-assets/manifest.json. Profile choices are explicit so special cases stay stable.\n` +
  `export const PROFILE_IMAGE_SOURCES = ${JSON.stringify(profileSources, null, 2)} as const;\n`;
await writeFile(new URL('../js/generated/core/profile-images.generated.ts', import.meta.url), generated);
