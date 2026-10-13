import { beginDialogueAudio } from '../core/dialogue-audio.js';
import { setProfileImage } from '../core/profile-images.js';
import { JOSH_DIALOGUE_LINES } from '../generated/dialogues/josh-dialogue.js';

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
  link: HTMLAnchorElement;
  codec: HTMLElement;
  codecContinue: HTMLButtonElement;
}

type JoshDialogueStage = 'opening' | 'class' | 'callIntro' | 'codec' | 'signup' | 'final' | 'done';

export class JoshDialogueController {
  private stage: JoshDialogueStage = 'done';
  private open = false;
  private ringtoneTimer: number | null = null;
  private advanceTimer: number | null = null;
  private audioContext: AudioContext | null = null;

  public constructor(private readonly elements: JoshDialogueElements, private readonly openDialogue: () => void) {}

  public bind(): void {
    this.elements.yes.addEventListener('click', () => this.chooseArt());
    this.elements.no.addEventListener('click', () => this.chooseArt());
    this.elements.codecContinue.addEventListener('click', () => this.returnFromCodec());
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
    this.elements.link.hidden = true;
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
    this.stopRingtone();
    if (this.advanceTimer !== null) {
      window.clearTimeout(this.advanceTimer);
      this.advanceTimer = null;
    }
    this.open = false;
    this.stage = 'done';
    this.elements.codec.hidden = true;
    this.elements.artOptions.hidden = true;
    this.elements.link.hidden = true;
  }

  private chooseArt(): void {
    if (!this.open || this.stage !== 'opening') return;
    this.stage = 'class';
    this.elements.artOptions.hidden = true;
    this.elements.line.textContent = JOSH_DIALOGUE_LINES[1] ?? '';
    this.elements.next.hidden = false;
    this.elements.progress.hidden = true;
    this.elements.question.hidden = true;
  }

  private showCallIntro(): void {
    this.stage = 'callIntro';
    this.elements.line.textContent = JOSH_DIALOGUE_LINES[2] ?? "Ooo hang on I'm getting a call";
    this.elements.next.hidden = true;
    this.elements.artOptions.hidden = true;
    this.elements.link.hidden = true;
    this.playRingtone();
    if (this.advanceTimer !== null) window.clearTimeout(this.advanceTimer);
    this.advanceTimer = window.setTimeout(() => {
      this.advanceTimer = null;
      if (!this.open) return;
      this.stage = 'codec';
      this.elements.dialogue.hidden = true;
      this.elements.codec.hidden = false;
      this.elements.codecContinue.focus();
    }, 1400);
  }

  private returnFromCodec(): void {
    if (!this.open || this.stage !== 'codec') return;
    this.stopRingtone();
    this.stage = 'signup';
    this.elements.codec.hidden = true;
    this.elements.speaker.textContent = 'Josh';
    setProfileImage(this.elements.profile, 'Josh', '../');
    this.elements.line.textContent = JOSH_DIALOGUE_LINES[3] ?? 'Anyway, please consider signing up for the next term here.';
    this.elements.next.hidden = false;
    this.elements.progress.hidden = true;
    this.elements.question.hidden = true;
    this.elements.options.hidden = true;
    this.elements.artOptions.hidden = true;
    this.elements.link.hidden = false;
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
    if (this.ringtoneTimer !== null) {
      window.clearInterval(this.ringtoneTimer);
      this.ringtoneTimer = null;
    }
    if (this.audioContext) {
      void this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  private playRingtone(): void {
    this.stopRingtone();
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    this.audioContext = new AudioContextConstructor();
    void this.audioContext.resume().catch(() => {});
    const ring = (): void => {
      if (!this.audioContext) return;
      const now = this.audioContext.currentTime;
      const gain = this.audioContext.createGain();
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.setValueAtTime(660, now + 0.12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      oscillator.connect(gain).connect(this.audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
    };
    ring();
    this.ringtoneTimer = window.setInterval(ring, 900);
    window.setTimeout(() => this.stopRingtone(), 3200);
  }
}
