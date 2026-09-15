import { LUCY_DIALOGUE_LINES } from './lucy-dialogue.js';
import { addGift, hasGift, nextGiftLine, GIFT_ITEMS } from './inventory-gifts.js';

export class LucyController {
  readonly sprite = new Image();
  readonly theme = new Audio('../chat/lucy/player/theme.mp3');
  private lineIndex = 0;
  private pendingGiftLine: string | null = null;
  private pendingGiftItem = GIFT_ITEMS[2]!;
  private pendingGiftConfirmation: string | null = null;

  constructor(
    private readonly dialogueLine: HTMLElement,
    private readonly nextButton: HTMLButtonElement,
    private readonly dialogueProgress: HTMLElement,
    private readonly giftConfirmation: HTMLElement,
  ) {
    this.sprite.src = '../chat/lucy/map-sprite.png';
    this.theme.preload = 'auto';
  }

  start(): void {
    this.lineIndex = 0;
    const hasNewGift = !hasGift(this.pendingGiftItem);
    this.pendingGiftLine = hasNewGift ? nextGiftLine() : null;
    this.pendingGiftConfirmation = hasNewGift ? 'An item has been added to your inventory.' : null;
    this.showLine();
    this.theme.pause();
    this.theme.currentTime = 0;
    void this.theme.play().catch(() => {
      // Browsers may reject audio until a real keyboard or pointer gesture.
    });
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
      this.nextButton.hidden = true;
      return;
    }
    this.lineIndex = (this.lineIndex + 1) % LUCY_DIALOGUE_LINES.length;
    this.showLine();
  }

  stop(): void {
    this.theme.pause();
    this.theme.currentTime = 0;
    this.theme.onended = null;
    this.pendingGiftLine = null;
    this.pendingGiftConfirmation = null;
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
