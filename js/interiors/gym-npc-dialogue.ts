import { JULIAN_DIALOGUE_LINES } from '../generated/dialogues/julian-dialogue.js';
import { TIM_DIALOGUE_LINES } from '../generated/dialogues/tim-dialogue.js';
import { KIRIN_DIALOGUE_LINES } from '../generated/dialogues/kirin-dialogue.js';
import { KIRIN_ITEM } from '../core/inventory-gifts.js';
import { addGift, hasGift, JULIAN_ITEM, nextGiftLine, TIM_ITEM, type GiftItem } from '../core/inventory-gifts.js';
import { nextDialogueVisitIndex } from '../core/dialogue-visit.js';
import { WorkoutGalleryController } from './workout-gallery.js';
import { characterAsset } from '../core/character-assets.js';
import { getTimCinemaDialogue, type TimCinemaDialogue } from '../characters/tim/tim-cinema-dialogue.js';
import { isAlexPlayer } from '../core/player-character.js';

export type GymNpcId = 'julian' | 'tim' | 'kirin';

interface GymNpcChat {
  readonly id: GymNpcId;
  readonly name: string;
  readonly dialogueLines: readonly string[];
  readonly profileSource?: string;
  readonly item: GiftItem;
}

const GYM_NPC_CHATS: Record<GymNpcId, GymNpcChat> = {
  kirin: {
    id: 'kirin', name: 'Kirin', dialogueLines: KIRIN_DIALOGUE_LINES,
    profileSource: `../${characterAsset('kirin', 'profile')}`, item: KIRIN_ITEM,
  },
  julian: {
    id: 'julian', name: 'Julian', dialogueLines: JULIAN_DIALOGUE_LINES,
    item: JULIAN_ITEM,
  },
  tim: {
    id: 'tim', name: 'Tim', dialogueLines: TIM_DIALOGUE_LINES,
    profileSource: `../${characterAsset('tim', 'profile')}`, item: TIM_ITEM,
  },
};

export class GymNpcDialogueController {
  private active: GymNpcChat | null = null;
  private lineIndex = 0;
  private pendingGiftLine: string | null = null;
  private journalOfferPending = false;
  private cinemaDialogue: TimCinemaDialogue | null = null;
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

  start(id: GymNpcId, atCinema = false): GymNpcChat {
    const npc = GYM_NPC_CHATS[id];
    this.active = npc;
    this.cinemaDialogue = id === 'tim' && atCinema ? getTimCinemaDialogue() : null;
    this.lineIndex = this.cinemaDialogue ? 0 : nextDialogueVisitIndex(npc.id, npc.dialogueLines.length);
    this.pendingGiftLine = this.cinemaDialogue || hasGift(npc.item) ? null : nextGiftLine();
    this.journalOfferPending = id === 'julian' && isAlexPlayer() && this.pendingGiftLine !== null;
    if (this.journalOptions) this.journalOptions.hidden = true;
    this.workoutGallery.hide();
    this.confirmation.hidden = true;
    this.showLine();
    return npc;
  }

  next(): void {
    if (!this.active || this.cinemaDialogue) return;
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
    this.cinemaDialogue = null;
    this.pendingGiftLine = null;
    this.journalOfferPending = false;
    if (this.journalOptions) this.journalOptions.hidden = true;
    this.workoutGallery.hide();
    this.confirmation.hidden = true;
    this.progress.hidden = true;
  }

  private showLine(): void {
    if (!this.active) return;
    this.confirmation.hidden = true;
    if (this.cinemaDialogue) {
      const highlight = document.createElement('mark');
      highlight.className = 'dialogue-highlight';
      highlight.textContent = this.cinemaDialogue.highlight;
      this.line.replaceChildren(this.cinemaDialogue.opening, highlight, this.cinemaDialogue.ending);
      this.progress.hidden = true;
      this.nextButton.hidden = true;
      return;
    }
    this.line.textContent = this.active.dialogueLines[this.lineIndex] ?? '';
    this.progress.textContent = `${this.lineIndex + 1}/${this.active.dialogueLines.length}`;
    this.progress.hidden = this.active.dialogueLines.length === 0;
    this.nextButton.hidden = this.pendingGiftLine === null && this.active.dialogueLines.length <= 1;
  }

  private showJournal(): void {
    if (this.active?.id !== 'julian' || this.journalOptions?.hidden !== false || !isAlexPlayer()) return;
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
    this.nextButton.hidden = this.active.dialogueLines.length <= 1;
  }
}
