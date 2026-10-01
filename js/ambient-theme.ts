const AMBIENCE_STATE_KEY = 'max-game:carried-ambience';

const AMBIENCE_BY_DOOR: Readonly<Record<string, string>> = {
  'northwest-portal': 'map/audio/siblings.mp3',
  'garden-room': 'map/audio/zen-garden.mp3',
  'diary-lab-center': 'map/audio/journal.mp3',
  'diary-lab-right': 'map/audio/journal.mp3',
  'music-shop': 'map/audio/nightclub.mp3',
  gym: 'map/audio/gym.mp3',
  'job-center': 'map/audio/jobCenter.mp3',
  'artist-studio': 'map/audio/art-studio.mp3',
  cinema: 'map/audio/cinema.mp3',
  bookshop: 'map/audio/bookstore.mp3',
  'snow-mansion': 'map/audio/snow-mansion.mp3',
};

interface CarriedAmbience {
  readonly doorId: string;
  readonly source: string;
  readonly currentTime: number;
}

export function ambienceSourceForDoor(doorId: string | null): string | null {
  return doorId ? AMBIENCE_BY_DOOR[doorId] ?? null : null;
}

export function rememberAmbience(doorId: string, source: string, currentTime: number): void {
  try {
    window.sessionStorage.setItem(AMBIENCE_STATE_KEY, JSON.stringify({ doorId, source, currentTime } satisfies CarriedAmbience));
  } catch {
    // The game remains playable when session storage is unavailable.
  }
}

export function carriedAmbienceFor(doorId: string | null): CarriedAmbience | null {
  if (!doorId) return null;
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(AMBIENCE_STATE_KEY) ?? 'null');
    if (
      !stored || typeof stored !== 'object' ||
      !('doorId' in stored) || !('source' in stored) || !('currentTime' in stored) ||
      stored.doorId !== doorId || typeof stored.source !== 'string' || typeof stored.currentTime !== 'number'
    ) return null;
    return stored as CarriedAmbience;
  } catch {
    return null;
  }
}
