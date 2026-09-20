import { ANDY_DIALOGUE_LINES } from './andy-dialogue.js';
import { addGift, ANDY_ITEM, PORTABLE_WALKMAN } from './inventory-gifts.js';

type AndyDialogueStage = 'none' | 'askMusic' | 'giveItem' | 'giveWalkman';

export class MusicHouseDialogueController {
  private andyStage: AndyDialogueStage = 'none';
  private andyDialogueIndex = 0;
  private readonly options = document.querySelector<HTMLElement>('#music-dialogue-options');

  constructor(
    private readonly line: HTMLElement,
    private readonly nextButton: HTMLButtonElement,
    private readonly progress: HTMLElement,
    private readonly confirmation: HTMLElement,
  ) {
    document.querySelector<HTMLButtonElement>('#music-yes')?.addEventListener('click', () => this.giveAndyItem());
    document.querySelector<HTMLButtonElement>('#music-no')?.addEventListener('click', () => this.giveAndyItem());
  }

  start(kind: 'andy' | 'aliya'): void {
    this.andyStage = kind === 'andy' ? 'askMusic' : 'none';
    if (kind === 'andy') {
      const lineIndex = this.andyDialogueIndex;
      this.andyDialogueIndex = (lineIndex + 1) % ANDY_DIALOGUE_LINES.length;
      this.line.textContent = ANDY_DIALOGUE_LINES[lineIndex] ?? '';
      this.progress.textContent = `${lineIndex + 1}/${ANDY_DIALOGUE_LINES.length}`;
      this.progress.hidden = false;
    } else {
      this.line.textContent = "When is Andy done? It's my turn to DJ.";
      this.progress.hidden = true;
    }
    this.confirmation.hidden = true;
    this.nextButton.hidden = kind !== 'andy';
    if (this.options) this.options.hidden = true;
  }

  next(): void {
    if (this.andyStage === 'askMusic') {
      this.andyStage = 'giveItem';
      this.line.textContent = "Would you like to hear Max's music?";
      this.progress.hidden = true;
      this.nextButton.hidden = true;
      if (this.options) this.options.hidden = false;
      return;
    }
    if (this.andyStage === 'giveWalkman') this.giveWalkman();
  }

  stop(): void {
    this.andyStage = 'none';
    if (this.options) this.options.hidden = true;
  }

  private giveAndyItem(): void {
    if (this.andyStage !== 'giveItem') return;
    this.andyStage = 'giveWalkman';
    const received = addGift(ANDY_ITEM);
    this.line.textContent = 'Here, take this.';
    this.confirmation.textContent = received
      ? "Andy's item was added to your inventory!"
      : "You already have Andy's item.";
    this.confirmation.hidden = false;
    this.nextButton.hidden = false;
    if (this.options) this.options.hidden = true;
  }

  private giveWalkman(): void {
    if (this.andyStage !== 'giveWalkman') return;
    this.andyStage = 'none';
    const received = addGift(PORTABLE_WALKMAN);
    this.line.textContent = 'Here, take this.';
    this.confirmation.textContent = received
      ? 'A portable walkman was added to your inventory! You can now play music!'
      : 'You already have a portable walkman. You can play music!';
    this.confirmation.hidden = false;
    this.nextButton.hidden = true;
    if (this.options) this.options.hidden = true;
  }
}
