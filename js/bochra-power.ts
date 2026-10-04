export const BOCHRA_POWER_DURATION = 10_000;
export const BOCHRA_POWER_REVEAL = "Bochra's power: every step became a dance move! You bounced, slid and left glowing footsteps with a rhythmic speed boost. The world became a disco floor, nearby characters joined the choreography, and a mirror ball swept the scene with coloured spotlights. The party lasted ten seconds.";

export interface BochraDancer { readonly id: string; readonly x: number; readonly y: number; readonly height: number }
interface DanceStep { readonly x: number; readonly y: number; readonly time: number; readonly side: number }
let startedAt = Infinity;
let endsAt = 0;
let lastPosition: { x: number; y: number } | null = null;
let lastStepAt = -Infinity;
let stepCount = 0;
const dancers = new Map<string, BochraDancer>();
const steps: DanceStep[] = [];
const stage = { x: 0, y: 0, moving: false };

export function activateBochraPower(now = performance.now()): void {
  startedAt = now;
  endsAt = now + BOCHRA_POWER_DURATION;
  lastPosition = null;
  lastStepAt = -Infinity;
  stepCount = 0;
  dancers.clear();
  steps.length = 0;
  stage.moving = false;
}

export const isBochraPowerActive = (now = performance.now()): boolean => now >= startedAt && now < endsAt;
export const bochraPowerSecondsLeft = (now = performance.now()): number => isBochraPowerActive(now) ? (endsAt - now) / 1000 : 0;
export const bochraBeat = (now: number): number => Math.max(0, now - startedAt) / 1000 * (116 / 60) * Math.PI * 2;
export const bochraMovementMultiplier = (now = performance.now()): number => isBochraPowerActive(now) ? 1.25 + 0.12 * (1 + Math.sin(bochraBeat(now))) / 2 : 1;

export function updateBochraWorld(now: number, x: number, y: number, targets: readonly BochraDancer[]): void {
  if (!isBochraPowerActive(now)) {
    dancers.clear();
    steps.length = 0;
    lastPosition = null;
    stage.moving = false;
    return;
  }
  stage.x = x;
  stage.y = y;
  stage.moving = lastPosition !== null && Math.hypot(x - lastPosition.x, y - lastPosition.y) > 0.01;
  lastPosition = { x, y };
  dancers.clear();
  targets.filter((target) => Math.hypot(target.x - x, target.y - y) < 480)
    .slice(0, 24).forEach((target) => dancers.set(target.id, target));
  while (steps.length && now - (steps[0]?.time ?? now) > 1400) steps.shift();
  if (stage.moving && now - lastStepAt >= 120) {
    steps.push({ x, y, time: now, side: stepCount++ % 2 === 0 ? -1 : 1 });
    lastStepAt = now;
  }
}

export function bochraDancePose(id: string, now = performance.now()): { x: number; y: number; rotation: number; stretch: number } {
  if (!isBochraPowerActive(now) || (id === 'player' ? !stage.moving : !dancers.has(id))) {
    return { x: 0, y: 0, rotation: 0, stretch: 1 };
  }
  const phase = id === 'player' ? 0 : [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7;
  const beat = bochraBeat(now) + phase;
  return { x: Math.sin(beat) * 7, y: -Math.abs(Math.sin(beat)) * 9, rotation: Math.sin(beat / 2) * 0.22, stretch: 1 + Math.sin(beat * 2) * 0.07 };
}

// Rendering gets read-only views; movement and collision coordinates never change.
export const getBochraStage = () => stage as Readonly<typeof stage>;
export const getBochraDancers = (): readonly BochraDancer[] => [...dancers.values()];
export const getBochraSteps = (): readonly DanceStep[] => steps;
