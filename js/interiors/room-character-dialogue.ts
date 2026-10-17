import { getPlayerBody } from '../core/player-body.js';
import { createGameAudio } from '../core/audio-mute.js';
import { requireElement } from '../core/dom.js';
import { HELEN_DIALOGUE_LINES } from '../generated/dialogues/helen-dialogue.js';
import { NOEL_DIALOGUE_LINES } from '../generated/dialogues/noel-dialogue.js';
import { setProfileImage } from '../core/profile-images.js';
import { beginDialogueAudio } from '../core/dialogue-audio.js';
import { nextDialogueVisitIndex } from '../core/dialogue-visit.js';
import { addGift, hasGift, HELEN_ITEM, NOEL_ITEM } from '../core/inventory-gifts.js';
import { getUnlockedSongs, unlockSong } from './music-library.js';
import { WHELDON_DIALOGUE_LINES } from '../generated/dialogues/wheldon-dialogue.js';

export type RoomCharacterKind = 'noel' | 'wheldon' | 'helen' | 'minnie' | 'buzz' | 'tigger' | 'socks';
interface RoomDialogueCallbacks {
  readonly open: () => void;
  readonly close: () => void;
  readonly isActive: (kind: RoomCharacterKind) => boolean;
}
export function createRoomCharacterDialogue({ open: openNoelDialogue, close: closeNoelDialogue, isActive }: RoomDialogueCallbacks) {
  const interactionPrompt = requireElement<HTMLButtonElement>('#interaction-prompt');
  const noelDialogue = requireElement<HTMLElement>('#noel-dialogue');
  const noelSpeaker = requireElement<HTMLElement>('#noel-speaker');
  const noelDialogueLine = requireElement<HTMLElement>('#noel-dialogue-line');
  const noelDialogueProfile = requireElement<HTMLImageElement>('#noel-dialogue-profile');
  const noelDialogueProgress = requireElement<HTMLElement>('#noel-dialogue-progress');
  const noelGiftConfirmation = requireElement<HTMLElement>('#noel-gift-confirmation');
  const noelDialogueNext = requireElement<HTMLButtonElement>('#noel-dialogue-next');
  const noelDialogueQuestion = requireElement<HTMLElement>('#noel-dialogue-question');
  const noelDialogueOptions = requireElement<HTMLElement>('#noel-dialogue-options');
  const noelGameOptions = requireElement<HTMLElement>('#noel-game-options');
  const siblingsDialogueOptions = requireElement<HTMLElement>('#siblings-dialogue-options');
  const musicDialogueOptions = requireElement<HTMLElement>('#music-dialogue-options');
  const wheldonNoButton = requireElement<HTMLButtonElement>('#wheldon-no');
  const wheldonYesButton = requireElement<HTMLButtonElement>('#wheldon-yes');
  const possessAlexButton = requireElement<HTMLButtonElement>('#possess-room-alex');
  const wheldonHungryAudio = createGameAudio('../char/alex-w/sounds/hungry.m4a');
  const helenReadingOptions = requireElement<HTMLElement>('#helen-reading-options');
  type NoelDialogueStage = 'opening' | 'question' | 'decline' | 'reward' | 'done';
  let noelDialogueStage: NoelDialogueStage = 'done';
  let noelRewardQueue: ('item' | 'song')[] = [];
  let helenDialogueLineIndex = 0;
  type WheldonDialogueStage = 'opening' | 'question' | 'answer' | 'final' | 'done';
  let wheldonDialogueStage: WheldonDialogueStage = 'done';
  let helenReadingOfferPending = false;
  const NOEL_GAME_URL = 'https://maxbye.co/stealth-game/';
  const NOEL_SONG = 'bleep-blops';
  const CAT_DIALOGUE: Readonly<Record<'minnie' | 'buzz' | 'tigger' | 'socks', { name: string; line: string }>> = {
    minnie: { name: 'Minnie', line: 'Meow meow. I kill everything and I\'m a total diva' },
    buzz: { name: 'Buzz', line: 'Woof. I mean... Meow.' },
    tigger: { name: 'Tigger', line: 'Meow meow stomach scratch now meow' },
    socks: { name: 'Socks', line: 'Food now. Feed me. Meow. Seriously food.' },
  };
  function showWheldonQuestion(): void {
    wheldonDialogueStage = 'question';
    noelDialogueLine.textContent = '';
    noelDialogueProgress.hidden = true;
    noelDialogueNext.hidden = true;
    noelDialogueQuestion.textContent = WHELDON_DIALOGUE_LINES[1];
    wheldonYesButton.textContent = 'Yes';
    wheldonNoButton.textContent = 'No';
    possessAlexButton.hidden = getPlayerBody() !== 'ghost';
    noelDialogueQuestion.hidden = false;
    noelDialogueOptions.hidden = false;
  }
  function showWheldonAnswer(wantsToRead: boolean): void {
    wheldonDialogueStage = 'answer';
    noelDialogueLine.textContent = WHELDON_DIALOGUE_LINES[wantsToRead ? 2 : 3];
    noelDialogueProgress.hidden = true;
    noelDialogueNext.hidden = false;
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    noelGiftConfirmation.hidden = true;
  }
  function showWheldonFinalLine(): void {
    wheldonDialogueStage = 'final';
    noelDialogueLine.textContent = WHELDON_DIALOGUE_LINES[4];
    noelDialogueProgress.hidden = true;
    noelDialogueNext.hidden = true;
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    noelGiftConfirmation.hidden = true;
  }
  function startNoelDialogue(): void {
    openNoelDialogue();
    beginDialogueAudio('Noel', '../');
    const index = nextDialogueVisitIndex('noel', NOEL_DIALOGUE_LINES.length);
    noelDialogueStage = 'opening';
    noelSpeaker.textContent = 'Noel';
    setProfileImage(noelDialogueProfile, 'Noel', '../');
    noelDialogueLine.textContent = NOEL_DIALOGUE_LINES[index] ?? '';
    noelDialogueProgress.textContent = `${index + 1}/${NOEL_DIALOGUE_LINES.length}`;
    noelDialogueProgress.hidden = false;
    noelDialogueNext.hidden = false;
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    noelGameOptions.hidden = true;
    noelGiftConfirmation.hidden = true;
    noelDialogue.hidden = false;
    interactionPrompt.hidden = true;
  }
  function showNoelGameQuestion(): void {
    noelDialogueStage = 'question';
    noelDialogueLine.textContent = '';
    noelDialogueProgress.hidden = true;
    noelDialogueNext.hidden = true;
    noelDialogueQuestion.textContent = "Play a game where I'm the protagonist";
    noelDialogueQuestion.hidden = false;
    noelGameOptions.hidden = false;
  }
  function showNextNoelReward(): void {
    const reward = noelRewardQueue.shift();
    if (!reward) { closeNoelDialogue(); return; }
    noelDialogueStage = 'reward';
    noelDialogueQuestion.hidden = true;
    noelGameOptions.hidden = true;
    noelDialogueProgress.hidden = true;
    noelDialogueNext.hidden = false;
    noelGiftConfirmation.hidden = true;
    if (reward === 'item') {
      noelDialogueLine.textContent = 'Here, take my item.';
      const added = addGift(NOEL_ITEM);
      noelGiftConfirmation.textContent = added ? "Noel’s item was added to your inventory." : '';
      noelGiftConfirmation.hidden = !added;
      return;
    }
    noelDialogueLine.textContent = `And here’s ${NOEL_SONG}.`;
    const unlocked = unlockSong(NOEL_SONG);
    noelGiftConfirmation.textContent = `${NOEL_SONG} was added to your music playlist.`;
    noelGiftConfirmation.hidden = !unlocked;
  }
  function chooseNoelGame(accept: boolean): void {
    if (!isActive('noel') || noelDialogueStage !== 'question') return;
    if (accept) window.open(NOEL_GAME_URL, '_blank', 'noopener,noreferrer');
    noelGameOptions.hidden = true;
    noelDialogueQuestion.hidden = true;
    noelRewardQueue = [];
    if (!hasGift(NOEL_ITEM)) noelRewardQueue.push('item');
    if (!getUnlockedSongs().includes(NOEL_SONG)) noelRewardQueue.push('song');
    if (!accept) {
      noelDialogueStage = 'decline';
      noelDialogueLine.textContent = 'ah. I haven’t actually finished it either';
      noelDialogueNext.hidden = false;
      return;
    }
    showNextNoelReward();
  }
  function startWheldonDialogue(): void {
    openNoelDialogue(); beginDialogueAudio('Alex W', '../');
    wheldonHungryAudio.currentTime = 0;
    window.dispatchEvent(new CustomEvent('max-game:temporary-audio-focus', { detail: true }));
    const resumeAmbience = (): void => { window.dispatchEvent(new CustomEvent('max-game:temporary-audio-focus', { detail: false })); };
    wheldonHungryAudio.addEventListener('ended', resumeAmbience, { once: true });
    void wheldonHungryAudio.play().catch(() => {
      // The browser may block playback until the player has interacted with the page.
      wheldonHungryAudio.removeEventListener('ended', resumeAmbience);
      resumeAmbience();
    });
    wheldonDialogueStage = 'opening';
    noelSpeaker.textContent = 'Alex'; setProfileImage(noelDialogueProfile, 'Alex W', '../');
    noelDialogueLine.textContent = WHELDON_DIALOGUE_LINES[0];
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    noelDialogueProgress.hidden = true;
    noelDialogueNext.hidden = false;
    noelDialogue.hidden = false;
    interactionPrompt.hidden = true;
  }
  function startCatDialogue(kind: 'minnie' | 'buzz' | 'tigger' | 'socks'): void {
    const cat = CAT_DIALOGUE[kind];
    openNoelDialogue(); beginDialogueAudio(undefined, '../');
    noelSpeaker.textContent = cat.name;
    setProfileImage(noelDialogueProfile, cat.name, '../');
    noelDialogueLine.textContent = cat.line;
    noelDialogueQuestion.hidden = true;
    noelDialogueOptions.hidden = true;
    noelDialogueProgress.hidden = true;
    noelDialogueNext.hidden = true;
    noelDialogue.hidden = false;
    interactionPrompt.hidden = true;
  }
  function showHelenDialogue(): void { noelDialogueLine.textContent = HELEN_DIALOGUE_LINES[helenDialogueLineIndex] ?? ''; noelDialogueProgress.textContent = `${helenDialogueLineIndex + 1}/${HELEN_DIALOGUE_LINES.length}`; noelDialogueProgress.hidden = false; noelDialogueNext.hidden = false; }
  function showHelenReadingOffer(): void {
    helenReadingOfferPending = false;
    noelDialogueLine.textContent = 'Would you like to see what Max is reading?';
    noelDialogueProgress.hidden = true; noelDialogueNext.hidden = true; helenReadingOptions.hidden = false;
    if (addGift(HELEN_ITEM)) {
      noelGiftConfirmation.textContent = "Helen's item was added to your inventory.";
      noelGiftConfirmation.hidden = false;
    }
  }
  function startHelenDialogue(): void { openNoelDialogue(); beginDialogueAudio('Helen', '../'); helenDialogueLineIndex = nextDialogueVisitIndex('helen', HELEN_DIALOGUE_LINES.length); helenReadingOfferPending = true; noelSpeaker.textContent = 'Helen'; setProfileImage(noelDialogueProfile, 'Helen', '../'); showHelenDialogue(); noelDialogueQuestion.hidden = true; noelDialogueOptions.hidden = true; siblingsDialogueOptions.hidden = true; musicDialogueOptions.hidden = true; helenReadingOptions.hidden = true; noelDialogue.hidden = false; interactionPrompt.hidden = true; }
  requireElement<HTMLButtonElement>('#noel-game-yes').addEventListener('click', () => chooseNoelGame(true));
  requireElement<HTMLButtonElement>('#noel-game-no').addEventListener('click', () => chooseNoelGame(false));
  wheldonYesButton.addEventListener('click', () => showWheldonAnswer(true));
  wheldonNoButton.addEventListener('click', () => showWheldonAnswer(false));
  return {
    start(kind: RoomCharacterKind): void {
      if (kind === 'noel') startNoelDialogue();
      else if (kind === 'wheldon') startWheldonDialogue();
      else if (kind === 'helen') startHelenDialogue();
      else startCatDialogue(kind);
    },
    next(kind: RoomCharacterKind): void {
      if (kind === 'noel') {
        if (noelDialogueStage === 'opening') showNoelGameQuestion();
        else if (noelDialogueStage === 'decline' || noelDialogueStage === 'reward') showNextNoelReward();
      } else if (kind === 'wheldon') {
        if (wheldonDialogueStage === 'opening') showWheldonQuestion();
        else if (wheldonDialogueStage === 'answer') showWheldonFinalLine();
      } else if (kind === 'helen') {
        if (helenDialogueLineIndex < HELEN_DIALOGUE_LINES.length - 1) { helenDialogueLineIndex += 1; showHelenDialogue(); }
        else if (helenReadingOfferPending) showHelenReadingOffer();
      }
    },
    stop(): void { noelDialogueStage = 'done'; noelRewardQueue = []; wheldonDialogueStage = 'done'; },
    get isWheldonQuestion(): boolean { return wheldonDialogueStage === 'question'; },
  };
}
