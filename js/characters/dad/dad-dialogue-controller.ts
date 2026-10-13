import { beginDialogueAudio } from '../../core/dialogue-audio.js';
import { DAD_DIALOGUE_LINES } from '../../generated/dialogues/dad-dialogue.js';
import { requireElement } from '../../core/dom.js';
import { nextDialogueVisitIndex } from '../../core/dialogue-visit.js';
import { setProfileImage } from '../../core/profile-images.js';

export class DadDialogueController {
  private readonly speaker = requireElement<HTMLElement>('#noel-speaker');
  private readonly line = requireElement<HTMLElement>('#noel-dialogue-line');
  private readonly profile = requireElement<HTMLImageElement>('#noel-dialogue-profile');
  private readonly progress = requireElement<HTMLElement>('#noel-dialogue-progress');
  private readonly nextButton = requireElement<HTMLButtonElement>('#noel-dialogue-next');
  private readonly dialogue = requireElement<HTMLElement>('#noel-dialogue');
  private readonly movieOptions = requireElement<HTMLElement>('#dad-movie-options');
  private readonly movieYes = requireElement<HTMLButtonElement>('#dad-movie-yes');
  private readonly movieNo = requireElement<HTMLButtonElement>('#dad-movie-no');

  constructor(
    private readonly openDialogue: () => void,
    private readonly openMovieReviews: () => void,
  ) {
    this.movieYes.addEventListener('click', () => {
      this.movieOptions.hidden = true;
      this.dialogue.hidden = true;
      this.openMovieReviews();
    });
    this.movieNo.addEventListener('click', () => {
      this.movieOptions.hidden = true;
      this.nextButton.hidden = true;
      this.progress.hidden = true;
      this.line.textContent = 'my taste in movies is better anyway';
    });
  }

  private lineIndex = 0;
  private linesShown = 0;

  start(): void {
    this.openDialogue();
    beginDialogueAudio('Dad', '../');
    this.lineIndex = nextDialogueVisitIndex('dad', DAD_DIALOGUE_LINES.length);
    this.linesShown = 1;
    this.speaker.textContent = 'Dad';
    setProfileImage(this.profile, 'Dad', '../');
    this.showLine();
    requireElement<HTMLElement>('#noel-dialogue-question').hidden = true;
    requireElement<HTMLElement>('#noel-dialogue-options').hidden = true;
    requireElement<HTMLElement>('#siblings-dialogue-options').hidden = true;
    requireElement<HTMLElement>('#music-dialogue-options').hidden = true;
    requireElement<HTMLElement>('#helen-reading-options').hidden = true;
    this.movieOptions.hidden = true;
    this.dialogue.hidden = false;
  }

  next(): void {
    if (this.linesShown >= DAD_DIALOGUE_LINES.length) {
      this.showMovieOffer();
      return;
    }
    this.lineIndex = (this.lineIndex + 1) % DAD_DIALOGUE_LINES.length;
    this.linesShown += 1;
    this.showLine();
  }

  hide(): void {
    this.movieOptions.hidden = true;
  }

  private showLine(): void {
    this.line.textContent = DAD_DIALOGUE_LINES[this.lineIndex] ?? '';
    this.progress.textContent = `${this.lineIndex + 1}/${DAD_DIALOGUE_LINES.length}`;
    this.progress.hidden = false;
    this.nextButton.hidden = DAD_DIALOGUE_LINES.length < 2;
  }

  private showMovieOffer(): void {
    this.line.textContent = "Do you want to see Max's movie reviews??";
    this.progress.hidden = true;
    this.nextButton.hidden = true;
    this.movieOptions.hidden = false;
    this.movieYes.focus();
  }
}
