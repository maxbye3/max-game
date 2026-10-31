export const TATTOO_DURATION = 10_000;
export const TATTOO_WIDTH = 420;
export const TATTOO_HEIGHT = 320;
export interface TattooPoint { readonly x: number; readonly y: number }
// Angular lettering and mirrored tribal barbs, sized for a phone screen.
const LETTERS: Readonly<Record<string, readonly number[][]>> = {
  H: [[0, 0, 0, 1], [1, 0, 1, 1], [0, .5, 1, .5]],
  A: [[0, 1, .5, 0, 1, 1], [.2, .6, .8, .6]],
  L: [[0, 0, 0, 1, 1, 1]],
  S: [[1, 0, 0, 0, 0, .5, 1, .5, 1, 1, 0, 1]],
  T: [[0, 0, 1, 0], [.5, 0, .5, 1]],
  E: [[1, 0, 0, 0, 0, 1, 1, 1], [0, .5, .8, .5]],
  D: [[0, 0, 0, 1, .65, 1, 1, .8, 1, .2, .65, 0, 0, 0]],
};
const lettering = [...'HALSTEAD'].flatMap((letter, index) => LETTERS[letter]!.map((path) =>
  Array.from({ length: path.length / 2 }, (_, point) => ({ x: 143 + index * 27 + path[point * 2]! * 20, y: 190 + path[point * 2 + 1]! * 31 })),
));
const barbs: readonly TattooPoint[][] = [
  [{ x: 133, y: 184 }, { x: 155, y: 161 }, { x: 147, y: 163 }, { x: 182, y: 148 }, { x: 172, y: 165 }, { x: 211, y: 157 }, { x: 197, y: 176 }, { x: 230, y: 170 }, { x: 246, y: 183 }],
  [{ x: 135, y: 231 }, { x: 162, y: 249 }, { x: 154, y: 235 }, { x: 192, y: 253 }, { x: 182, y: 237 }, { x: 221, y: 246 }, { x: 246, y: 264 }],
];
export const TATTOO_STENCIL: readonly (readonly TattooPoint[])[] = [
  ...lettering, ...barbs, ...barbs.map((path) => path.map(({ x, y }) => ({ x: 492 - x, y }))),
];

const distance = (a: TattooPoint, b: TattooPoint): number => Math.hypot(a.x - b.x, a.y - b.y);
function samples(from: TattooPoint, to: TattooPoint): TattooPoint[] {
  const count = Math.max(1, Math.ceil(distance(from, to) / 3));
  return Array.from({ length: count + 1 }, (_, index) => ({
    x: from.x + (to.x - from.x) * index / count,
    y: from.y + (to.y - from.y) * index / count,
  }));
}
const targetPoints = TATTOO_STENCIL.flatMap((path) => path.slice(1).flatMap((point, index) => samples(path[index]!, point)));

export class TattooGame {
  phase: 'ready' | 'drawing' | 'finished' = 'ready';
  readonly strokes: TattooPoint[][] = [];
  private deadline = 0;
  private stroke: TattooPoint[] | null = null;
  private readonly ink = new Map<string, TattooPoint>();

  start(now: number): void {
    this.strokes.length = 0;
    this.ink.clear();
    this.stroke = null;
    this.deadline = now + TATTOO_DURATION;
    this.phase = 'drawing';
  }

  secondsLeft(now: number): number {
    if (this.phase === 'ready') return TATTOO_DURATION / 1000;
    return this.phase === 'finished' ? 0 : Math.max(0, (this.deadline - now) / 1000);
  }

  update(now: number): void {
    if (this.phase === 'drawing' && now >= this.deadline) {
      this.phase = 'finished';
      this.lift();
    }
  }

  draw(point: TattooPoint, now: number): void {
    this.update(now);
    if (this.phase !== 'drawing' || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    // Leaving the arm lifts the needle; re-entry cannot join separate strokes.
    if (point.x < 108 || point.x > 384 || point.y < 142 || point.y > 272) {
      this.lift();
      return;
    }
    if (!this.stroke) {
      this.stroke = [];
      this.strokes.push(this.stroke);
    }
    const previous = this.stroke[this.stroke.length - 1] ?? point;
    for (const sample of samples(previous, point)) {
      this.ink.set(`${Math.round(sample.x / 4)},${Math.round(sample.y / 4)}`, sample);
    }
    this.stroke.push(point);
  }

  lift(): void { this.stroke = null; }

  result(): { score: number; coverage: number; accuracy: number } {
    const ink = [...this.ink.values()];
    const covered = targetPoints.filter((target) => ink.some((point) => distance(target, point) <= 9)).length;
    const neat = ink.filter((point) => targetPoints.some((target) => distance(target, point) <= 9)).length;
    const coverage = covered / targetPoints.length;
    const accuracy = ink.length ? neat / ink.length : 0;
    return { score: Math.round(100 * coverage * accuracy), coverage: Math.round(coverage * 100), accuracy: Math.round(accuracy * 100) };
  }
}
