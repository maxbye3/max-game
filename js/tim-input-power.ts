export const TIM_INPUT_POWER_DURATION = 10_000;
export interface TimStep { readonly x: number; readonly y: number; readonly at: number; readonly reverse: boolean }
let startedAt = Infinity;
let lastStep: { x: number; y: number } | null = null;
const steps: TimStep[] = [];
let intent = { x: 0, y: 0 };
let stepNumber = 0;
export const isTimInputPowerActive = (now = performance.now()): boolean => now >= startedAt && now < startedAt + TIM_INPUT_POWER_DURATION;
export const timInputPowerSecondsLeft = (now = performance.now()): number => isTimInputPowerActive(now) ? (startedAt + TIM_INPUT_POWER_DURATION - now) / 1000 : 0;
export function activateTimInputPower(now = performance.now()): void {
  startedAt = now;
  lastStep = null;
  steps.length = 0;
  stepNumber = 0;
  intent = { x: 0, y: 0 };
}
export function timInputVector(x: number, y: number, now = performance.now()): { readonly x: number; readonly y: number } {
  if (!isTimInputPowerActive(now)) return { x, y };
  const length = Math.hypot(x, y) || 1;
  intent = { x: x / length, y: y / length };
  return { x: x === 0 ? 0 : -x, y: y === 0 ? 0 : -y };
}
/** Visual intensity follows the same real-time deadline as controls and music. */
export function timPowerVisualState(now = performance.now()): { elapsed: number; intensity: number; intentX: number; intentY: number } | null {
  if (!isTimInputPowerActive(now)) return null;
  const elapsed = now - startedAt;
  const intensity = Math.min(1, elapsed / 300, (TIM_INPUT_POWER_DURATION - elapsed) / 500);
  return { elapsed, intensity, intentX: intent.x, intentY: intent.y };
}
export function updateTimInputWorld(now: number, x: number, y: number): void {
  if (!isTimInputPowerActive(now)) { steps.length = 0; lastStep = null; return; }
  if (lastStep && Math.hypot(x - lastStep.x, y - lastStep.y) > 7) {
    steps.push({ x, y, at: now, reverse: stepNumber++ % 2 === 0 }); lastStep = { x, y };
  } else if (!lastStep) lastStep = { x, y };
  while (steps.length && now - steps[0]!.at >= 1500) steps.shift();
}
export function getTimInputSteps(now = performance.now()): readonly TimStep[] { return isTimInputPowerActive(now) ? steps : []; }
export const timInputPowerReveal = (): string => "Tim's item dragged Max opposite to every direction you pressed for ten seconds. Max split into rubbery mirror doubles, people twisted into backwards echoes, and the landscape fractured into inverted windows with arrows flowing against your inputs. The contradiction collapsed and normal controls returned when the theme ended.";
