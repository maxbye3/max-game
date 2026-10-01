export const SONGS = [
  'Africa',
  'Dear Abe',
  'Sundays',
  'Too much duolingo',
  'Outer wildeds',
  'One dimensional man',
  'Nowimfallingasleep',
  'Lemon jelly',
  'bleep-blops',
] as const;

export type Song = (typeof SONGS)[number];
const UNLOCKED_SONGS_KEY = 'max-game:unlocked-songs';

export function getUnlockedSongs(): readonly Song[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(UNLOCKED_SONGS_KEY) ?? '[]');
    return Array.isArray(stored) ? SONGS.filter((song) => stored.includes(song)) : [];
  } catch {
    return [];
  }
}

export function getSongArtwork(song: Song): string {
  if (song === 'bleep-blops') return 'audio/music/bits-bots.png';
  return song === 'Africa' || song === 'Outer wildeds' || song === 'Too much duolingo' || song === 'Lemon jelly'
    ? 'audio/music/caledonian-is-massive.png'
    : 'audio/music/bits-bots.png';
}

export function unlockSong(song: Song): boolean {
  const unlocked = getUnlockedSongs();
  if (unlocked.includes(song)) return false;
  try {
    window.localStorage.setItem(UNLOCKED_SONGS_KEY, JSON.stringify([...unlocked, song]));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event('max-game:music-unlocked'));
  return true;
}

/** Clears earned tracks so music rewards can be tested again. */
export function resetMusicLibrary(): void {
  try {
    window.localStorage.removeItem(UNLOCKED_SONGS_KEY);
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
  window.dispatchEvent(new Event('max-game:music-library-reset'));
}
