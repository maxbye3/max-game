import { requireElement } from '../../core/elements.js';

export function animateDamage(selector: string, amount: number): void {
  if (!amount) return;
  const indicator = requireElement<HTMLElement>(selector);
  indicator.textContent = `-${amount}`;
  indicator.hidden = false;
  indicator.classList.remove('fly-away');
  void indicator.offsetWidth;
  indicator.classList.add('fly-away');
}

export function clearDamageAnimations(): void {
  document.querySelectorAll<HTMLElement>('.battle-damage').forEach((indicator) => {
    indicator.hidden = true;
    indicator.classList.remove('fly-away');
  });
}

