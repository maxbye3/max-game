import { LUCY_DIALOGUE_LINES } from '../../generated/dialogues/lucy-dialogue.js';
import { addGift, hasGift, LUCY_ITEM, nextGiftLine } from '../../core/inventory-gifts.js';
import { PlantDiaryGalleryController } from '../../interiors/plant-diary-gallery.js';
import { nextDialogueVisitIndex } from '../../core/dialogue-visit.js';
import { characterAsset } from '../../core/character-assets.js';
import { hasAlexEatenDoughnut } from '../../core/alex-w-state.js';
import { isAlexPlayer } from '../../core/player-character.js';
import { webImageSource } from '../../core/web-images.js';

export class LucyController {
  readonly sprite = new Image();
  private lineIndex = 0;
  private dialogueLines: readonly string[] = LUCY_DIALOGUE_LINES;
  private pendingGiftLine: string | null = null;
  private pendingGiftItem = LUCY_ITEM;
  private pendingGiftConfirmation: string | null = null;
  private plantDiaryOfferPending = false;
  private readonly plantDiaryOptions = document.querySelector<HTMLElement>('#lucy-plant-diary-options');
  private readonly dialogue = document.querySelector<HTMLElement>('#noel-dialogue');
  private readonly plantDiary: PlantDiaryGalleryController;

  constructor(
    private readonly dialogueLine: HTMLElement,
    private readonly nextButton: HTMLButtonElement,
    private readonly dialogueProgress: HTMLElement,
    private readonly giftConfirmation: HTMLElement,
  ) {
    this.sprite.src = webImageSource(`../${characterAsset('lucy', 'avatar')}`);
    this.plantDiary = new PlantDiaryGalleryController(() => this.resumeDialogue());
    document.querySelector<HTMLButtonElement>('#lucy-plant-diary-yeh')?.addEventListener('click', () => {
      this.showPlantDiary();
    });
    document.querySelector<HTMLButtonElement>('#lucy-plant-diary-neh')?.addEventListener('click', () => this.resumeDialogue());
  }

  start(): void {
    const fedAlex = isAlexPlayer() && hasAlexEatenDoughnut();
    this.dialogueLines = fedAlex
      ? ["Now that you look less hungry you should look for my panda's friend in the journal!"]
      : LUCY_DIALOGUE_LINES;
    this.lineIndex = fedAlex ? 0 : nextDialogueVisitIndex('lucy', this.dialogueLines.length);
    const hasNewGift = !hasGift(this.pendingGiftItem);
    this.pendingGiftLine = hasNewGift ? nextGiftLine() : null;
    this.pendingGiftConfirmation = hasNewGift ? 'An item has been added to your inventory.' : null;
    this.plantDiaryOfferPending = true;
    if (this.plantDiaryOptions) this.plantDiaryOptions.hidden = true;
    this.showLine();
  }

  next(): void {
    if (this.pendingGiftLine) {
      this.dialogueLine.textContent = this.pendingGiftLine;
      this.pendingGiftLine = null;
      const giftWasAdded = addGift(this.pendingGiftItem);
      this.dialogueProgress.hidden = true;
      this.giftConfirmation.textContent = giftWasAdded ? this.pendingGiftConfirmation : '';
      this.pendingGiftConfirmation = null;
      this.giftConfirmation.hidden = !giftWasAdded;
      this.nextButton.hidden = !this.plantDiaryOfferPending;
      return;
    }
    if (this.plantDiaryOfferPending) {
      this.plantDiaryOfferPending = false;
      this.dialogueLine.textContent = "Do you want to see Max's plant diary?";
      this.dialogueProgress.hidden = true;
      this.giftConfirmation.hidden = true;
      this.nextButton.hidden = true;
      if (this.plantDiaryOptions) this.plantDiaryOptions.hidden = false;
      return;
    }
    this.lineIndex = (this.lineIndex + 1) % this.dialogueLines.length;
    this.showLine();
  }

  stop(): void {
    this.pendingGiftLine = null;
    this.pendingGiftConfirmation = null;
    this.plantDiaryOfferPending = false;
    if (this.plantDiaryOptions) this.plantDiaryOptions.hidden = true;
    this.plantDiary.hide();
    this.giftConfirmation.hidden = true;
    this.dialogueProgress.hidden = true;
  }

  private showLine(): void {
    this.giftConfirmation.hidden = true;
    const line = this.dialogueLines[this.lineIndex] ?? '';
    this.dialogueLine.textContent = line;
    const phrase = "panda's friend";
    const highlightStart = line.indexOf(phrase);
    if (highlightStart >= 0) {
      const highlight = document.createElement('mark');
      highlight.className = 'dialogue-highlight';
      highlight.textContent = phrase;
      this.dialogueLine.replaceChildren(line.slice(0, highlightStart), highlight, line.slice(highlightStart + phrase.length));
    }
    this.dialogueProgress.textContent = `${this.lineIndex + 1}/${this.dialogueLines.length}`;
    this.dialogueProgress.hidden = false;
    this.nextButton.hidden = !this.pendingGiftLine && !this.plantDiaryOfferPending && this.dialogueLines.length <= 1;
  }

  private resumeDialogue(): void {
    if (this.plantDiaryOptions) this.plantDiaryOptions.hidden = true;
    if (this.dialogue) this.dialogue.hidden = false;
    this.next();
    this.nextButton.focus();
  }

  private showPlantDiary(): void {
    if (this.plantDiaryOptions) this.plantDiaryOptions.hidden = true;
    if (this.dialogue) this.dialogue.hidden = true;
    this.plantDiary.open();
  }
}
