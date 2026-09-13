import { readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const chatDirectory = fileURLToPath(new URL('../chat/', import.meta.url));
const profileSources = {};
const profilePriorities = {};

async function collectProfiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectProfiles(path);
      return;
    }
    if (!/^profile\.(?:png|jpe?g)$/i.test(entry.name)) return;
    const pathFromChat = relative(chatDirectory, path).replaceAll('\\', '/');
    const folder = pathFromChat.slice(0, pathFromChat.lastIndexOf('/'));
    const characterFolder = folder.split('/')[0] ?? '';
    const priority = folder.endsWith('/player') ? 3 : folder === characterFolder ? 2 : 1;
    // Prefer the character's player profile, then the root profile, then an example.
    if (!profilePriorities[characterFolder] || priority > profilePriorities[characterFolder]) {
      profileSources[characterFolder] = `chat/${pathFromChat}`;
      profilePriorities[characterFolder] = priority;
    }
  }));
}

await collectProfiles(chatDirectory);

const generated = `// Generated from chat/**/profile.(png|jpg|jpeg). Run npm run generate:profiles after adding profiles.\n` +
  `export const PROFILE_IMAGE_SOURCES = ${JSON.stringify(profileSources, null, 2)} as const;\n`;
await writeFile(new URL('../js/profile-images.generated.ts', import.meta.url), generated);
