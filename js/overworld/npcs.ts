import { requireElement } from '../core/dom.js';
import { getPlayerBody } from '../core/player-body.js';
import { createGameAudio } from '../core/audio-mute.js';
import { setGeorgiaInteractionPaused } from '../characters/georgia/georgia.js';
import { addGift, hasGift, MADDY_ITEM, nextGiftLine, REI_ITEM_1, REI_ITEM_2, removeGift, type GiftItem } from '../core/inventory-gifts.js';
import { MADDY_DIALOGUE_LINES } from '../generated/dialogues/maddy-dialogue.js';
import { announceWorldInteraction } from '../core/world-interactions.js';
import { hideSignDialogue } from '../core/signs.js';
import { readStorage, writeStorage } from '../core/storage.js';
import { setProfileImage } from '../core/profile-images.js';
import { hasMikeAftermath } from '../core/world-state.js';
import { getSongArtwork, getUnlockedSongs, unlockSong, type Song } from '../interiors/music-library.js';
import { beginDialogueAudio, endDialogueAudio } from '../core/dialogue-audio.js';
import { nextDialogueVisitIndex } from '../core/dialogue-visit.js';
import { prependPlayerReaction } from '../core/player-dialogue.js';
import { isOscarEaten, oscarCharacterId } from '../powers/oscar/oscar-power.js';
import { releaseAllInput } from '../core/input.js';
import { characterAsset } from '../core/character-assets.js';
import { refreshLetterboxdReviews } from '../core/letterboxd-reviews.js';
import { NPCS, type NpcDefinition } from './npc-definitions.js';
export * from './npc-definitions.js';

const dialogue = requireElement<HTMLElement>('#npc-dialogue');
const speaker = requireElement<HTMLElement>('#npc-speaker');
const dialogueLine = requireElement<HTMLElement>('#npc-dialogue-line');
const dialogueProfile = requireElement<HTMLImageElement>('#npc-dialogue-profile');
const dialogueProgress = requireElement<HTMLElement>('#npc-dialogue-progress');
const giftConfirmation = requireElement<HTMLElement>('#npc-gift-confirmation');
const closeButton = requireElement<HTMLButtonElement>('#npc-dialogue-close');
const nextButton = requireElement<HTMLButtonElement>('#npc-dialogue-next');
const oscarOptions = requireElement<HTMLElement>('#oscar-dialogue-options');
const aliceOptions = requireElement<HTMLElement>('#alice-dialogue-options');
const rubyOptions = requireElement<HTMLElement>('#ruby-dialogue-options');
const gameShell = requireElement<HTMLElement>('.game-shell');
const maddyDialogueAudio = createGameAudio(characterAsset('maddy', 'dialogueAudio'));
maddyDialogueAudio.preload = 'none';
const rubyDialogueAudio = createGameAudio();
rubyDialogueAudio.loop = false;
let maddyDisplayedLineIndex = -1;

function showMaddyTimedLine(index: number): void {
  if (index <= maddyDisplayedLineIndex) return;
  maddyDisplayedLineIndex = index;
  dialogueLine.textContent = MADDY_DIALOGUE_LINES[index] ?? '';
  dialogueProgress.textContent = `${index + 1}/${MADDY_DIALOGUE_LINES.length}`;
  dialogueProgress.hidden = false;
}

function updateMaddyTimedLine(): void {
  if (activeNpc?.id !== 'maddy') return;
  const time = maddyDialogueAudio.currentTime;
  const index = time >= 7 ? 2 : time >= 2 ? 1 : 0;
  showMaddyTimedLine(index);
}

const QUEST_ACCEPTED_OVERLAY_DURATION = 3200;
const REI_BILLBOARD_COMPLETE_LINE = 'By the way, don’t worry, I actually found all of this red paint, so I was able to finish the billboard.';
const REI_GIFT_STAGE_KEY = 'max-game:rei-gift-stage';

interface StagedGifts {
  readonly stageKey: string;
  readonly first: GiftItem;
  readonly second: GiftItem;
}

const REI_GIFTS: StagedGifts = { stageKey: REI_GIFT_STAGE_KEY, first: REI_ITEM_1, second: REI_ITEM_2 };

export function resetNpcGiftProgress(): void {
  writeStorage(REI_GIFT_STAGE_KEY, '0');
  removeGift(REI_ITEM_1);
  removeGift(REI_ITEM_2);
}

function giftStage({ stageKey, first, second }: StagedGifts): number {
  // Owned items also establish progress for saves created before stage tracking.
  const stored = Number.parseInt(readStorage(stageKey) ?? '0', 10);
  return Math.max(Number.isFinite(stored) ? stored : 0, hasGift(second) ? 2 : hasGift(first) ? 1 : 0);
}

function nextStagedGift(gifts: StagedGifts): GiftItem | null {
  // Quest history must not prevent replacing a gift that left the inventory.
  if (!hasGift(gifts.first)) return gifts.first;
  return !hasGift(gifts.second) ? gifts.second : null;
}

let activeNpc: NpcDefinition | null = null;
let pendingRequestLine: string | null = null;
let pendingFollowUpLine: string | null = null;
let pendingGiftLine: string | null = null;
let pendingGiftItem: GiftItem | null = null;
let pendingGiftConfirmation: string | null = null;
let pendingFixtureLine: (() => Promise<string>) | null = null;
let pendingSongReward: Song | null = null;
let dialogueSession = 0;
let fixtureLoading = false;
let currentDialogueLineIndex = 0;
let requestLineShown = false;
let nearbyNpc: NpcDefinition | null = null;
let reiCompletionStage: 'intro' | 'explanation' | 'thanks' | null = null;
let rubyStage: 'opening' | 'question' | 'decline' | 'final' | null = null;

function showRubyLine(stage: NonNullable<typeof rubyStage>): void {
  if (activeNpc?.id !== 'ruby') return;
  rubyStage = stage;
  const lineIndex = { opening: 0, question: 1, decline: 2, final: 3 }[stage];
  dialogueLine.textContent = activeNpc.dialogueLines[lineIndex] ?? '';
  dialogueProgress.hidden = true;
  giftConfirmation.hidden = true;
  rubyOptions.hidden = stage !== 'question';
  nextButton.hidden = stage === 'question' || (stage === 'final' && pendingSongReward === null);
  const voiceAsset = { opening: 'dialogueAudioOne', question: 'dialogueAudioTwo', decline: 'dialogueAudioThree', final: 'dialogueAudioFour' }[stage];
  rubyDialogueAudio.pause();
  rubyDialogueAudio.src = `${characterAsset('ruby', voiceAsset)}?v=quieter-2`;
  rubyDialogueAudio.currentTime = 0;
  void rubyDialogueAudio.play().catch(() => {
    // Browsers may require a player gesture before playing dialogue audio.
  });
}

function chooseRubyVideos(accept: boolean): void {
  if (activeNpc?.id !== 'ruby' || rubyStage !== 'question') return;
  showRubyLine(accept ? 'final' : 'decline');
}

export function isNpcDialogueOpen(): boolean {
  return activeNpc !== null;
}

function showQuestOverlay(imageSource: string, additionalClass = '', soundSource = 'audio/map/mission-accept.mp3'): void {
  const overlay = document.createElement('div');
  overlay.className = `quest-accepted-overlay ${additionalClass}`.trim();
  overlay.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.src = imageSource;
  image.alt = '';
  overlay.append(image);
  gameShell.append(overlay);
  window.setTimeout(() => overlay.remove(), QUEST_ACCEPTED_OVERLAY_DURATION);

  const sound = createGameAudio(soundSource);
  sound.preload = 'none';
  void sound.play().catch(() => {
    // Browsers may reject audio until a keyboard or pointer gesture.
  });
}

function showQuestAcceptedOverlay(): void {
  showQuestOverlay('img/external/quest_accepted.png');
}

function showQuestCompleteOverlay(): void {
  showQuestOverlay('img/external/quest-complete.png', '', 'audio/map/mission_success.mp3');
}

function nextDialogueIndex(npc: NpcDefinition): number {
  return nextDialogueVisitIndex(npc.id, npc.dialogueLines.length);
}

function hasMoreDialogue(): boolean {
  if (!activeNpc) return false;
  if (activeNpc.id === 'rei') {
    return reiCompletionStage === null && currentDialogueLineIndex < activeNpc.dialogueLines.length - 1;
  }
  return activeNpc.dialogueLines.length > 1;
}

function closeDialogue(): void {
  dialogueSession += 1;
  fixtureLoading = false;
  pendingFixtureLine = null;
  pendingSongReward = null;
  maddyDialogueAudio.ontimeupdate = null;
  maddyDialogueAudio.onended = null;
  maddyDialogueAudio.pause();
  maddyDialogueAudio.currentTime = 0;
  rubyDialogueAudio.pause();
  rubyDialogueAudio.currentTime = 0;
  maddyDisplayedLineIndex = -1;
  endDialogueAudio();
  activeNpc = null;
  pendingRequestLine = null;
  pendingFollowUpLine = null;
  pendingGiftLine = null;
  pendingGiftItem = null;
  pendingGiftConfirmation = null;
  requestLineShown = false;
  reiCompletionStage = null;
  rubyStage = null;
  dialogue.hidden = true;
  dialogueProfile.hidden = true;
  nextButton.hidden = true;
  dialogueProgress.hidden = true;
  giftConfirmation.hidden = true;
  oscarOptions.hidden = true;
  aliceOptions.hidden = true;
  rubyOptions.hidden = true;
}

function showRequestLine(): void {
  if (!activeNpc || !pendingRequestLine) return;
  dialogueLine.textContent = pendingRequestLine;
  pendingRequestLine = null;
  requestLineShown = true;
  dialogueProgress.hidden = true;
  giftConfirmation.hidden = true;
  // Keep Next visible so the player advances to the quest prompt themselves,
  // instead of that only happening as a side effect of closing the dialogue.
  nextButton.hidden = false;
}

function showGiftLine(): void {
  if (!pendingGiftLine) return;
  dialogueLine.textContent = pendingGiftLine;
  pendingGiftLine = null;
  const giftWasAdded = pendingGiftItem ? addGift(pendingGiftItem) : false;
  if (giftWasAdded && pendingGiftItem) {
    if (pendingGiftItem.id === REI_ITEM_1.id || pendingGiftItem.id === REI_ITEM_2.id) {
      writeStorage(REI_GIFT_STAGE_KEY, pendingGiftItem.id === REI_ITEM_2.id ? '2' : '1');
    }
  }
  pendingGiftItem = null;
  dialogueProgress.hidden = true;
  giftConfirmation.textContent = giftWasAdded ? pendingGiftConfirmation : '';
  pendingGiftConfirmation = null;
  giftConfirmation.hidden = !giftWasAdded;
  nextButton.hidden = pendingSongReward === null && pendingRequestLine === null && activeNpc?.id !== 'oscar' && activeNpc?.id !== 'alice' && !hasMoreDialogue();
}

function showAliceEventQuestion(): void {
  dialogueLine.textContent = 'hey wanna check out some cool events in London or DC? Go to Event Tinder';
  dialogueProgress.hidden = true;
  giftConfirmation.hidden = true;
  nextButton.hidden = true;
  aliceOptions.hidden = false;
}

function showOscarQuestion(): void {
  dialogueLine.textContent = 'wanna play the zen garden game?';
  dialogueProgress.hidden = true;
  giftConfirmation.hidden = true;
  nextButton.hidden = true;
  oscarOptions.hidden = false;
}

function showFollowUpLine(): void {
  if (!pendingFollowUpLine) return;
  dialogueLine.textContent = pendingFollowUpLine;
  pendingFollowUpLine = null;
  dialogueProgress.hidden = true;
  nextButton.hidden = pendingGiftLine === null && pendingSongReward === null && !hasMoreDialogue();
}

function awardSong(song: Song): void {
  if (!unlockSong(song)) return;
  showQuestOverlay(getSongArtwork(song), 'item-received-overlay', 'audio/music-accepted.mp3');
  giftConfirmation.textContent = `${song} was added to your music playlist. A Walkman is required to play it.`;
  giftConfirmation.hidden = false;
}

async function showFixtureLine(): Promise<void> {
  const getFixtureLine = pendingFixtureLine;
  if (!getFixtureLine) return;
  pendingFixtureLine = null;
  const session = dialogueSession;
  fixtureLoading = true;
  dialogueProgress.hidden = true;
  dialogueLine.textContent = 'Checking Arsenal’s next game...';
  nextButton.hidden = true;
  const line = await getFixtureLine();
  // A response from an earlier conversation must not replace a new one.
  if (session !== dialogueSession || !activeNpc) return;
  fixtureLoading = false;
  dialogueLine.textContent = line;
  nextButton.hidden = pendingGiftLine === null && pendingSongReward === null && !hasMoreDialogue();
}

function showSongLine(): void {
  if (!pendingSongReward) return;
  dialogueLine.textContent = 'Here’s a song for you, too.';
  dialogueProgress.hidden = true;
  giftConfirmation.hidden = true;
  awardSong(pendingSongReward);
  pendingSongReward = null;
  nextButton.hidden = !hasMoreDialogue();
}

function acceptQuest(): void {
  requestLineShown = false;
  if (activeNpc?.id !== 'rei') {
    showQuestAcceptedOverlay();
    closeDialogue();
    return;
  }
  showQuestAcceptedOverlay();
  dialogue.hidden = true;
  nextButton.hidden = true;
  const session = dialogueSession;
  window.setTimeout(() => {
    if (session !== dialogueSession || activeNpc?.id !== 'rei') return;
    if (pendingGiftLine) showGiftLine();
    else if (pendingSongReward) showSongLine();
    else nextButton.hidden = !hasMoreDialogue();
    dialogue.hidden = false;
  }, QUEST_ACCEPTED_OVERLAY_DURATION);
}

function advanceDialogue(): void {
  if (fixtureLoading || !oscarOptions.hidden || !aliceOptions.hidden || !rubyOptions.hidden) return;
  if (activeNpc?.id === 'ruby') {
    if (rubyStage === 'opening') showRubyLine('question');
    else if (rubyStage === 'decline') showRubyLine('final');
    else if (rubyStage === 'final' && pendingSongReward) {
      showSongLine();
      nextButton.hidden = true;
    }
    return;
  }
  if (activeNpc?.id === 'alice') {
    const lines = activeNpc.dialogueLines;
    if (currentDialogueLineIndex < lines.length - 1) {
      currentDialogueLineIndex += 1;
      dialogueLine.textContent = lines[currentDialogueLineIndex] ?? '';
      dialogueProgress.textContent = `${currentDialogueLineIndex + 1}/${lines.length}`;
    } else if (pendingGiftLine) {
      showGiftLine();
    } else {
      showAliceEventQuestion();
    }
    return;
  }
  if (reiCompletionStage === 'intro') {
    reiCompletionStage = 'explanation';
    dialogueLine.textContent = REI_BILLBOARD_COMPLETE_LINE;
    dialogueProgress.hidden = true;
    nextButton.hidden = false;
  } else if (reiCompletionStage === 'explanation') {
    reiCompletionStage = 'thanks';
    dialogueLine.textContent = 'thanks anyway for the help';
    dialogueProgress.hidden = true;
    nextButton.hidden = false;
  } else if (reiCompletionStage === 'thanks') {
    showQuestCompleteOverlay();
    dialogue.hidden = true;
    nextButton.hidden = true;
    const session = dialogueSession;
    window.setTimeout(() => {
      if (session !== dialogueSession || activeNpc?.id !== 'rei') return;
      reiCompletionStage = null;
      if (pendingGiftLine) showGiftLine();
      else if (pendingSongReward) showSongLine();
      else nextButton.hidden = !hasMoreDialogue();
      dialogue.hidden = false;
    }, QUEST_ACCEPTED_OVERLAY_DURATION);
  } else if (pendingRequestLine) {
    showRequestLine();
  } else if (requestLineShown) {
    acceptQuest();
  } else if (pendingFollowUpLine) {
    showFollowUpLine();
  } else if (pendingFixtureLine) {
    void showFixtureLine();
  } else if (pendingGiftLine) {
    showGiftLine();
  } else if (pendingSongReward) {
    showSongLine();
  } else if (activeNpc?.id === 'rei' && !hasMoreDialogue()) {
    closeDialogue();
  } else if (activeNpc && activeNpc.dialogueLines.length > 1) {
    const lines = activeNpc.dialogueLines;
    if (activeNpc.id === 'oscar' && currentDialogueLineIndex === lines.length - 1) {
      showOscarQuestion();
      return;
    }
    currentDialogueLineIndex = (currentDialogueLineIndex + 1) % lines.length;
    dialogueLine.textContent = lines[currentDialogueLineIndex] ?? '';
    giftConfirmation.hidden = true;
    dialogueProgress.textContent = `${currentDialogueLineIndex + 1}/${lines.length}`;
    dialogueProgress.hidden = false;
    nextButton.hidden = !hasMoreDialogue();
  }
}

function showDialogueLine(npc: NpcDefinition): void {
  const lines = npc.dialogueLines;
  currentDialogueLineIndex = npc.id === 'rei' ? 0 : nextDialogueIndex(npc);
  dialogueLine.textContent = lines[currentDialogueLineIndex] ?? '';
  dialogueProgress.textContent = `${currentDialogueLineIndex + 1}/${lines.length}`;
  dialogueProgress.hidden = false;
}

function openDialogue(npc: NpcDefinition): void {
  announceWorldInteraction();
  releaseAllInput();
  hideSignDialogue();
  oscarOptions.hidden = true;
  aliceOptions.hidden = true;
  rubyOptions.hidden = true;
  prependPlayerReaction(dialogueLine);
  beginDialogueAudio(npc.id === 'maddy' || npc.id === 'adam' ? undefined : npc.name);
  activeNpc = npc;
  if (npc.id === 'ed') void refreshLetterboxdReviews('data/letterboxd-reviews.json');
  dialogueSession += 1;
  fixtureLoading = false;
  pendingFixtureLine = npc.getFixtureLine ?? null;
  if (npc.id === 'maddy') {
    pendingRequestLine = null;
    pendingFollowUpLine = null;
    pendingGiftLine = null;
    pendingGiftItem = null;
    pendingGiftConfirmation = null;
    requestLineShown = false;
    speaker.textContent = npc.name;
    setProfileImage(dialogueProfile, npc.name);
    maddyDisplayedLineIndex = -1;
    showMaddyTimedLine(0);
    dialogueProgress.hidden = false;
    nextButton.hidden = true;
    dialogue.hidden = false;
    maddyDialogueAudio.pause();
    maddyDialogueAudio.currentTime = 0;
    maddyDialogueAudio.ontimeupdate = updateMaddyTimedLine;
    maddyDialogueAudio.onended = () => {
      if (activeNpc?.id !== 'maddy' || hasGift(MADDY_ITEM)) return;
      pendingGiftItem = MADDY_ITEM;
      pendingGiftConfirmation = "Maddy's item was added to your inventory.";
      pendingGiftLine = nextGiftLine();
      showGiftLine();
    };
    void maddyDialogueAudio.play().catch(() => {
      // Browsers may require a player gesture before playing dialogue audio.
    });
    return;
  }
  const reiStage = npc.id === 'rei' ? giftStage(REI_GIFTS) : null;
  pendingSongReward = npc.songReward && !getUnlockedSongs().includes(npc.songReward) ? npc.songReward : null;
  // Quest history chooses the mission dialogue; inventory chooses the reward.
  if (npc.id === 'rei' && hasMikeAftermath() && reiStage !== 0) {
    pendingRequestLine = null;
    pendingFollowUpLine = null;
    pendingGiftItem = nextStagedGift(REI_GIFTS);
    pendingGiftLine = pendingGiftItem ? nextGiftLine() : null;
    pendingGiftConfirmation = pendingGiftLine ? "Rei's item was added to your inventory." : null;
    requestLineShown = false;
    reiCompletionStage = 'intro';
    giftConfirmation.hidden = true;
    speaker.textContent = npc.name;
    setProfileImage(dialogueProfile, npc.name);
    showDialogueLine(npc);
    nextButton.hidden = false;
    dialogue.hidden = false;
    return;
  }
  pendingRequestLine = npc.id === 'rei' && hasMikeAftermath() && reiStage !== 0 ? null : npc.requestLine ?? null;
  pendingFollowUpLine = npc.followUpLine?.() ?? null;
  if (npc.id === 'rei') pendingGiftItem = nextStagedGift(REI_GIFTS);
  else pendingGiftItem = npc.itemGift && !hasGift(npc.itemGift) ? npc.itemGift : null;
  pendingGiftLine = pendingGiftItem ? nextGiftLine() : null;
  pendingGiftConfirmation = !pendingGiftLine ? null : npc.id === 'rei'
    ? "Rei's item was added to your inventory."
    : 'An item has been added to your inventory.';
  giftConfirmation.hidden = true;
  requestLineShown = false;
  speaker.textContent = npc.name;
  setProfileImage(dialogueProfile, npc.name);
  if (npc.id === 'ruby') {
    showRubyLine('opening');
    dialogue.hidden = false;
    return;
  }
  showDialogueLine(npc);
  nextButton.hidden = pendingRequestLine === null && pendingFollowUpLine === null && pendingFixtureLine === null && pendingGiftLine === null && pendingSongReward === null && !hasMoreDialogue() && npc.id !== 'alice';
  dialogue.hidden = false;
}

export function updateNpcInteractions(playerX: number, playerY: number): void {
  let nextNearbyNpc: NpcDefinition | null = null;
  let closestDistance = Infinity;
  for (const npc of NPCS) {
    if (npc.id === 'alexS' && getPlayerBody() === 'alex-s') continue;
    if (npc.id === 'mike' && hasMikeAftermath()) continue;
    if (isOscarEaten(oscarCharacterId(npc.name))) continue;
    const position = npc.getPosition?.() ?? npc;
    const distance = Math.hypot(playerX - position.x, playerY - position.y);
    if (distance <= npc.interactionDistance && distance < closestDistance) {
      nextNearbyNpc = npc;
      closestDistance = distance;
    }
  }
  if (nextNearbyNpc === nearbyNpc) return;
  nearbyNpc = nextNearbyNpc;
  setGeorgiaInteractionPaused(nearbyNpc?.id === 'georgia');
  closeDialogue();
  if (nearbyNpc) openDialogue(nearbyNpc);
}

export function setupNpcInteractions(): void {
  window.addEventListener('max-game:alex-s-dialogue', closeDialogue);
  window.addEventListener('max-game:world-interaction-opened', closeDialogue);
  window.addEventListener('max-game:alice-power-activated', closeDialogue);
  window.addEventListener('max-game:helen-power-activated', closeDialogue);
  window.addEventListener('max-game:joe-power-activated', closeDialogue);
  window.addEventListener('max-game:ju-power-activated', closeDialogue);
  window.addEventListener('max-game:julian-power-activated', closeDialogue);
  window.addEventListener('max-game:katie-power-activated', closeDialogue);
  window.addEventListener('max-game:lucy-power-activated', closeDialogue);
  window.addEventListener('max-game:oscar-power-activated', closeDialogue);
  window.addEventListener('max-game:tim-power-activated', closeDialogue);
  window.addEventListener('max-game:sam-power-activated', closeDialogue);
  window.addEventListener('max-game:rei-power-activated', closeDialogue);
  window.addEventListener('max-game:noel-power-activated', closeDialogue);
  window.addEventListener('max-game:mike-power-activated', closeDialogue);
  window.addEventListener('max-game:georgia-power-activated', () => {
    closeDialogue();
    setGeorgiaInteractionPaused(false);
    nearbyNpc = null;
  });
  window.addEventListener('max-game:chris-power-activated', closeDialogue);
  window.addEventListener('max-game:dan-power-activated', closeDialogue);
  closeButton.addEventListener('click', closeDialogue);
  nextButton.addEventListener('click', advanceDialogue);
  requireElement<HTMLAnchorElement>('#oscar-zen-garden-link').addEventListener('click', closeDialogue);
  requireElement<HTMLButtonElement>('#oscar-zen-garden-dismiss').addEventListener('click', closeDialogue);
  requireElement<HTMLAnchorElement>('#alice-event-tinder-link').addEventListener('click', closeDialogue);
  requireElement<HTMLButtonElement>('#alice-event-tinder-dismiss').addEventListener('click', closeDialogue);
  requireElement<HTMLAnchorElement>('#ruby-videos-yes').addEventListener('click', () => chooseRubyVideos(true));
  requireElement<HTMLButtonElement>('#ruby-videos-no').addEventListener('click', () => chooseRubyVideos(false));
  window.addEventListener('keydown', (event) => {
    if (!activeNpc) return;
    if (event.code === 'Escape') {
      event.preventDefault();
      closeDialogue();
      return;
    }
    if ((pendingRequestLine || pendingFollowUpLine || requestLineShown) && (event.code === 'Enter' || event.code === 'Space')) {
      event.preventDefault();
      advanceDialogue();
    }
  });
}
