import { mkdir, readFile, writeFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('char/manifest.json', 'utf8'));
const specialSources = {
  andy: { 'andy-item': 'Item.txt' },
  niall: { 'niall-item': 'player/item.txt' },
  rei: { 'rei-item': 'item-1.txt', 'rei-item-2': 'item-2.txt' },
};
const sources = {}, descriptions = {};
for (const [id, character] of Object.entries(manifest.characters)) {
  const files = specialSources[id] ?? (character.files.item ? { [`${id}-item`]: 'item.txt' } : {});
  for (const [item, file] of Object.entries(files)) {
    const source = `char/${character.directory}/${file}`;
    sources[item] = source;
    descriptions[item] = await readFile(source, 'utf8');
  }
}
await mkdir('js/generated/core', { recursive: true });
await writeFile('js/generated/core/item-descriptions.generated.ts',
  '// Generated from character item text. Do not edit.\n' +
  `export const ITEM_DESCRIPTION_SOURCES: Readonly<Record<string, string>> = ${JSON.stringify(sources, null, 2)};\n` +
  `export const ITEM_DESCRIPTIONS: Readonly<Record<string, string>> = ${JSON.stringify(descriptions, null, 2)};\n`);
