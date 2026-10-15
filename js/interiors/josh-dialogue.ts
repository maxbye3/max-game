import { createGameAudio } from '../core/audio-mute.js';
import { beginDialogueAudio } from '../core/dialogue-audio.js';
import { setProfileImage } from '../core/profile-images.js';
import { JOSH_DIALOGUE_LINES } from '../generated/dialogues/josh-dialogue.js';
import { ArtGalleryController } from './art-gallery.js';

interface JoshDialogueElements {
  dialogue: HTMLElement;
  speaker: HTMLElement;
  line: HTMLElement;
  profile: HTMLImageElement;
  progress: HTMLElement;
  next: HTMLButtonElement;
  question: HTMLElement;
  options: HTMLElement;
  artOptions: HTMLElement;
  yes: HTMLButtonElement;
  no: HTMLButtonElement;
  signupOptions: HTMLElement;
  notNow: HTMLButtonElement;
  codec: HTMLElement;
  codecContinue: HTMLButtonElement;
}

type JoshDialogueStage = 'opening' | 'class' | 'callIntro' | 'codec' | 'signup' | 'final' | 'done';

export class JoshDialogueController {
  private stage: JoshDialogueStage = 'done';
  private open = false;
  private readonly ringtone = createGameAudio('../audio/art-house/codec.mp3');
  private readonly codecOn = createGameAudio('../audio/art-house/on.mp3');
  private readonly codecOff = createGameAudio('../audio/art-house/off.mp3');
  private advanceTimer: number | null = null;
  private readonly artGallery: ArtGalleryController;

  public constructor(
    private readonly elements: JoshDialogueElements,
    private readonly openDialogue: () => void,
    private readonly closeDialogue: () => void,
  ) {
    this.artGallery = new ArtGalleryController(() => {
      if (this.open) {
        this.elements.dialogue.hidden = false;
        this.elements.next.focus();
      }
    });
  }

  public bind(): void {
    this.elements.yes.addEventListener('click', () => this.chooseArt(true));
    this.elements.no.addEventListener('click', () => this.chooseArt(false));
    this.elements.codecContinue.addEventListener('click', () => this.returnFromCodec());
    this.elements.notNow.addEventListener('click', () => this.closeDialogue());
  }

  public start(): void {
    this.openDialogue();
    beginDialogueAudio('Josh', '../');
    this.open = true;
    this.stage = 'opening';
    this.elements.speaker.textContent = 'Josh';
    setProfileImage(this.elements.profile, 'Josh', '../');
    this.elements.line.textContent = JOSH_DIALOGUE_LINES[0] ?? '';
    this.elements.question.hidden = true;
    this.elements.options.hidden = true;
    this.elements.artOptions.hidden = false;
    this.elements.signupOptions.hidden = true;
    this.elements.progress.hidden = true;
    this.elements.next.hidden = true;
    this.elements.dialogue.hidden = false;
  }

  public next(): void {
    if (!this.open) return;
    if (this.stage === 'class') this.showCallIntro();
    else if (this.stage === 'signup') this.showFinalLine();
  }

  public stop(): void {
    this.artGallery.hide();
    this.stopRingtone();
    this.codecOn.pause();
    this.codecOn.currentTime = 0;
    this.codecOff.pause();
    this.codecOff.currentTime = 0;
    if (this.advanceTimer !== null) {
      window.clearTimeout(this.advanceTimer);
      this.advanceTimer = null;
    }
    this.open = false;
    this.stage = 'done';
    this.elements.codec.hidden = true;
    this.elements.artOptions.hidden = true;
    this.elements.signupOptions.hidden = true;
  }

  private chooseArt(viewArt: boolean): void {
    if (!this.open || this.stage !== 'opening') return;
    this.stage = 'class';
    this.elements.artOptions.hidden = true;
    this.elements.line.textContent = JOSH_DIALOGUE_LINES[1] ?? '';
    this.elements.next.hidden = false;
    this.elements.progress.hidden = true;
    this.elements.question.hidden = true;
    if (viewArt) {
      this.elements.dialogue.hidden = true;
      this.artGallery.open();
    }
  }

  private showCallIntro(): void {
    this.stage = 'callIntro';
    this.elements.line.textContent = JOSH_DIALOGUE_LINES[2] ?? "Ooo hang on I'm getting a call";
    this.elements.next.hidden = true;
    this.elements.artOptions.hidden = true;
    this.elements.signupOptions.hidden = true;
    this.playRingtone();
    if (this.advanceTimer !== null) window.clearTimeout(this.advanceTimer);
    this.advanceTimer = window.setTimeout(() => {
      this.advanceTimer = null;
      if (!this.open) return;
      this.stage = 'codec';
      this.stopRingtone();
      this.codecOn.currentTime = 0;
      void this.codecOn.play().catch(() => {});
      this.elements.dialogue.hidden = true;
      this.elements.codec.hidden = false;
      this.elements.codecContinue.focus();
    }, 1400);
  }

  private returnFromCodec(): void {
    if (!this.open || this.stage !== 'codec') return;
    this.stopRingtone();
    this.codecOn.pause();
    this.codecOn.currentTime = 0;
    this.codecOff.currentTime = 0;
    void this.codecOff.play().catch(() => {});
    this.stage = 'signup';
    this.elements.codec.hidden = true;
    this.elements.speaker.textContent = 'Josh';
    setProfileImage(this.elements.profile, 'Josh', '../');
    this.elements.line.textContent = JOSH_DIALOGUE_LINES[3] ?? 'why not sign up and join max next term?';
    this.elements.next.hidden = false;
    this.elements.progress.hidden = true;
    this.elements.question.hidden = true;
    this.elements.options.hidden = true;
    this.elements.artOptions.hidden = true;
    this.elements.signupOptions.hidden = false;
    this.elements.dialogue.hidden = false;
    this.elements.codecContinue.blur();
  }

  private showFinalLine(): void {
    this.stage = 'final';
    this.elements.line.textContent = JOSH_DIALOGUE_LINES[4] ?? 'Why not join Max and myself.';
    this.elements.next.hidden = true;
    this.elements.progress.hidden = true;
    this.elements.question.hidden = true;
    this.elements.options.hidden = true;
    this.elements.artOptions.hidden = true;
  }

  private stopRingtone(): void {
    this.ringtone.pause();
    this.ringtone.currentTime = 0;
  }

  private playRingtone(): void {
    this.stopRingtone();
    void this.ringtone.play().catch(() => {});
  }
}
