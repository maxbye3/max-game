import { readStorage, writeStorage } from './storage.js';

interface CinemaAudienceView {
  readonly openDialogue: (line: string) => void;
  readonly closeDialogue: () => void;
}

const DIALOGUE_INDEX_KEY = 'max-game:cinema-audience-dialogue-index';
const INTERACTION_DISTANCE = 78;
const AUDIENCE = [
  { x: 153, y: 373 },
  { x: 207, y: 375 },
  { x: 262, y: 373 },
  { x: 153, y: 440 },
  { x: 207, y: 441 },
  { x: 262, y: 440 },
] as const;
const DIALOGUE_LINES = [
  'Shhh!', "The film's on.", 'This is where it gets good.', 'I need to pee.',
  'Got any popcorn?', 'This film is long.', 'Is that Nicolas Cage?', 'Move your head.',
  "You're blocking the screen.", 'What did they say?', "Wait, who's that?",
  "Who's the bad guy again?", 'No spoilers!', 'Have you seen this before?',
  'This bit is scary.', 'That was disgusting.', 'That was actually pretty funny.',
  'This film is weird.', "I have no idea what's happening.", "I'm so confused.",
  'How long is left?', "I'm getting tired.", 'Can you pass the popcorn?',
  "You've eaten all the popcorn.", 'Got any sweets?', 'Stop rustling the bag.',
  'Turn your phone off.', 'That screen is so bright.', 'Why is everyone laughing?',
  "That wasn't funny.", "There's no way he'd survive that.",
  'That makes absolutely no sense.', 'Why would you go in there?', "Don't open the door!",
  'Behind you!', 'Run!', "He's definitely dead.", "She's definitely not dead.",
  'Called it.', 'Oh come on.', 'That was brutal.', 'This soundtrack is great.',
  'I think someone kicked my chair.', 'Stop kicking my chair.', "I'm going to the toilet.",
  'Tell me what I miss.', 'You missed the best bit.', "He's obviously evil.",
  'Is there a post-credit scene?', "That's it?",
] as const;

export class CinemaAudienceController {
  private nearbyAudienceIndex: number | null = null;
  private fallbackDialogueIndex = 0;

  constructor(private readonly view: CinemaAudienceView) {}

  update(playerX: number, playerY: number, dialogueOpen: boolean): void {
    const nextAudienceIndex = AUDIENCE
      .map((member, index) => ({ index, distance: Math.hypot(playerX - member.x, playerY - member.y) }))
      .filter(({ distance }) => distance <= INTERACTION_DISTANCE)
      .sort((first, second) => first.distance - second.distance)[0]?.index ?? null;
    if (nextAudienceIndex === this.nearbyAudienceIndex) return;

    const previousAudienceIndex = this.nearbyAudienceIndex;
    this.nearbyAudienceIndex = nextAudienceIndex;
    if (previousAudienceIndex !== null && dialogueOpen) this.view.closeDialogue();
    if (nextAudienceIndex !== null) this.view.openDialogue(this.nextDialogueLine());
  }

  private nextDialogueLine(): string {
    const stored = Number.parseInt(
      readStorage(DIALOGUE_INDEX_KEY) ?? String(this.fallbackDialogueIndex),
      10,
    );
    const current = Number.isFinite(stored) && stored >= 0 ? stored % DIALOGUE_LINES.length : 0;
    const next = (current + 1) % DIALOGUE_LINES.length;
    this.fallbackDialogueIndex = next;
    writeStorage(DIALOGUE_INDEX_KEY, String(next));
    return DIALOGUE_LINES[current] ?? '';
  }
}
