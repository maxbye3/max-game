import type { GiftItem } from './inventory-gifts.js';

export const ED_POWER_DURATION = 10_000;
export const ED_POWER_REVEAL = 'Ed’s Halstead tattoo lit up. Conversations during those 10 seconds charged the matching gifts, doubling their strength and duration.';
const POWER_END_KEY = 'max-game:ed-power-end';
const CHARGED_GIFTS_KEY = 'max-game:ed-charged-gifts';
const ELIGIBLE_GIFTS = new Set(['helen-item', 'niall-item', 'tim-item']);

function readPowerEnd(): number {
  try { return Number(window.sessionStorage.getItem(POWER_END_KEY)) || 0; }
  catch { return 0; }
}

function readChargedGifts(): string[] {
  try {
    const ids: unknown = JSON.parse(window.localStorage.getItem(CHARGED_GIFTS_KEY) ?? '[]');
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

function writeChargedGifts(ids: string[]): void {
  try { window.localStorage.setItem(CHARGED_GIFTS_KEY, JSON.stringify(ids)); }
  catch { /* Gifts still work without browser storage. */ }
}

export function activateEdPower(now = Date.now()): void {
  try { window.sessionStorage.setItem(POWER_END_KEY, String(now + ED_POWER_DURATION)); }
  catch { powerEndFallback = now + ED_POWER_DURATION; }
  showHalsteadTattoo('Max');
}

let powerEndFallback = 0;

export function edPowerSecondsLeft(now = Date.now()): number {
  return Math.max(0, (Math.max(readPowerEnd(), powerEndFallback) - now) / 1000);
}

export function chargeEdGift(item: GiftItem): boolean {
  if (edPowerSecondsLeft() === 0 || !ELIGIBLE_GIFTS.has(item.id)) return false;
  const ids = readChargedGifts();
  if (!ids.includes(item.id)) writeChargedGifts([...ids, item.id]);
  return true;
}

export function isEdGiftCharged(item: GiftItem): boolean {
  return readChargedGifts().includes(item.id);
}

export function clearEdGiftCharge(item: GiftItem): void {
  writeChargedGifts(readChargedGifts().filter((id) => id !== item.id));
}

export function showHalsteadTattoo(name: 'Max' | 'Helen' | 'Niall' | 'Tim'): void {
  if (edPowerSecondsLeft() === 0 && name !== 'Max') return;
  const shell = document.querySelector<HTMLElement>('.game-shell');
  if (!shell) return;
  shell.querySelector('.halstead-tattoo-reveal')?.remove();
  const reveal = document.createElement('div');
  reveal.className = 'halstead-tattoo-reveal';
  reveal.setAttribute('role', 'status');
  const tattoo = document.createElement('span');
  tattoo.className = 'halstead-tattoo-mark';
  tattoo.setAttribute('aria-hidden', 'true');
  const caption = document.createElement('span');
  caption.textContent = `${name} shows their Halstead tattoo`;
  reveal.append(tattoo, caption);
  shell.append(reveal);
  window.setTimeout(() => reveal.remove(), 2100);
}

export function drawEdPower(context: CanvasRenderingContext2D, playerX: number, playerY: number, now = Date.now()): void {
  const remaining = edPowerSecondsLeft(now);
  if (remaining === 0) return;
  const elapsed = ED_POWER_DURATION / 1000 - remaining;
  context.save();
  context.imageSmoothingEnabled = false;
  context.fillStyle = 'rgba(15, 73, 55, 0.10)';
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  for (let ring = 0; ring < 3; ring += 1) {
    const radius = 23 + ring * 16 + (elapsed * 22) % 16;
    context.globalAlpha = (0.75 - ring * 0.18) * Math.min(1, remaining * 2);
    context.fillStyle = ring === 0 ? '#ecfa9b' : '#73ffcf';
    for (let point = 0; point < 48; point += 1) {
      const angle = point * Math.PI / 24 + elapsed * (ring % 2 ? -1 : 1);
      context.fillRect(Math.round(playerX + Math.cos(angle) * radius), Math.round(playerY - 16 + Math.sin(angle) * radius * 0.43), 3, 3);
    }
  }
  context.restore();
}
