export const JU_POWER_DURATION = 10_000;
export const JU_POWER_REVEAL = "Ju's power: FANTASTIC VIBES turned you into a floating, radiant party magnet with a faster stride. Your amulet sent rainbow pulses across the landscape and swept nearby characters into a dancing procession. Its curse summoned a shadow that followed you: four short possessions reversed your controls, slowed your movement and dragged the world into a haunted, sluggish mirror realm. The amulet, shadow, procession and curse all vanished after ten seconds.";
const CYCLE_DURATION = 2500;
const CURSE_START = 1700;
const CURSE_END = 2400;

export interface JuTarget { readonly id: string; readonly x: number; readonly y: number; readonly height: number }
interface JuReveller extends JuTarget { readonly reachedAt: number }
interface VibePulse { readonly x: number; readonly y: number; readonly time: number }
interface VibeStep extends VibePulse { readonly side: number }
let startedAt = Infinity;
let endsAt = 0;
let lastUpdatedAt = 0;
let lastPulseAt = -Infinity;
let lastStepAt = -Infinity;
let previousPosition: { x: number; y: number } | null = null;
let stepNumber = 0;
const revellers = new Map<string, JuReveller>();
const pulses: VibePulse[] = [];
const steps: VibeStep[] = [];
const protagonist = { x: 0, y: 0 };
const shadow = { x: 0, y: 0 };

export function activateJuPower(now = performance.now()): void {
  startedAt = now; endsAt = now + JU_POWER_DURATION;
  lastUpdatedAt = now; lastPulseAt = -Infinity; lastStepAt = -Infinity;
  previousPosition = null; stepNumber = 0;
  revellers.clear(); pulses.length = 0; steps.length = 0;
}
export const isJuPowerActive = (now = performance.now()): boolean => now >= startedAt && now < endsAt;
export const juPowerSecondsLeft = (now = performance.now()): number => isJuPowerActive(now) ? (endsAt - now) / 1000 : 0;
export const juPowerElapsed = (now: number): number => Math.max(0, now - startedAt);
export const isJuCurseBeat = (now = performance.now()): boolean => isJuPowerActive(now) && juPowerElapsed(now) % CYCLE_DURATION >= CURSE_START && juPowerElapsed(now) % CYCLE_DURATION < CURSE_END;
export const juMovementMultiplier = (now = performance.now()): number => isJuPowerActive(now) ? isJuCurseBeat(now) ? 0.65 : 1.65 : 1;
export const juInputVector = (x: number, y: number, now = performance.now()): { x: number; y: number } => isJuCurseBeat(now) ? { x: -x, y: -y } : { x, y };
export const juVisualStrength = (now: number): number => isJuPowerActive(now) ? Math.min(1, juPowerElapsed(now) / 220, juPowerSecondsLeft(now) * 4) : 0;
export const juCurseStrength = (now: number): number => isJuCurseBeat(now) ? Math.sin((juPowerElapsed(now) % CYCLE_DURATION - CURSE_START) / (CURSE_END - CURSE_START) * Math.PI) : 0;

/** Integrate each possession window exactly, including frames that cross its edges. */
export function juWorldDeltaTime(deltaTime: number, now: number): number {
  let cursedTime = 0;
  for (let cycle = 0; cycle < JU_POWER_DURATION / CYCLE_DURATION; cycle++) {
    const start = startedAt + cycle * CYCLE_DURATION + CURSE_START;
    const end = startedAt + cycle * CYCLE_DURATION + CURSE_END;
    cursedTime += Math.max(0, Math.min(now, end) - Math.max(now - deltaTime * 1000, start)) / 1000;
  }
  return Math.max(0, deltaTime - cursedTime * 0.8);
}

export function updateJuWorld(now: number, x: number, y: number, targets: readonly JuTarget[]): void {
  if (!isJuPowerActive(now)) { revellers.clear(); pulses.length = 0; steps.length = 0; previousPosition = null; return; }
  protagonist.x = x; protagonist.y = y;
  const deltaTime = Math.min(0.05, Math.max(0, now - lastUpdatedAt) / 1000);
  lastUpdatedAt = now;
  if (!previousPosition) { shadow.x = x - 65; shadow.y = y + 45; }
  const distance = Math.hypot(x - shadow.x, y - shadow.y);
  const chase = Math.min(distance, deltaTime * (isJuCurseBeat(now) ? 155 : 55));
  if (distance > 0) { shadow.x += (x - shadow.x) / distance * chase; shadow.y += (y - shadow.y) / distance * chase; }
  if (now - lastPulseAt >= 650) { pulses.push({ x, y, time: now }); lastPulseAt = now; }
  const moved = previousPosition !== null && Math.hypot(x - previousPosition.x, y - previousPosition.y) > 0.01;
  if (moved && now - lastStepAt >= 150) {
    steps.push({ x, y, time: now, side: stepNumber++ % 2 ? 1 : -1 }); lastStepAt = now;
  }
  previousPosition = { x, y };
  while (pulses.length && now - (pulses[0]?.time ?? now) > 3200) pulses.shift();
  while (steps.length && now - (steps[0]?.time ?? now) > 2200) steps.shift();
  const present = new Set(targets.map((target) => target.id));
  for (const id of revellers.keys()) if (!present.has(id)) revellers.delete(id);
  for (const target of targets) {
    const previous = revellers.get(target.id);
    const reached = pulses.some((pulse) => Math.hypot(target.x - pulse.x, target.y - pulse.y) <= (now - pulse.time) * 0.45);
    if (previous || reached) revellers.set(target.id, { ...target, reachedAt: previous?.reachedAt ?? now });
  }
}

export function juCharacterPose(id: string, now: number): { x: number; lift: number; lean: number } {
  const reveller = revellers.get(id);
  if (!isJuPowerActive(now) || (id !== 'player' && !reveller)) return { x: 0, lift: 0, lean: 0 };
  const phase = [...id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const elapsed = juPowerElapsed(now);
  const arrival = id === 'player' ? 1 : Math.min(1, (now - (reveller?.reachedAt ?? now)) / 240);
  const cursed = isJuCurseBeat(now);
  const fade = juVisualStrength(now) * arrival;
  return {
    x: Math.sin(elapsed / (cursed ? 65 : 220) + phase) * (cursed ? 4 : 7) * fade,
    lift: (cursed ? 2 + Math.abs(Math.sin(elapsed / 70)) * 3 : 7 + Math.sin(elapsed / 220 + phase) * 4) * fade,
    lean: Math.sin(elapsed / (cursed ? 65 : 220) + phase) * (cursed ? 0.2 : 0.1) * fade,
  };
}
export const getJuProtagonist = () => protagonist as Readonly<typeof protagonist>;
export const getJuShadow = () => shadow as Readonly<typeof shadow>;
export const getJuRevellers = (): readonly JuReveller[] => [...revellers.values()];
export const getJuPulses = (): readonly VibePulse[] => pulses;
export const getJuSteps = (): readonly VibeStep[] => steps;
