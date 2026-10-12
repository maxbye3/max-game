export const DAN_POWER_DURATION = 10_000;
export const DAN_POWER_REVEAL = "Dan's power: the Disco Ball Riot Helmet locked you into Bangface TV, Channel 2. You were incapacitated for ten seconds while the visor broadcast spilled into the world: mirror-ball lasers, a live rave screen, frantic dancers and a world running at three times its usual pace. When the broadcast ended, the helmet vanished and you could move again.";

export interface DanRaver { readonly id: string; readonly x: number; readonly y: number; readonly height: number }
let startedAt = Infinity;
let endsAt = 0;
let ravers: readonly DanRaver[] = [];
const wearer = { x: 0, y: 0 };

export function activateDanPower(now = performance.now()): void {
  startedAt = now;
  endsAt = now + DAN_POWER_DURATION;
  ravers = [];
}

export const isDanPowerActive = (now = performance.now()): boolean => now >= startedAt && now < endsAt;
export const danPowerSecondsLeft = (now = performance.now()): number => isDanPowerActive(now) ? (endsAt - now) / 1000 : 0;
export const danPowerElapsed = (now: number): number => Math.max(0, now - startedAt);

/** The wearer cannot move while the surrounding broadcast rushes forward. */
export function danWorldDeltaTime(deltaTime: number, now: number): number {
  const overlap = Math.max(0, Math.min(now, endsAt) - Math.max(now - deltaTime * 1000, startedAt)) / 1000;
  return deltaTime + overlap * 2;
}

export function updateDanWorld(now: number, x: number, y: number, targets: readonly DanRaver[]): void {
  if (!isDanPowerActive(now)) { ravers = []; return; }
  wearer.x = x;
  wearer.y = y;
  ravers = targets.filter((target) => Math.hypot(target.x - x, target.y - y) < 600).slice(0, 28);
}

export function danRiotPose(id: string, now = performance.now()): { rotation: number; bounce: number } {
  if (!isDanPowerActive(now) || (id !== 'player' && !ravers.some((raver) => raver.id === id))) {
    return { rotation: 0, bounce: 0 };
  }
  const elapsed = danPowerElapsed(now);
  if (id === 'player') return { rotation: Math.sin(elapsed / 210) * 0.025, bounce: 0 };
  const phase = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return { rotation: Math.sin(elapsed / 95 + phase) * 0.28, bounce: Math.abs(Math.sin(elapsed / 130 + phase)) * 9 };
}

export const getDanWearer = () => wearer as Readonly<typeof wearer>;
export const getDanRavers = (): readonly DanRaver[] => ravers;
