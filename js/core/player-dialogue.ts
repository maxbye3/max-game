import { getPlayerBody } from './player-body.js';
import { isWheldonPlayerSpriteEnabled } from './player-sprite-test.js';
import { readStorage, writeStorage } from './storage.js';

const REACTIONS = [
  'You look... transparent.',
  'Stay back, spirit!',
  "Please tell me that's a bedsheet.",
  'Nice costume... wait a minute.',
  "Please don't possess me.",
  'BOO! Ha! Got you back.',
  'Have you come to avenge your death?',
  "Well, at least you're not a zombie.",
  'You seem a little pale.',
  'Can you still eat pizza?',
  "You're looking rather... deceased.",
  "Please don't drag me into the underworld.",
  'Can I put my hand through you?',
  'Can you haunt my enemies instead?',
  'Are you going to rattle some chains or what?',
  'Have you considered moving on?',
  'Is the afterlife always this awkward?',
  'Are you haunting me or just passing through?',
  'Can you turn invisible, or is this it?',
  'Do you have unfinished business or just poor time management?',
  "I don't remember inviting the deceased.",
  'Are you allowed to leave the cemetery?',
  'You could at least pretend to have legs.',
  'Is that how you died? Embarrassing.',
  'Do you need an exorcist or a therapist?',
  'Do ghosts have to sleep?',
  "Please don't start moving the furniture.",
  'Is heaven full or something?',
  'Do you have to float everywhere? Show-off.',
  'Can you still get a sunburn?',
  'Are you haunting this house or me personally?',
  'Do you know any famous dead people?',
  "Please don't tell me how I die.",
  'Have you tried turning your afterlife off and on again?',
  'Can you possess my landlord?',
  'Is that your final form?',
  "You're awfully chatty for someone who's dead.",
  'Do you still have to pay taxes?',
  "I assume you won't be needing a chair.",
  'Do ghosts have pockets?',
  'Is the whole floating thing difficult to learn?',
  "You're giving me a very bad feeling about this house.",
  "Can you haunt someone else? I'm quite busy.",
  'Should I be screaming right now?',
  'Are you going to do something scary or just stand there?',
  'You know Halloween was months ago, right?',
  "I don't suppose you've seen my missing keys?",
  'How exactly does one become a ghost?',
  "You're not one of those Victorian ghosts, are you?",
  'Is your grave nearby? Just curious.',
  'Do you get paid for haunting?',
  'Are there any benefits to being dead?',
  'Can you walk through a locked door for me?',
  'Do mirrors work for you?',
  'I thought spirits were supposed to be intimidating.',
  'Do you have a haunting schedule?',
  'Can you stop appearing so dramatically?',
  "I don't think my therapy covers paranormal activity.",
  'Are you here about my extended car warranty?',
  'Is it rude to ask what happened to your body?',
  'Are you allergic to holy water?',
  'You seem remarkably calm about being dead.',
  "You've got something on your... never mind.",
] as const;
const ALEX_GHOST_REACTIONS = [
  "You're looking rather transparent today, Alex.",
  'Still haunting us, Alex?',
  'Looking spooky today, Alex!',
  'Alex! I thought we buried you!',
  'Oh great, Alex is haunting us again.',
  'Life after death treating you well, Alex?',
  "Alex! You're supposed to be dead!",
  'Back for more, ghost boy?',
  'You look a little pale, Alex.',
  'Spirits say Alex has returned!',
  "Alex! How's the other side?",
  "Alex, haven't you got a grave to lie in?",
  "You again? Isn't there a light you're supposed to follow?",
  'Alex! Still refusing to move on?',
  'Death clearly hasn\'t improved your punctuality, Alex.',
  "Alex, you're giving me the creeps.",
  'Did heaven reject your application, Alex?',
  'Alex! I see the exorcism didn\'t work.',
  "You're awfully lively for a dead guy, Alex.",
  'Alex, you\'re supposed to haunt the attic.',
  'Oh, Alex. I was hoping you\'d found peace.',
  'Has anyone told you you\'re dead, Alex?',
  'Alex! Stop floating through the walls!',
  'You look like you\'ve seen a ghost, Alex. Oh wait.',
  'Alex, is that ectoplasm on your shirt?',
  'Still unemployed in the afterlife, Alex?',
  'Alex! Did they kick you out of the cemetery?',
  'Have you tried simply not being dead, Alex?',
  'Alex, I thought ghosts were supposed to be scary.',
  'Don\'t you have some unfinished business, Alex?',
  'Alex! How\'s the eternal suffering going?',
  'Looking a bit see-through, Alex. Everything alright?',
  'Did you forget to stay dead again, Alex?',
  'Alex, the living are trying to have a conversation.',
  'You know, most ghosts knock first, Alex.',
  'Alex! You\'re haunting the wrong house again.',
  'Do you ever get tired of floating, Alex?',
  'Alex, the afterlife called. They want you back.',
  'You\'re dead and still showing up late, Alex?',
  'Alex! Still making poor life choices after death?',
  'You\'re not very good at resting in peace, Alex.',
  'Alex, can you stop possessing the furniture?',
  'Didn\'t we scatter your ashes already, Alex?',
  'Alex! What a pleasant supernatural disturbance.',
  'You smell surprisingly normal for a corpse, Alex.',
  'Alex, do ghosts pay rent?',
  'Still clinging to the mortal world, Alex?',
  'Alex! I thought we\'d settled this with a priest.',
  'You\'re looking positively deceased today, Alex.',
  'Alex, shouldn\'t you be rattling chains somewhere?',
  'Did you come back just to annoy us, Alex?',
  'Alex! You\'re the least intimidating ghost I\'ve met.',
  'Does being dead count as a day off, Alex?',
  'Alex, your funeral was lovely. Shame you missed it.',
  'Oh look, everyone\'s least favourite apparition.',
  'Alex! Have you considered haunting someone else?',
  'You\'re surprisingly chatty for a lost soul, Alex.',
  'Alex, the Ouija board wasn\'t an invitation.',
  'Didn\'t we put a lid on your coffin, Alex?',
  'Alex! How\'s your eternal retirement?',
  'I see you\'re still taking up space, Alex. Sort of.',
  'Is the Wi-Fi better in the afterlife, Alex?',
  'Alex, you\'re making the room colder again.',
  'Did the Grim Reaper lose your paperwork, Alex?',
  'Alex! Still not taking the hint from the universe?',
  'You\'re really milking this whole death thing, Alex.',
  'Alex, have you considered a second funeral?',
  'Even as a ghost, you can\'t leave us alone, Alex?',
  'Alex! Please tell me that\'s not your skeleton.',
  'How many times do we have to bury you, Alex?',
  'Alex, your haunting privileges have been revoked.',
] as const;

const INDEX_KEY = 'max-game:ghost-dialogue-index';
const storedIndex = Number(readStorage(INDEX_KEY));
let reactionIndex = Number.isSafeInteger(storedIndex) && storedIndex >= 0
  ? storedIndex % REACTIONS.length : 0;
const ALEX_GHOST_INDEX_KEY = 'max-game:alex-ghost-dialogue-index';
const storedAlexGhostIndex = Number(readStorage(ALEX_GHOST_INDEX_KEY));
let alexGhostReactionIndex = Number.isSafeInteger(storedAlexGhostIndex) && storedAlexGhostIndex >= 0
  ? storedAlexGhostIndex % ALEX_GHOST_REACTIONS.length : 0;
const ALEX_GREETINGS = [
  'Hey Alex!',
  'Hi Alex!',
  'Hello Alex!',
  'Good to see you, Alex!',
  "What's up, Alex?",
  'Yo Alex!',
  'Howdy, Alex!',
] as const;
const ALEX_INDEX_KEY = 'max-game:alex-dialogue-index';
const storedAlexIndex = Number(readStorage(ALEX_INDEX_KEY));
let alexGreetingIndex = Number.isSafeInteger(storedAlexIndex) && storedAlexIndex >= 0
  ? storedAlexIndex % ALEX_GREETINGS.length : 0;
const prefixes = new WeakMap<HTMLElement, HTMLParagraphElement>();
const reactionObservers = new WeakMap<HTMLElement, MutationObserver>();

/** Prepend one reaction per conversation, leaving its dialogue and choices intact. */
export function prependPlayerReaction(line: HTMLElement): void {
  reactionObservers.get(line)?.disconnect();
  reactionObservers.delete(line);
  let prefix = prefixes.get(line);
  const body = getPlayerBody();
  const ghost = body === 'ghost';
  const ghostAlex = ghost && isWheldonPlayerSpriteEnabled();
  const alex = body === 'alex-s' || (body === 'player' && isWheldonPlayerSpriteEnabled());
  if (!ghost && !alex) {
    if (prefix) prefix.hidden = true;
    return;
  }
  if (!prefix) {
    prefix = document.createElement('p');
    prefix.className = 'player-dialogue-reaction';
    (line.closest('.dialogue-line-row') ?? line).before(prefix);
    prefixes.set(line, prefix);
  }
  if (ghost) {
    if (ghostAlex) {
      prefix.textContent = ALEX_GHOST_REACTIONS[alexGhostReactionIndex] ?? ALEX_GHOST_REACTIONS[0];
      alexGhostReactionIndex = (alexGhostReactionIndex + 1) % ALEX_GHOST_REACTIONS.length;
      writeStorage(ALEX_GHOST_INDEX_KEY, String(alexGhostReactionIndex));
    } else {
      prefix.textContent = REACTIONS[reactionIndex] ?? REACTIONS[0];
      reactionIndex = (reactionIndex + 1) % REACTIONS.length;
      writeStorage(INDEX_KEY, String(reactionIndex));
    }
  } else {
    prefix.textContent = ALEX_GREETINGS[alexGreetingIndex] ?? ALEX_GREETINGS[0];
    alexGreetingIndex = (alexGreetingIndex + 1) % ALEX_GREETINGS.length;
    writeStorage(ALEX_INDEX_KEY, String(alexGreetingIndex));
  }
  prefix.hidden = false;
  if (ghost) {
    const reaction = prefix;
    const observer = new MutationObserver(() => {
      reaction.hidden = true;
      observer.disconnect();
      reactionObservers.delete(line);
    });
    reactionObservers.set(line, observer);
    // The caller fills in the opening line synchronously after adding the reaction.
    queueMicrotask(() => {
      if (reactionObservers.get(line) === observer) {
        observer.observe(line, { childList: true, characterData: true, subtree: true });
      }
    });
  }
}
