// Reuse clear outdoor spots, keeping buildings, signs and entrances accessible.
const locations = {
  dan: { x: 1150, y: 372 },
  bochra: { x: 1114, y: 172 },
  ju: { x: 1000, y: 180 },
  chris: { x: 475, y: 270 },
  katy: { x: 422, y: 640 },
  marinaD: { x: 201, y: 1034 },
  ruby: { x: 209, y: 1130 },
  maddy: { x: 383, y: 1045 },
} as const;

const STORAGE_KEY = 'max-game:map-npc-layout';
const ids = Object.keys(locations) as (keyof typeof locations)[];
const spots = Object.values(locations);
let layout = ids.map((_, index) => index);
try {
  const previous: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? 'null');
  if (Array.isArray(previous) && previous.length === ids.length && new Set(previous).size === ids.length &&
    previous.every(index => Number.isInteger(index) && index >= 0 && index < ids.length)) {
    layout = [...previous];
  }
} catch { /* A fresh layout still works when session storage is unavailable. */ }

// Sattolo's shuffle moves every entry, so nobody keeps their previous spot.
for (let index = layout.length - 1; index > 0; index--) {
  const other = Math.floor(Math.random() * index);
  [layout[index], layout[other]] = [layout[other]!, layout[index]!];
}

export const MAP_NPC_POSITIONS = Object.fromEntries(ids.map((id, index) => [id, spots[layout[index]!]!])) as
  Readonly<Record<keyof typeof locations, { readonly x: number; readonly y: number }>>;

/** Only the overworld records a visit; importing NPCs inside a room must not. */
export function rememberMapNpcPositions(): void {
  try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); }
  catch { /* The current map keeps its chosen positions without storage. */ }
}
