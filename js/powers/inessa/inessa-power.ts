export const INESSA_POWER_DURATION = 15_000;
let startedAt = Infinity;

export function activateInessaPower(now = performance.now()): void {
  startedAt = now;
}

export const isInessaPowerActive = (now = performance.now()): boolean => now >= startedAt && now < startedAt + INESSA_POWER_DURATION;
export const inessaPowerSecondsLeft = (now = performance.now()): number => isInessaPowerActive(now) ? (startedAt + INESSA_POWER_DURATION - now) / 1000 : 0;

const phrases = [
  'Привет! Хочешь пузырьковый чай?',
  'Как дела? Давай поговорим!',
  'Какой прекрасный день! Пойдём гулять?',
  'Не спеши. У меня для тебя кое-что есть.',
  'Добро пожаловать! Очень приятно тебя видеть.',
  'Спасибо за компанию! До скорой встречи.',
] as const;

/** The tea gives each line a Russian greeting; the original remains as a subtitle. */
export function inessaRussianLine(original: string): string {
  let hash = 0;
  for (const letter of original) hash = (hash * 31 + letter.charCodeAt(0)) >>> 0;
  return phrases[hash % phrases.length]!;
}
