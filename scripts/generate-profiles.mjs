import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const chatDirectory = fileURLToPath(new URL('../chat/', import.meta.url));
const profileSources = {};
// Character root folders only. Nested player/example/real portraits are not fallbacks.
const characters = (await readdir(chatDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name !== 'real')
  .sort((a, b) => a.name.localeCompare(b.name));
for (const character of characters) {
  const files = (await readdir(join(chatDirectory, character.name), { withFileTypes: true }))
    .filter((entry) => entry.isFile() && /^profile\.(?:png|jpe?g)$/i.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (files[0]) profileSources[character.name] = `chat/${character.name}/${files[0].name}`;
}

const generated = `// Generated from chat/<character>/profile.(png|jpg|jpeg). No nested fallbacks.\n` +
  `export const PROFILE_IMAGE_SOURCES = ${JSON.stringify(profileSources, null, 2)} as const;\n`;
await writeFile(new URL('../js/profile-images.generated.ts', import.meta.url), generated);
