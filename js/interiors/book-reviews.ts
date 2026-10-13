import { requireElement } from '../core/dom.js';
import type { DirectionInputController } from '../core/input.js';

export type BookReviewHost = 'alexW' | 'helen';

const BOOK_REVIEW_PROMPT = "Do you want to read this year's book reviews?";

export class BookReviewsController {
  private readonly options = requireElement<HTMLElement>('#book-reviews-options');
  private readonly acceptButton = requireElement<HTMLButtonElement>('#book-reviews-accept');
  private readonly declineButton = requireElement<HTMLButtonElement>('#book-reviews-decline');
  private readonly panel = requireElement<HTMLElement>('#book-reviews-panel');
  private readonly closeButton = requireElement<HTMLButtonElement>('#book-reviews-close');

  constructor(
    private readonly speaker: HTMLElement,
    private readonly line: HTMLElement,
    private readonly nextButton: HTMLButtonElement,
    private readonly progress: HTMLElement,
    private readonly giftConfirmation: HTMLElement,
    private readonly question: HTMLElement,
    private readonly noelOptions: HTMLElement,
    private readonly siblingsOptions: HTMLElement,
    private readonly musicOptions: HTMLElement,
    private readonly dialogue: HTMLElement,
    private readonly prompt: HTMLElement,
  ) {}

  start(host: BookReviewHost, input: DirectionInputController): void {
    input.releaseAll();
    this.speaker.textContent = host === 'alexW' ? 'Alex' : 'Helen';
    this.line.textContent = BOOK_REVIEW_PROMPT;
    this.progress.hidden = true;
    this.giftConfirmation.hidden = true;
    this.nextButton.hidden = true;
    this.question.hidden = true;
    this.noelOptions.hidden = true;
    this.siblingsOptions.hidden = true;
    this.musicOptions.hidden = true;
    this.options.hidden = false;
    this.panel.hidden = true;
    this.dialogue.hidden = false;
    this.prompt.hidden = true;
  }

  bind(openReviews: () => void, closeDialogue: () => void): void {
    this.acceptButton.addEventListener('click', () => {
      this.options.hidden = true;
      this.dialogue.hidden = true;
      this.prompt.hidden = true;
      openReviews();
      this.open();
    });
    this.declineButton.addEventListener('click', closeDialogue);
    this.closeButton.addEventListener('click', closeDialogue);
  }

  hide(): void {
    this.options.hidden = true;
    this.panel.hidden = true;
  }

  private open(): void {
    this.panel.hidden = false;
    this.closeButton.focus();
  }
}
