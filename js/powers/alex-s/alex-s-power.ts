import { characterAsset } from '../../core/character-assets.js';

export const ALEX_S_POWER_DURATION = 20_000;

export interface ResurrectionCharacter {
  readonly id: string;
  readonly name: string;
  readonly imageSource: string;
  readonly frame?: readonly [number, number, number, number];
}

/** The existing character sprites, including characters in other rooms. */
export const RESURRECTION_CHARACTERS: readonly ResurrectionCharacter[] = [
  { id: 'adam', name: 'Adam', imageSource: characterAsset('adam', 'avatar') },
  { id: 'alex-w', name: 'Alex W', imageSource: characterAsset('alex-w', 'mapSprite') },
  { id: 'alice', name: 'Alice', imageSource: characterAsset('alice', 'mapSprite') },
  { id: 'aliya', name: 'Aliya', imageSource: characterAsset('aliya', 'mapSprite') },
  { id: 'andy', name: 'Andy', imageSource: characterAsset('andy', 'mapSprite') },
  { id: 'bochra', name: 'Bochra', imageSource: characterAsset('bochra', 'mapSprite') },
  { id: 'chris', name: 'Chris', imageSource: characterAsset('chris', 'mapSprite') },
  { id: 'dan', name: 'Dan', imageSource: characterAsset('dan', 'mapSprite') },
  { id: 'ed', name: 'Ed', imageSource: characterAsset('ed', 'avatar') },
  { id: 'georgia', name: 'Georgia', imageSource: characterAsset('georgia', 'mapSprite') },
  { id: 'helen', name: 'Helen', imageSource: characterAsset('helen', 'mapSprite') },
  { id: 'joe', name: 'Joe', imageSource: characterAsset('joe', 'mapSprite') },
  { id: 'josh', name: 'Josh', imageSource: characterAsset('josh', 'mapSprite') },
  { id: 'ju', name: 'Ju', imageSource: characterAsset('ju', 'mapSprite') },
  { id: 'julian', name: 'Julian', imageSource: characterAsset('julian', 'mapSprite') },
  { id: 'katie', name: 'Katie', imageSource: characterAsset('katie', 'mapSprite') },
  { id: 'katy', name: 'Katy', imageSource: characterAsset('katy', 'mapSprite') },
  { id: 'lucy', name: 'Lucy', imageSource: characterAsset('lucy', 'mapSprite') },
  { id: 'maddy', name: 'Maddy', imageSource: characterAsset('maddy', 'mapSprite') },
  { id: 'marina', name: 'Marina D', imageSource: characterAsset('marina-d', 'mapSprite') },
  { id: 'mason', name: 'Mason', imageSource: characterAsset('mason', 'mapSprite') },
  { id: 'meli', name: 'Meli', imageSource: characterAsset('meli', 'mapSprite') },
  { id: 'mike', name: 'Mike', imageSource: characterAsset('mike', 'overworldAvatar') },
  { id: 'niall', name: 'Niall', imageSource: characterAsset('niall', 'avatar') },
  { id: 'noel', name: 'Noel', imageSource: characterAsset('noel', 'interiorAvatar') },
  { id: 'oscar', name: 'Oscar', imageSource: characterAsset('oscar', 'mapSprite') },
  { id: 'rei', name: 'Rei', imageSource: characterAsset('rei', 'overworldAvatar') },
  { id: 'sam', name: 'Sam', imageSource: characterAsset('sam', 'mapSprite') },
  { id: 'siblings', name: 'Siblings', imageSource: characterAsset('siblings', 'girlsSprite'), frame: [181, 16, 235, 176] },
  { id: 'tim', name: 'Tim', imageSource: characterAsset('tim', 'mapSprite') },
];

const TOAST_LINES = [
  'I have risen again, like toast springing out of a toaster.',
  'Life is a slice of toast: sometimes the heat is what gives you your crunch.',
  'Friendship is like butter on warm toast. It makes even the rough edges easier to face.',
  'A second chance is like rescuing toast before it burns. Make the next bite count.',
  'My time here is like toast left on the plate: enjoy it before the warmth is gone.',
] as const;
const SESSION_KEY = 'max-game:alex-s-resurrection';
interface Resurrection { readonly characterId: string; readonly startedAt: number }

function restoreResurrection(): Resurrection | null {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) ?? 'null') as Partial<Resurrection> | null;
    return stored && typeof stored.startedAt === 'number' && Number.isFinite(stored.startedAt) &&
      RESURRECTION_CHARACTERS.some((character) => character.id === stored.characterId)
      ? { characterId: stored.characterId!, startedAt: stored.startedAt } : null;
  } catch { return null; }
}

let resurrection = restoreResurrection();

export function activateAlexSPower(characterId: string, now = Date.now()): boolean {
  if (!RESURRECTION_CHARACTERS.some((character) => character.id === characterId)) return false;
  resurrection = { characterId, startedAt: now };
  try { window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(resurrection)); } catch { /* The spell still works on this page. */ }
  return true;
}

export function alexSPowerSecondsLeft(now = Date.now()): number {
  if (!resurrection || now < resurrection.startedAt) return 0;
  return Math.max(0, (resurrection.startedAt + ALEX_S_POWER_DURATION - now) / 1000);
}

export function getAlexResurrection(now = Date.now()): ResurrectionCharacter | null {
  return alexSPowerSecondsLeft(now) > 0
    ? RESURRECTION_CHARACTERS.find((character) => character.id === resurrection?.characterId) ?? null : null;
}

export const alexSToastLine = (index: number): string => TOAST_LINES[index % TOAST_LINES.length] ?? TOAST_LINES[0];
export const alexSThemeSecondsLeft = (now = Date.now()): number => resurrection && now >= resurrection.startedAt
  ? Math.max(0, (resurrection.startedAt + 10_000 - now) / 1000) : 0;

export function alexSPowerReveal(): string {
  const character = RESURRECTION_CHARACTERS.find((candidate) => candidate.id === resurrection?.characterId);
  return `Alex S's power: the Book of the Bread resurrected ${character?.name ?? 'another character'} beside you for twenty seconds. They could only speak through toast-based analogies, then returned to the beyond.`;
}
