import { chooseJulianBargain, getJulianChoice, getJulianVerdict, isJulianPowerActive, isJulianDemonPresent, julianDemonSecondsLeft, julianElapsed, julianNearestTarget, julianTargetName, JULIAN_DEMON_DELAY } from './julian-power.js';

let panel: HTMLElement | null = null;
let title: HTMLElement;
let message: HTMLElement;
let ask: HTMLButtonElement;
let execute: HTMLButtonElement;

function createPanel(): void {
  panel = document.createElement('section');
  panel.className = 'julian-bargain'; panel.setAttribute('aria-label', 'Rubber Duckie Demon bargain');
  title = document.createElement('strong');
  message = document.createElement('p'); message.setAttribute('role', 'status');
  ask = document.createElement('button'); ask.type = 'button'; ask.textContent = "Ask: who's nearest?";
  execute = document.createElement('button'); execute.type = 'button';
  ask.addEventListener('click', () => { chooseJulianBargain('answer'); updateJulianPowerUi(performance.now()); });
  execute.addEventListener('click', () => { chooseJulianBargain('execution'); updateJulianPowerUi(performance.now()); });
  panel.append(title, message, ask, execute); document.body.append(panel);
}

export function updateJulianPowerUi(now: number): void {
  if (!isJulianPowerActive(now)) { if (panel) panel.hidden = true; return; }
  if (!panel) createPanel();
  panel!.hidden = false;
  const ready = isJulianDemonPresent(now);
  const chosen = getJulianChoice() !== null;
  const target = julianNearestTarget();
  title.textContent = ready ? `One bargain · ${julianDemonSecondsLeft(now).toFixed(2)}s` : julianElapsed(now) < JULIAN_DEMON_DELAY ? 'Something is coming…' : 'The demon has departed';
  const nextMessage = chosen ? getJulianVerdict() : 'One answer OR one execution. Your choice.';
  if (message.textContent !== nextMessage) message.textContent = nextMessage;
  ask.hidden = execute.hidden = chosen || (!ready && julianElapsed(now) >= JULIAN_DEMON_DELAY);
  ask.disabled = !ready; execute.disabled = !ready || !target;
  execute.textContent = target ? `Execute ${julianTargetName(target.id)}` : 'No character nearby';
}
