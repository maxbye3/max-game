import { readStorage, writeStorage } from './storage.js';

const DOUGHNUT_KEY = 'max-game:alex-w:eatenDoughnut';
if (readStorage(DOUGHNUT_KEY) === null) writeStorage(DOUGHNUT_KEY, 'false');

export const hasAlexEatenDoughnut = (): boolean => readStorage(DOUGHNUT_KEY) === 'true';
export function setAlexEatenDoughnut(eatenDoughnut: boolean): void {
  writeStorage(DOUGHNUT_KEY, String(eatenDoughnut));
}
