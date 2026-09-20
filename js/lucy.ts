import { LUCY_DIALOGUE_LINES } from './lucy-dialogue.js';
import { addGift, hasGift, LUCY_ITEM, nextGiftLine } from './inventory-gifts.js';

export class LucyController {
  readonly sprite = new Image();
  private lineIndex = 0;
  private pendingGiftLine: string | null = null;
  private pendingGiftItem = LUCY_ITEM;
  private pendingGiftConfirmation: string | null = null;
  private plantDiaryOfferPending = false;
  private readonly plantDiaryOptions = document.querySelector<HTMLElement>('#lucy-plant-diary-options');

  constructor(
    private readonly dialogueLine: HTMLElement,
    private readonly nextButton: HTMLButtonElement,
    private readonly dialogueProgress: HTMLElement,
    private readonly giftConfirmation: HTMLElement,
    private readonly closeDialogue: () => void,
  ) {
    this.sprite.src = '../chat/lucy/avatar.png';
    document.querySelector<HTMLButtonElement>('#lucy-plant-diary-yeh')?.addEventListener('click', this.closeDialogue);
    document.querySelector<HTMLButtonElement>('#lucy-plant-diary-neh')?.addEventListener('click', this.closeDialogue);
  }

  start(): void {
    this.lineIndex = 0;
    const hasNewGift = !hasGift(this.pendingGiftItem);
    this.pendingGiftLine = hasNewGift ? nextGiftLine() : null;
    this.pendingGiftConfirmation = hasNewGift ? 'An item has been added to your inventory.' : null;
    this.plantDiaryOfferPending = hasNewGift;
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
    this.lineIndex = (this.lineIndex + 1) % LUCY_DIALOGUE_LINES.length;
    this.showLine();
  }

  stop(): void {
    this.pendingGiftLine = null;
    this.pendingGiftConfirmation = null;
    this.plantDiaryOfferPending = false;
    if (this.plantDiaryOptions) this.plantDiaryOptions.hidden = true;
    this.giftConfirmation.hidden = true;
    this.dialogueProgress.hidden = true;
  }

  private showLine(): void {
    this.dialogueLine.textContent = LUCY_DIALOGUE_LINES[this.lineIndex] ?? '';
    this.dialogueProgress.textContent = `${this.lineIndex + 1}/${LUCY_DIALOGUE_LINES.length}`;
    this.dialogueProgress.hidden = false;
    this.nextButton.hidden = LUCY_DIALOGUE_LINES.length <= 1;
  }
}
