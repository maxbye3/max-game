import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = JSON.parse(await readFile(new URL('../char/manifest.json', import.meta.url), 'utf8'));
const profileSources = {};
for (const [id, character] of Object.entries(manifest.characters)) {
  const files = await readdir(new URL(`../char/${character.directory}/`, import.meta.url));
  const allowed = ['profile.png', 'profile.jpg', 'profile.jpeg'];
  const preferred = character.files.profile;
  const profile = allowed.includes(preferred) && files.includes(preferred) ? preferred : allowed.find(name => files.includes(name));
  if (profile) profileSources[id] = `char/${character.directory}/${profile}`;
}

const generated = `// Generated from root profile files in char/manifest.json directories. No portrait fallback.\n` +
  `export const PROFILE_IMAGE_SOURCES = ${JSON.stringify(profileSources, null, 2)} as const;\n`;
const outputUrl = new URL('../js/generated/core/profile-images.generated.ts', import.meta.url);
await mkdir(dirname(fileURLToPath(outputUrl)), { recursive: true });
await writeFile(outputUrl, generated);
