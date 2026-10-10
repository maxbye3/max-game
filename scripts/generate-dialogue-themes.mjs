import { readdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const chatDirectory = fileURLToPath(new URL('../chat/', import.meta.url));
const themeSources = {};
const themePriorities = {};

async function collectThemes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectThemes(path);
      return;
    }
    if (entry.name.toLowerCase() !== 'theme.mp3') return;
    const pathFromChat = relative(chatDirectory, path).replaceAll('\\', '/');
    const folder = pathFromChat.slice(0, pathFromChat.lastIndexOf('/'));
    const characterFolder = folder.split('/')[0] ?? '';
    if (characterFolder === 'adam' || characterFolder === 'mason' || characterFolder === 'meli' || characterFolder === 'mike' || characterFolder === 'noel' || characterFolder === 'niall') return;
    const priority = (characterFolder === 'ed' || characterFolder === 'dad') && folder === characterFolder
      ? 5
      : ['bochra', 'chris', 'dan', 'georgia', 'joe', 'ju', 'katie', 'lucy', 'marina d', 'oscar', 'rei', 'sam', 'tim'].includes(characterFolder) && folder === characterFolder
      ? 4
      : folder.endsWith('/player') ? 3 : folder === characterFolder ? 2 : 1;
    if (!themePriorities[characterFolder] || priority > themePriorities[characterFolder]) {
      themeSources[characterFolder] = `chat/${pathFromChat}`;
      themePriorities[characterFolder] = priority;
    }
  }));
}

await collectThemes(chatDirectory);

const generated = `// Generated from chat/**/theme.mp3. Run npm run generate:dialogue-themes after adding themes.\n` +
  `export const DIALOGUE_THEME_SOURCES = ${JSON.stringify(themeSources, null, 2)} as const;\n`;
await writeFile(new URL('../js/dialogue-themes.generated.ts', import.meta.url), generated);
