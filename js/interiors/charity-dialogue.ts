export type CharityNpc = 'charity-cook' | 'charity-computer' | 'charity-teacher';

export function isCharityNpc(kind: string | null): kind is CharityNpc {
  return kind === 'charity-cook' || kind === 'charity-computer' || kind === 'charity-teacher';
}

const CONVERSATIONS = {
  'charity-cook': {
    speaker: 'Man cooking',
    lines: [
      "hey, max regularly works at Miriam's Kitchen",
      "If you visit you should try a shift though I hear he's a bit of a stickler now that he's made sous",
      "If you're interested in learning more please go to visit the website and get involved it's a wonderful institution",
    ],
    choiceLine: 2, yes: "I'll check it out right now", no: 'not now',
    url: 'https://miriamskitchen.org',
  },
  'charity-computer': {
    speaker: 'Man on the computer',
    lines: [
      'Wanna see the website Max made for people without work in DC?',
      "He's currently working with Refraction in his spare time.",
      "Get him to show you when you visit. It's an amazing space!",
    ],
    choiceLine: 0, yes: 'yes', no: 'no',
    url: 'https://2026-07-18-create-a-github-project.vercel.app/#',
  },
  'charity-teacher': {
    speaker: 'Woman behind counter',
    lines: [
      'こんにちは！日本語を勉強してみませんか？',
      '毎日このページをチェックできるように、ブックマークしてね！マックスの連続記録を超えられるかな？',
    ],
    choiceLine: 0, yes: 'はい！', no: 'いいえ',
    url: 'https://maxbye.co/japanese/',
  },
} as const;

interface DialogueElements {
  dialogue: HTMLElement;
  speaker: HTMLElement;
  line: HTMLElement;
  profile: HTMLImageElement;
  progress: HTMLElement;
  next: HTMLButtonElement;
}

export class CharityDialogueController {
  private active: CharityNpc | null = null;
  private index = 0;
  private readonly choices = document.createElement('div');

  constructor(
    private readonly elements: DialogueElements,
    private readonly open: () => void,
    private readonly close: () => void,
  ) {
    this.choices.className = 'npc-dialogue-options';
    this.choices.hidden = true;
    elements.dialogue.append(this.choices);
  }

  start(kind: CharityNpc): void {
    this.active = kind;
    this.index = 0;
    this.open();
    this.elements.speaker.textContent = CONVERSATIONS[kind].speaker;
    this.elements.profile.hidden = true;
    this.elements.profile.removeAttribute('src');
    this.elements.profile.alt = '';
    this.elements.dialogue.hidden = false;
    this.showLine();
  }

  next(): void {
    if (!this.active || !this.choices.hidden) return;
    this.advance();
  }

  stop(): void {
    this.active = null;
    this.choices.hidden = true;
    this.elements.line.removeAttribute('lang');
  }

  private advance(): void {
    if (!this.active) return;
    if (this.index + 1 >= CONVERSATIONS[this.active].lines.length) {
      this.close();
      return;
    }
    this.index += 1;
    this.showLine();
  }

  private showLine(): void {
    if (!this.active) return;
    const conversation = CONVERSATIONS[this.active];
    const { line, progress, next } = this.elements;
    line.textContent = conversation.lines[this.index] ?? '';
    line.lang = this.active === 'charity-teacher' ? 'ja' : 'en';
    progress.textContent = `${this.index + 1}/${conversation.lines.length}`;
    progress.hidden = false;
    const hasChoice = this.index === conversation.choiceLine;
    next.hidden = hasChoice;
    this.choices.hidden = !hasChoice;
    this.choices.replaceChildren();
    if (!hasChoice) return;
    for (const [label, accepts] of [[conversation.yes, true], [conversation.no, false]] as const) {
      const button = document.createElement('button');
      button.type = 'button';
      button.style.minHeight = '44px';
      button.textContent = label;
      button.lang = line.lang;
      button.addEventListener('click', () => {
        if (!this.active || this.choices.hidden) return;
        if (accepts) window.open(conversation.url, '_blank', 'noopener,noreferrer');
        this.choices.hidden = true;
        this.advance();
      });
      this.choices.append(button);
    }
  }
}
