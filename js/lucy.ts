import { LUCY_DIALOGUE_LINES } from './lucy-dialogue.js';

export class LucyController {
  readonly sprite = new Image();
  readonly theme = new Audio('../chat/lucy/player/theme.mp3');
  private lineIndex = 0;

  constructor(
    private readonly dialogueLine: HTMLElement,
    private readonly nextButton: HTMLButtonElement,
  ) {
    this.sprite.src = '../chat/lucy/avatar.png';
    this.theme.preload = 'auto';
  }

  start(): void {
    this.lineIndex = 0;
    this.showLine();
    this.theme.pause();
    this.theme.currentTime = 0;
    void this.theme.play().catch(() => {
      // Browsers may reject audio until a real keyboard or pointer gesture.
    });
  }

  next(): void {
    this.lineIndex = (this.lineIndex + 1) % LUCY_DIALOGUE_LINES.length;
    this.showLine();
  }

  stop(): void {
    this.theme.pause();
    this.theme.currentTime = 0;
    this.theme.onended = null;
  }

  private showLine(): void {
    this.dialogueLine.textContent = LUCY_DIALOGUE_LINES[this.lineIndex] ?? '';
    this.nextButton.hidden = LUCY_DIALOGUE_LINES.length <= 1;
  }
}
