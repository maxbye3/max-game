const AMBIENCE_STATE_KEY = 'max-game:carried-ambience';

const AMBIENCE_BY_DOOR: Readonly<Record<string, string>> = {
  'northwest-portal': 'audio/map/siblings.mp3',
  'garden-room': 'audio/map/zen-garden.mp3',
  'diary-lab-center': 'audio/journal/internal.mp3',
  'diary-lab-right': 'audio/journal/internal.mp3',
  'music-shop': 'audio/map/nightclub.mp3',
  gym: 'audio/map/gym.mp3',
  'job-center': 'audio/map/jobCenter.mp3',
  'artist-studio': 'audio/map/art-studio.mp3',
  cinema: 'audio/map/cinema.mp3',
  bookshop: 'audio/map/bookstore.mp3',
  'snow-mansion': 'audio/map/snow-mansion.mp3',
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
