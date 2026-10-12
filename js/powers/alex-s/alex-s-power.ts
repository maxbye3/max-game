export const ALEX_S_POWER_DURATION = 20_000;

export interface ResurrectionCharacter {
  readonly id: string;
  readonly name: string;
  readonly imageSource: string;
  readonly frame?: readonly [number, number, number, number];
}

/** The existing character sprites, including characters in other rooms. */
export const RESURRECTION_CHARACTERS: readonly ResurrectionCharacter[] = [
  { id: 'adam', name: 'Adam', imageSource: 'chat/adam/avatar.png' },
  { id: 'alex-w', name: 'Alex W', imageSource: 'chat/alex w/map-sprite.png' },
  { id: 'alice', name: 'Alice', imageSource: 'chat/alice/map-sprite.png' },
  { id: 'aliya', name: 'Aliya', imageSource: 'chat/aliya/map-sprite.png' },
  { id: 'andy', name: 'Andy', imageSource: 'chat/andy/map-sprite.png' },
  { id: 'bochra', name: 'Bochra', imageSource: 'chat/bochra/map-sprite.png' },
  { id: 'chris', name: 'Chris', imageSource: 'chat/chris/map-sprite.png' },
  { id: 'dan', name: 'Dan', imageSource: 'chat/dan/map-sprite.png' },
  { id: 'ed', name: 'Ed', imageSource: 'chat/ed/avatar.png' },
  { id: 'georgia', name: 'Georgia', imageSource: 'chat/georgia/map-sprite.png' },
  { id: 'helen', name: 'Helen', imageSource: 'chat/helen/map-sprite.png' },
  { id: 'joe', name: 'Joe', imageSource: 'chat/joe/map-sprite.png' },
  { id: 'josh', name: 'Josh', imageSource: 'chat/josh/map-sprite.png' },
  { id: 'ju', name: 'Ju', imageSource: 'chat/ju/map-sprite.png' },
  { id: 'julian', name: 'Julian', imageSource: 'chat/julian/map-sprite.png' },
  { id: 'katie', name: 'Katie', imageSource: 'chat/katie/map-sprite.png' },
  { id: 'katy', name: 'Katy', imageSource: 'chat/katy/map-sprite.png' },
  { id: 'lucy', name: 'Lucy', imageSource: 'chat/lucy/map-sprite.png' },
  { id: 'maddy', name: 'Maddy', imageSource: 'chat/maddy/map-sprite.png' },
  { id: 'marina', name: 'Marina D', imageSource: 'chat/marina d/map-sprite.png' },
  { id: 'mason', name: 'Mason', imageSource: 'chat/mason/map-sprite.png' },
  { id: 'meli', name: 'Meli', imageSource: 'chat/meli/map-sprite.png' },
  { id: 'mike', name: 'Mike', imageSource: 'chat/mike/overworld-avatar.png' },
  { id: 'niall', name: 'Niall', imageSource: 'chat/niall/avatar.png' },
  { id: 'noel', name: 'Noel', imageSource: 'chat/noel/interior-avatar.png' },
  { id: 'oscar', name: 'Oscar', imageSource: 'chat/oscar/map-sprite.png' },
  { id: 'rei', name: 'Rei', imageSource: 'chat/rei/overworld-avatar.png' },
  { id: 'sam', name: 'Sam', imageSource: 'chat/sam/map-sprite.png' },
  { id: 'siblings', name: 'Siblings', imageSource: 'chat/siblings/girls-sprite.png', frame: [181, 16, 235, 176] },
  { id: 'tim', name: 'Tim', imageSource: 'chat/tim/map-sprite.png' },
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
