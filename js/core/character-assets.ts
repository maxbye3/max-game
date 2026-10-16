import manifest from '../../char/manifest.json';

const ROOT = 'char/';

export type CharacterId = keyof typeof manifest.characters;
export type CharacterAssetKey = string;

interface AssetEntry {
  readonly directory: string;
  readonly displayName: string;
  readonly files: Readonly<Record<string, string>>;
}

const characters = manifest.characters as Record<CharacterId, AssetEntry>;

function assetPath(character: AssetEntry, file: string): string {
  return file.startsWith('img/') ? file : `${ROOT}${character.directory}/${file}`;
}

export function characterAsset(id: CharacterId, key: CharacterAssetKey): string {
  const character = characters[id];
  const file = character?.files[key];
  if (!file) throw new Error(`Missing ${key} asset for character ${id}`);
  return assetPath(character, file);
}

export function characterAssetOrNull(id: CharacterId, key: CharacterAssetKey): string | null {
  const character = characters[id];
  const file = character?.files[key];
  return file ? assetPath(character, file) : null;
}

export function playerAsset(key: string): string {
  const file = manifest.player.files[key as keyof typeof manifest.player.files];
  if (!file) throw new Error(`Missing player asset: ${key}`);
  return `${ROOT}${manifest.player.directory}/${file}`;
}

export function characterIdForName(name: string): CharacterId | null {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, '-');
  const exact = (Object.keys(characters) as CharacterId[]).find((id) =>
    id === normalized || characters[id].displayName.toLowerCase().replace(/\s+/g, '-') === normalized,
  );
  if (exact) return exact;
  return (Object.keys(characters) as CharacterId[]).find((id) =>
    normalized.startsWith(`${id}-`) || id.startsWith(`${normalized}-`),
  ) ?? null;
}
