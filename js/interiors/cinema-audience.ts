import { getTimCinemaDialogue } from '../characters/tim/tim-cinema-dialogue.js';
import { isTimAtCinema } from '../characters/tim/tim-location.js';
import { nextDialogueVisitIndex } from '../core/dialogue-visit.js';

interface CinemaAudienceView {
  readonly openDialogue: (line: string, index: number, total: number, speaker: 'Tim' | 'cinema audience', highlight?: string) => void;
  readonly closeDialogue: () => void;
}

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
  'this is a double feature',
  'the first film was made in 2003',
  'max sure made people do some weird stuff back in the day',
  'the next film is 2013. It got him a job at rebel minds',
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
  private timFollowUpPending = false;

  constructor(private readonly view: CinemaAudienceView) {}

  update(playerX: number, playerY: number, dialogueOpen: boolean, characterNearby = false): void {
    if (characterNearby) {
      this.nearbyAudienceIndex = null;
      this.timFollowUpPending = false;
      return;
    }
    const nextAudienceIndex = AUDIENCE
      .map((member, index) => ({ index, distance: Math.hypot(playerX - member.x, playerY - member.y) }))
      .filter(({ distance }) => distance <= INTERACTION_DISTANCE)
      .sort((first, second) => first.distance - second.distance)[0]?.index ?? null;
    if (nextAudienceIndex === this.nearbyAudienceIndex) return;

    const previousAudienceIndex = this.nearbyAudienceIndex;
    this.nearbyAudienceIndex = nextAudienceIndex;
    this.timFollowUpPending = false;
    if (previousAudienceIndex !== null && dialogueOpen) this.view.closeDialogue();
    if (nextAudienceIndex !== null) {
      if (nextAudienceIndex === 1 && isTimAtCinema()) {
        const hint = getTimCinemaDialogue();
        this.timFollowUpPending = true;
        this.view.openDialogue(hint ? hint.opening + hint.highlight + hint.ending : "can you not bother me right now? If your looking to help alex go south", 0, 2, 'Tim', hint?.highlight ?? 'south');
        return;
      }
      const { line, index } = this.nextDialogueLine();
      this.view.openDialogue(line, index, DIALOGUE_LINES.length, 'cinema audience');
    }
  }

  next(): boolean {
    if (!this.timFollowUpPending) return false;
    this.timFollowUpPending = false;
    this.view.openDialogue('solution is surprisingly more macabre than halloween fun', 1, 2, 'Tim', 'macabre');
    return true;
  }

  private nextDialogueLine(): { line: string; index: number } {
    const index = nextDialogueVisitIndex('cinema-audience', DIALOGUE_LINES.length);
    return { line: DIALOGUE_LINES[index] ?? '', index };
  }
}
