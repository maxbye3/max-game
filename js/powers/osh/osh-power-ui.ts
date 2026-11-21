import { askGod, isOshPowerActive } from './osh-power.js';

let panel: HTMLElement | null = null;
let conversation: HTMLElement;
let message: HTMLElement;
let toggle: HTMLButtonElement;

function createPrayerPanel(): void {
  panel = document.createElement('section');
  panel.className = 'osh-prayer';
  panel.setAttribute('aria-label', 'Speak to God');
  toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = 'Speak to God';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'osh-prayer-conversation');
  conversation = document.createElement('div');
  conversation.id = 'osh-prayer-conversation';
  conversation.hidden = true;
  message = document.createElement('p');
  message.setAttribute('role', 'status');
  message.textContent = 'GOD: New Pope? Nice hat. What would you like to ask?';
  toggle.addEventListener('click', () => {
    conversation.hidden = !conversation.hidden;
    toggle.setAttribute('aria-expanded', String(!conversation.hidden));
  });
  const actions = document.createElement('div');
  for (const [label, blessing] of [['Ask a question', false], ['Ask for a blessing', true]] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      const answer = askGod(blessing);
      if (answer) message.textContent = answer;
    });
    actions.append(button);
  }
  conversation.append(message, actions);
  panel.append(toggle, conversation);
  document.body.append(panel);
}

export function updateOshPowerUi(now: number): void {
  const active = isOshPowerActive(now);
  if (!active) {
    if (panel && !panel.hidden) {
      if (panel.contains(document.activeElement)) document.querySelector<HTMLButtonElement>('#inventory-toggle')?.focus();
      panel.hidden = true;
      conversation.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }
    return;
  }
  if (!panel) createPrayerPanel();
  if (panel!.hidden) {
    message.textContent = 'GOD: New Pope? Nice hat. What would you like to ask?';
    panel!.hidden = false;
  }
}
