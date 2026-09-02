export const CAVE_SIBLINGS = {
  x: 320,
  startY: 45,
  endY: 112,
  width: 96,
  height: 83,
  interactionDistance: 86,
} as const;

export const CAVE_SIBLINGS_IDLE_FRAME = [181, 16, 235, 176] as const;
export const CAVE_SIBLINGS_WALK_FRAMES = [
  [163, 206, 212, 183],
  [657, 206, 211, 183],
  [1103, 206, 180, 183],
] as const;

type Speaker = 'Maddy' | 'Marina';
type DialogueSequence = 'welcome' | 'warning';
type DialoguePhase = 'idle' | 'playing' | 'choice' | 'awaitingReturn' | 'complete';

interface DialogueLine {
  readonly speaker: Speaker;
  readonly line: string;
}

interface CaveSiblingsView {
  readonly showLine: (dialogue: DialogueLine) => void;
  readonly showOptions: () => void;
  readonly closeDialogue: () => void;
}

const ENTRANCE_DURATION = 1.35;
const FINAL_DARKNESS_ALPHA = 0.2;
const DIALOGUES: Record<DialogueSequence, readonly DialogueLine[]> = {
  welcome: [
    { speaker: 'Maddy', line: 'welcome.' },
    { speaker: 'Marina', line: 'stranger.' },
    { speaker: 'Maddy', line: 'would you' },
    { speaker: 'Marina', line: 'like to see' },
    { speaker: 'Maddy', line: 'the website' },
    { speaker: 'Marina', line: 'our brother' },
    { speaker: 'Maddy', line: 'made' },
    { speaker: 'Marina', line: 'made?' },
  ],
  warning: [
    { speaker: 'Maddy', line: 'do not' },
    { speaker: 'Marina', line: 'touch' },
    { speaker: 'Maddy', line: 'the colander' },
  ],
};
const DIALOGUE_DURATION: Record<DialogueSequence, number> = {
  welcome: 3000,
  warning: 1500,
};

export class CaveSiblingsController {
  private readonly voices: Record<Speaker, HTMLAudioElement>;
  private readonly startedVoices = new Set<Speaker>();
  private entranceElapsed = 0;
  private dialoguePhase: DialoguePhase = 'idle';
  private dialogueSequence: DialogueSequence = 'welcome';
  private dialogueStartedAt = 0;
  private dialogueLineIndex = -1;
  private completedWhileNearby = false;
  private websiteWasLeft = false;

  y: number = CAVE_SIBLINGS.startY;
  walkFrame = 0;
  darknessAlpha = 1;

  constructor(private readonly view: CaveSiblingsView) {
    this.voices = {
      Maddy: new Audio('../chat/siblings/maddy.mp3'),
      Marina: new Audio('../chat/siblings/marina.mp3'),
    };
    Object.values(this.voices).forEach((voice) => {
      voice.preload = 'auto';
    });
  }

  get isEntering(): boolean {
    return this.entranceElapsed < ENTRANCE_DURATION;
  }

  get isWaiting(): boolean {
    return !this.isEntering;
  }

  get isDialoguePlaying(): boolean {
    return this.dialoguePhase === 'playing';
  }

  get canResumeAfterWebsite(): boolean {
    return this.dialoguePhase === 'awaitingReturn' && this.websiteWasLeft;
  }

  startWelcome(time: number): boolean {
    if (!this.isWaiting || this.dialoguePhase !== 'idle' || this.completedWhileNearby) return false;
    this.beginDialogue('welcome', time);
    return true;
  }

  leaveRange(): void {
    this.completedWhileNearby = false;
    if (this.dialoguePhase === 'idle' || this.dialoguePhase === 'complete') {
      this.dialoguePhase = 'idle';
    }
  }

  chooseWebsite(): void {
    this.completedWhileNearby = true;
    this.websiteWasLeft = false;
    this.dialoguePhase = 'awaitingReturn';
    this.stopVoices();
  }

  declineWebsite(): void {
    this.completedWhileNearby = true;
    this.dialoguePhase = 'complete';
    this.stopVoices();
  }

  notePageLeft(): void {
    if (this.dialoguePhase === 'awaitingReturn') this.websiteWasLeft = true;
  }

  resumeAfterWebsite(time: number): boolean {
    if (!this.canResumeAfterWebsite) return false;
    this.websiteWasLeft = false;
    this.beginDialogue('warning', time);
    return true;
  }

  closeDialogue(): void {
    if (this.dialoguePhase === 'playing' || this.dialoguePhase === 'choice') {
      this.dialoguePhase = 'idle';
    }
    this.stopVoices();
  }

  update(deltaTime: number, time: number): void {
    this.updateEntrance(deltaTime);
    if (this.dialoguePhase !== 'playing') return;

    const lines = DIALOGUES[this.dialogueSequence];
    const lineDuration = DIALOGUE_DURATION[this.dialogueSequence] / lines.length;
    const nextLineIndex = Math.floor((time - this.dialogueStartedAt) / lineDuration);
    if (nextLineIndex >= lines.length) {
      this.completedWhileNearby = true;
      this.stopVoices();
      if (this.dialogueSequence === 'welcome') {
        this.dialoguePhase = 'choice';
        this.view.showOptions();
      } else {
        this.dialoguePhase = 'complete';
        this.view.closeDialogue();
      }
      return;
    }
    if (nextLineIndex !== this.dialogueLineIndex) this.showLine(nextLineIndex);
  }

  private updateEntrance(deltaTime: number): void {
    if (!this.isEntering) return;
    this.entranceElapsed = Math.min(ENTRANCE_DURATION, this.entranceElapsed + deltaTime);
    const progress = this.entranceElapsed / ENTRANCE_DURATION;
    this.y = CAVE_SIBLINGS.startY + (CAVE_SIBLINGS.endY - CAVE_SIBLINGS.startY) * progress;
    this.walkFrame = Math.min(
      CAVE_SIBLINGS_WALK_FRAMES.length - 1,
      Math.floor(progress * CAVE_SIBLINGS_WALK_FRAMES.length),
    );
    this.darknessAlpha = 1 - (1 - FINAL_DARKNESS_ALPHA) * progress;
  }

  private beginDialogue(sequence: DialogueSequence, time: number): void {
    this.stopVoices();
    this.startedVoices.clear();
    this.dialogueSequence = sequence;
    this.dialogueStartedAt = time;
    this.dialogueLineIndex = -1;
    this.dialoguePhase = 'playing';
    this.showLine(0);
  }

  private showLine(index: number): void {
    const dialogue = DIALOGUES[this.dialogueSequence][index];
    if (!dialogue) return;
    this.dialogueLineIndex = index;
    this.view.showLine(dialogue);
    if (this.startedVoices.has(dialogue.speaker)) return;
    this.startedVoices.add(dialogue.speaker);
    void this.voices[dialogue.speaker].play().catch(() => {
      // Browsers may reject audio until movement provides a keyboard or pointer gesture.
    });
  }

  private stopVoices(): void {
    Object.values(this.voices).forEach((voice) => {
      voice.pause();
      voice.currentTime = 0;
    });
  }
}
