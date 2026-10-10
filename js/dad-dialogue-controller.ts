import { beginDialogueAudio } from './dialogue-audio.js';
import { DAD_DIALOGUE_LINES } from './dad-dialogue.js';
import { requireElement } from './dom.js';
import { nextDialogueVisitIndex } from './dialogue-visit.js';
import { setProfileImage } from './profile-images.js';

export class DadDialogueController {
  private readonly speaker = requireElement<HTMLElement>('#noel-speaker');
  private readonly line = requireElement<HTMLElement>('#noel-dialogue-line');
  private readonly profile = requireElement<HTMLImageElement>('#noel-dialogue-profile');
  private readonly progress = requireElement<HTMLElement>('#noel-dialogue-progress');
  private readonly nextButton = requireElement<HTMLButtonElement>('#noel-dialogue-next');
  private readonly dialogue = requireElement<HTMLElement>('#noel-dialogue');

  constructor(private readonly openDialogue: () => void) {}

  private lineIndex = 0;

  start(): void {
    this.openDialogue();
    beginDialogueAudio('Dad', '../');
    this.lineIndex = nextDialogueVisitIndex('dad', DAD_DIALOGUE_LINES.length);
    this.speaker.textContent = 'Dad';
    setProfileImage(this.profile, 'Dad', '../');
    this.showLine();
    requireElement<HTMLElement>('#noel-dialogue-question').hidden = true;
    requireElement<HTMLElement>('#noel-dialogue-options').hidden = true;
    requireElement<HTMLElement>('#siblings-dialogue-options').hidden = true;
    requireElement<HTMLElement>('#music-dialogue-options').hidden = true;
    requireElement<HTMLElement>('#helen-reading-options').hidden = true;
    this.dialogue.hidden = false;
  }

  next(): void {
    if (DAD_DIALOGUE_LINES.length < 2) return;
    this.lineIndex = (this.lineIndex + 1) % DAD_DIALOGUE_LINES.length;
    this.showLine();
  }

  private showLine(): void {
    this.line.textContent = DAD_DIALOGUE_LINES[this.lineIndex] ?? '';
    this.progress.textContent = `${this.lineIndex + 1}/${DAD_DIALOGUE_LINES.length}`;
    this.progress.hidden = false;
    this.nextButton.hidden = DAD_DIALOGUE_LINES.length < 2;
  }
}
