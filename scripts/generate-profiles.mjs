import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = JSON.parse(await readFile(new URL('../character-assets/manifest.json', import.meta.url), 'utf8'));
const profileSources = Object.fromEntries(
  Object.entries(manifest.characters)
    .filter(([, character]) => character.files.profile)
    .map(([id, character]) => [id, `character-assets/${character.directory}/${character.files.profile}`]),
);

const generated = `// Generated from character-assets/manifest.json. Profile choices are explicit so special cases stay stable.\n` +
  `export const PROFILE_IMAGE_SOURCES = ${JSON.stringify(profileSources, null, 2)} as const;\n`;
const outputUrl = new URL('../js/generated/core/profile-images.generated.ts', import.meta.url);
await mkdir(dirname(fileURLToPath(outputUrl)), { recursive: true });
await writeFile(outputUrl, generated);
