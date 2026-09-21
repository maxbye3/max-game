export const SONGS = [
  'Africa',
  'Dear Abe',
  'Sundays',
  'Too much duolingo',
  'Outer wildeds',
  'One dimensional man',
  'Nowimfallingasleep',
  'Lemon jelly',
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
  return song === 'Africa'
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
