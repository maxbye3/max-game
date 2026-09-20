import { JULIAN_DIALOGUE_LINES } from './julian-dialogue.js';
import { TIM_DIALOGUE_LINES } from './tim-dialogue.js';
import { addGift, hasGift, JULIAN_ITEM, nextGiftLine, TIM_ITEM, type GiftItem } from './inventory-gifts.js';
import { readStorage, writeStorage } from './storage.js';
import { WorkoutGalleryController } from './workout-gallery.js';

export type GymNpcId = 'julian' | 'tim';

interface GymNpcChat {
  readonly id: GymNpcId;
  readonly name: string;
  readonly dialogueLines: readonly string[];
  readonly profileSource?: string;
  readonly item: GiftItem;
}

const GYM_NPC_CHATS: Record<GymNpcId, GymNpcChat> = {
  julian: {
    id: 'julian', name: 'Julian', dialogueLines: JULIAN_DIALOGUE_LINES,
    item: JULIAN_ITEM,
  },
  tim: {
    id: 'tim', name: 'Tim', dialogueLines: TIM_DIALOGUE_LINES,
    profileSource: '../chat/tim/profile.png', item: TIM_ITEM,
  },
};

export class GymNpcDialogueController {
  private active: GymNpcChat | null = null;
  private lineIndex = 0;
  private pendingGiftLine: string | null = null;
  private journalOfferPending = false;
  private readonly journalOptions = document.querySelector<HTMLElement>('#tim-workout-journal-options');
  private readonly dialogue = document.querySelector<HTMLElement>('#noel-dialogue');
  private readonly workoutGallery: WorkoutGalleryController;

  constructor(
    private readonly line: HTMLElement,
    private readonly nextButton: HTMLButtonElement,
    private readonly progress: HTMLElement,
    private readonly confirmation: HTMLElement,
  ) {
    this.workoutGallery = new WorkoutGalleryController(() => {
      if (this.dialogue) this.dialogue.hidden = false;
      this.giveGift();
    });
    document.querySelector<HTMLButtonElement>('#tim-workout-journal-yas')?.addEventListener('click', () => this.showJournal());
    document.querySelector<HTMLButtonElement>('#tim-workout-journal-neh')?.addEventListener('click', () => this.giveGift());
  }

  start(id: GymNpcId): GymNpcChat {
    const npc = GYM_NPC_CHATS[id];
    this.active = npc;
    this.lineIndex = this.nextLineIndex(npc);
    this.pendingGiftLine = hasGift(npc.item) ? null : nextGiftLine();
    this.journalOfferPending = id === 'julian' && this.pendingGiftLine !== null;
    if (this.journalOptions) this.journalOptions.hidden = true;
    this.workoutGallery.hide();
    this.confirmation.hidden = true;
    this.showLine();
    return npc;
  }

  next(): void {
    if (!this.active) return;
    if (this.journalOfferPending) {
      this.journalOfferPending = false;
      this.line.textContent = "hey wanna see Max's work out journal";
      this.progress.hidden = true;
      this.nextButton.hidden = true;
      if (this.journalOptions) this.journalOptions.hidden = false;
      return;
    }
    if (this.pendingGiftLine) {
      this.giveGift();
      return;
    }
    if (this.active.dialogueLines.length < 2) return;
    this.lineIndex = (this.lineIndex + 1) % this.active.dialogueLines.length;
    this.showLine();
  }

  stop(): void {
    this.active = null;
    this.pendingGiftLine = null;
    this.journalOfferPending = false;
    if (this.journalOptions) this.journalOptions.hidden = true;
    this.workoutGallery.hide();
    this.confirmation.hidden = true;
    this.progress.hidden = true;
  }

  private nextLineIndex(npc: GymNpcChat): number {
    if (npc.dialogueLines.length === 0) return 0;
    const key = `max-game:${npc.id}-dialogue-index`;
    const stored = Number.parseInt(readStorage(key) ?? '0', 10);
    const index = Number.isFinite(stored) && stored >= 0 ? stored % npc.dialogueLines.length : 0;
    writeStorage(key, String((index + 1) % npc.dialogueLines.length));
    return index;
  }

  private showLine(): void {
    if (!this.active) return;
    this.line.textContent = this.active.dialogueLines[this.lineIndex] ?? '';
    this.progress.textContent = `${this.lineIndex + 1}/${this.active.dialogueLines.length}`;
    this.progress.hidden = this.active.dialogueLines.length === 0;
    this.nextButton.hidden = this.pendingGiftLine === null && this.active.dialogueLines.length <= 1;
  }

  private showJournal(): void {
    if (this.journalOptions) this.journalOptions.hidden = true;
    if (this.dialogue) this.dialogue.hidden = true;
    this.workoutGallery.open();
  }

  private giveGift(): void {
    if (!this.active || !this.pendingGiftLine) return;
    if (this.journalOptions) this.journalOptions.hidden = true;
    this.line.textContent = this.pendingGiftLine;
    this.pendingGiftLine = null;
    const added = addGift(this.active.item);
    this.progress.hidden = true;
    this.confirmation.textContent = added ? 'An item has been added to your inventory.' : '';
    this.confirmation.hidden = !added;
    this.nextButton.hidden = true;
  }
}
