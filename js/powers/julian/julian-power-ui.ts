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
  if (!isJulianPowerActive(now)) { if (panel && !panel.hidden) panel.hidden = true; return; }
  if (!panel) createPanel();
  if (panel!.hidden) panel!.hidden = false;
  const ready = isJulianDemonPresent(now);
  const chosen = getJulianChoice() !== null;
  const target = julianNearestTarget();
  const nextTitle = ready ? `One bargain · ${julianDemonSecondsLeft(now).toFixed(1)}s` : julianElapsed(now) < JULIAN_DEMON_DELAY ? 'Something is coming…' : 'The demon has departed';
  if (title.textContent !== nextTitle) title.textContent = nextTitle;
  const nextMessage = chosen ? getJulianVerdict() : 'One answer OR one execution. Your choice.';
  if (message.textContent !== nextMessage) message.textContent = nextMessage;
  const hidden = chosen || (!ready && julianElapsed(now) >= JULIAN_DEMON_DELAY);
  if (ask.hidden !== hidden) ask.hidden = hidden;
  if (execute.hidden !== hidden) execute.hidden = hidden;
  if (ask.disabled !== !ready) ask.disabled = !ready;
  const disabled = !ready || !target;
  if (execute.disabled !== disabled) execute.disabled = disabled;
  const label = target ? `Execute ${julianTargetName(target.id)}` : 'No character nearby';
  if (execute.textContent !== label) execute.textContent = label;
}
