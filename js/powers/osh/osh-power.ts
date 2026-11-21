export const OSH_POWER_DURATION = 30_000;
let startedAt = Infinity;
let prayerCount = 0;
let blessed = false;

export function activateOshPower(now = performance.now()): void {
  startedAt = now;
  prayerCount = 0;
  blessed = false;
}

export const isOshPowerActive = (now = performance.now()): boolean => now >= startedAt && now < startedAt + OSH_POWER_DURATION;
export const oshPowerSecondsLeft = (now = performance.now()): number => isOshPowerActive(now) ? (startedAt + OSH_POWER_DURATION - now) / 1000 : 0;
export const hasOshBlessing = (now = performance.now()): boolean => isOshPowerActive(now) && blessed;

const answers = [
  'GOD: You are here to explore. Knock on doors, meet people, and be kind. Even to the weird ones.',
  'GOD: Yes, I can hear you. No, I do not know where you left your keys. Try the other pocket.',
  'GOD: The meaning of life? Start with a good cup of tea and a conversation. The rest can wait.',
] as const;

export function askGod(blessing = false, now = performance.now()): string | null {
  if (!isOshPowerActive(now)) return null;
  if (blessing) {
    blessed = true;
    return 'GOD: Consider yourself blessed. Go forth and sparkle. The hat is temporary; kindness is yours to keep.';
  }
  return answers[prayerCount++ % answers.length]!;
}
