export const CHRIS_POWER_DURATION = 10_000;
export const CHRIS_POWER_REVEAL = "Chris's power: the Makeshift Karaoke Mic carried your voice across the whole world on a roaring musical wind. You became a spotlighted singer with a wind-assisted stride, while everyone stopped to listen and joined the chorus as your sound waves reached them. The world became your stage for ten seconds.";
export const CHRIS_WAVE_SPEED = 720;
export const CHRIS_WAVE_INTERVAL = 650;

export interface ChrisListener { readonly id: string; readonly x: number; readonly y: number; readonly height: number; readonly heardAt: number }
interface ChrisTarget { readonly id: string; readonly x: number; readonly y: number; readonly height: number }
interface VoiceWave { readonly x: number; readonly y: number; readonly time: number }
let startedAt = Infinity;
let endsAt = 0;
let lastWaveAt = -Infinity;
const listeners = new Map<string, ChrisListener>();
const waves: VoiceWave[] = [];
const singer = { x: 0, y: 0 };

export function activateChrisPower(now = performance.now()): void {
  startedAt = now;
  endsAt = now + CHRIS_POWER_DURATION;
  lastWaveAt = -Infinity;
  listeners.clear();
  waves.length = 0;
}

export const isChrisPowerActive = (now = performance.now()): boolean => now >= startedAt && now < endsAt;
export const chrisPowerSecondsLeft = (now = performance.now()): number => isChrisPowerActive(now) ? (endsAt - now) / 1000 : 0;
export const chrisPowerElapsed = (now: number): number => Math.max(0, now - startedAt);
export const chrisMovementMultiplier = (now = performance.now()): number => isChrisPowerActive(now) ? 1.5 : 1;

/** The audience stops its usual business while the singer keeps moving freely. */
export function chrisWorldDeltaTime(deltaTime: number, now: number): number {
  const overlap = Math.max(0, Math.min(now, endsAt) - Math.max(now - deltaTime * 1000, startedAt)) / 1000;
  return Math.max(0, deltaTime - overlap);
}

export function updateChrisWorld(now: number, x: number, y: number, targets: readonly ChrisTarget[]): void {
  if (!isChrisPowerActive(now)) {
    listeners.clear();
    waves.length = 0;
    return;
  }
  singer.x = x;
  singer.y = y;
  if (now - lastWaveAt >= CHRIS_WAVE_INTERVAL) {
    waves.push({ x, y: y - 24, time: now });
    lastWaveAt = now;
  }
  while (waves.length && now - (waves[0]?.time ?? now) > 2700) waves.shift();
  const presentIds = new Set(targets.map((target) => target.id));
  for (const id of listeners.keys()) if (!presentIds.has(id)) listeners.delete(id);
  for (const target of targets) {
    const previous = listeners.get(target.id);
    const reached = waves.some((wave) => Math.hypot(target.x - wave.x, target.y - wave.y) <= (now - wave.time) / 1000 * CHRIS_WAVE_SPEED);
    if (previous || reached) listeners.set(target.id, { ...target, heardAt: previous?.heardAt ?? now });
  }
}

export function chrisAudienceLean(id: string, now = performance.now()): number {
  const listener = listeners.get(id);
  if (!isChrisPowerActive(now) || !listener) return 0;
  const direction = Math.sign(singer.x - listener.x);
  const arrival = Math.max(0, 1 - (now - listener.heardAt) / 450);
  return direction * 0.12 + Math.sin(chrisPowerElapsed(now) / 160 + listener.x) * 0.04 + direction * arrival * 0.12;
}

export const getChrisSinger = () => singer as Readonly<typeof singer>;
export const getChrisListeners = (): readonly ChrisListener[] => [...listeners.values()];
export const getChrisWaves = (): readonly VoiceWave[] => waves;
