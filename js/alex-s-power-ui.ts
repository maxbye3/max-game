import { alexSPowerSecondsLeft, alexSToastLine, getAlexResurrection, RESURRECTION_CHARACTERS, type ResurrectionCharacter } from './alex-s-power.js';
import { releaseAllInput } from './input.js';
import { setProfileImage } from './profile-images.js';
import { resolveSiteAsset } from './site-assets.js';

let choice: HTMLElement | null = null;
let dialogue: HTMLElement | null = null;
let talk: HTMLButtonElement;
let speaker: HTMLElement;
let line: HTMLElement;
let progress: HTMLElement;
let portrait: HTMLImageElement;
let selector: HTMLSelectElement;
let cast: (() => void) | null = null;
let lineIndex = 0;

export const isAlexResurrectionUiBlocking = (): boolean => !!(choice && !choice.hidden);

function prepareDialogue(): void {
  window.dispatchEvent(new Event('max-game:world-interaction-opened'));
  releaseAllInput();
  window.dispatchEvent(new Event('max-game:alex-s-dialogue'));
}

function closeDialogue(): void {
  if (dialogue) dialogue.hidden = true;
  releaseAllInput();
}

function closeChoice(): void {
  if (choice) choice.hidden = true;
  cast = null;
  releaseAllInput();
}

function showLine(): void {
  line.textContent = alexSToastLine(lineIndex);
}

export function openAlexToastDialogue(): void {
  const character = getAlexResurrection();
  if (!character) return;
  createUi();
  prepareDialogue();
  speaker.textContent = character.name;
  setProfileImage(portrait, character.name);
  if (!portrait.hidden) portrait.src = resolveSiteAsset(portrait.getAttribute('src')!);
  lineIndex = 0;
  showLine();
  dialogue!.hidden = false;
}

function createUi(): void {
  if (choice) return;
  const shell = document.querySelector<HTMLElement>('.game-shell')!;
  choice = document.createElement('section');
  choice.className = 'npc-dialogue alex-resurrection-choice'; choice.hidden = true;
  choice.setAttribute('aria-label', 'Choose a character to resurrect');
  choice.innerHTML = '<header class="npc-dialogue-header"><h2>Book of the Bread</h2><button class="npc-dialogue-close" type="button" aria-label="Cancel resurrection">×</button></header><p>Choose a character to bring back for twenty seconds.</p>';
  selector = document.createElement('select'); selector.setAttribute('aria-label', 'Character to resurrect');
  for (const character of RESURRECTION_CHARACTERS) {
    const option = document.createElement('option'); option.value = character.id; option.textContent = character.name;
    selector.append(option);
  }
  selector.value = 'mike';
  // Let the native picker handle arrows without the movement controller consuming them.
  selector.addEventListener('keydown', (event) => { if (event.key !== 'Escape') event.stopPropagation(); });
  const confirm = document.createElement('button'); confirm.type = 'button'; confirm.textContent = 'Resurrect';
  confirm.className = 'npc-dialogue-next'; confirm.addEventListener('click', () => cast?.());
  choice.querySelector('button')!.addEventListener('click', closeChoice);
  choice.append(selector, confirm);
  dialogue = document.createElement('section');
  dialogue.className = 'npc-dialogue alex-resurrection-dialogue'; dialogue.hidden = true;
  dialogue.setAttribute('aria-label', 'Resurrected character dialogue');
  dialogue.innerHTML = '<header class="npc-dialogue-header"><h2></h2><button class="npc-dialogue-close" type="button" aria-label="Close resurrected character dialogue">×</button></header><div class="dialogue-line-row"><img class="dialogue-profile" alt="" hidden><p></p></div><p class="alex-resurrection-countdown" role="status"></p>';
  speaker = dialogue.querySelector('h2')!; portrait = dialogue.querySelector('img')!;
  line = dialogue.querySelector('.dialogue-line-row p')!; progress = dialogue.querySelector('.alex-resurrection-countdown')!;
  dialogue.querySelector('button')!.addEventListener('click', closeDialogue);
  const next = document.createElement('button'); next.type = 'button'; next.className = 'npc-dialogue-next';
  next.textContent = '>'; next.setAttribute('aria-label', 'Next toast analogy');
  next.addEventListener('click', () => { lineIndex += 1; showLine(); }); dialogue.append(next);
  talk = document.createElement('button'); talk.type = 'button'; talk.className = 'npc-talk alex-resurrection-talk'; talk.hidden = true;
  talk.addEventListener('click', openAlexToastDialogue);
  shell.append(choice, dialogue, talk);
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') { closeChoice(); closeDialogue(); } });
  window.addEventListener('max-game:world-interaction-opened', () => { closeChoice(); closeDialogue(); });
}

export function openAlexResurrectionChoice(onCast: (character: ResurrectionCharacter) => void): void {
  createUi();
  prepareDialogue();
  closeDialogue();
  choice!.hidden = false;
  cast = () => {
    const character = RESURRECTION_CHARACTERS.find((candidate) => candidate.id === selector.value);
    if (!character) return;
    closeChoice();
    onCast(character);
  };
  selector.focus();
}

export function updateAlexResurrectionUi(): void {
  const character = getAlexResurrection();
  if (!character) {
    if (dialogue && !dialogue.hidden) closeDialogue();
    if (talk && !talk.hidden) talk.hidden = true;
    return;
  }
  createUi();
  const label = `Talk to ${character.name}'s toast spirit`;
  if (talk.textContent !== label) talk.textContent = label;
  talk.hidden = !dialogue!.hidden || !choice!.hidden;
  if (!dialogue!.hidden) {
    const remaining = `${Math.ceil(alexSPowerSecondsLeft())}s until the toast grows cold`;
    if (progress.textContent !== remaining) progress.textContent = remaining;
  }
}
