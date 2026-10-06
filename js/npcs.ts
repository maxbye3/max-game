import { requireElement } from './dom.js';
import { createGameAudio } from './audio-mute.js';
import { ADAM_DIALOGUE_LINES } from './adam-dialogue.js';
import { ALICE_DIALOGUE_LINES } from './alice-dialogue.js';
import { BOCHRA_DIALOGUE_LINES } from './bochra-dialogue.js';
import { CHRIS_DIALOGUE_LINES } from './chris-dialogue.js';
import { DAN_DIALOGUE_LINES } from './dan-dialogue.js';
import { ADAM_FACTS } from './adam-facts.js';
import { ALEX_S_DIALOGUE_LINES } from './alex-s-dialogue.js';
import { KATY_DIALOGUE_LINES } from './katy-dialogue.js';
import { KATIE_DIALOGUE_LINES } from './katie-dialogue.js';
import { JOE_DIALOGUE_LINES } from './joe-dialogue.js';
import { JU_DIALOGUE_LINES } from './ju-dialogue.js';
import { GEORGIA_DIALOGUE_LINES } from './georgia-dialogue.js';
import { GEORGIA, georgiaState, setGeorgiaInteractionPaused } from './georgia.js';
import { getNextArsenalFixtureDialogue } from './arsenal-fixture.js';
import { ED_DIALOGUE_LINES } from './ed-dialogue.js';
import { addGift, ADAM_ITEM, ALICE_ITEM, BOCHRA_ITEM, CHRIS_ITEM, DAN_ITEM, ED_ITEM, GEORGIA_ITEM, hasGift, JOE_ITEM, JU_ITEM, KATIE_ITEM, MADDY_ITEM, nextGiftLine, OSCAR_ITEM, REI_ITEM_1, REI_ITEM_2, removeGift, SAM_ITEM, type GiftItem, GIFT_ITEMS } from './inventory-gifts.js';
import { MARINA_D_DIALOGUE_LINES } from './marina-d-dialogue.js';
import { MADDY_DIALOGUE_LINES } from './maddy-dialogue.js';
import { MASON_DIALOGUE_LINES } from './mason-dialogue.js';
import { MELI_DIALOGUE_LINES } from './meli-dialogue.js';
import { MIKE_DIALOGUE_LINES } from './mike-dialogue.js';
import { OSCAR_DIALOGUE_LINES } from './oscar-dialogue.js';
import { REI_DIALOGUE_LINES } from './rei-dialogue.js';
import { SAM_DIALOGUE_LINES } from './sam-dialogue.js';
import { hideSignDialogue } from './signs.js';
import { readStorage, writeStorage } from './storage.js';
import { setProfileImage } from './profile-images.js';
import { hasMikeAftermath } from './world-state.js';
import { getSongArtwork, getUnlockedSongs, unlockSong, type Song } from './music-library.js';
import { beginDialogueAudio, endDialogueAudio } from './dialogue-audio.js';
import { nextDialogueVisitIndex } from './dialogue-visit.js';
import { isOscarEaten, oscarCharacterId } from './oscar-power.js';

interface NpcDefinition {
  readonly id: 'adam' | 'alice' | 'bochra' | 'chris' | 'dan' | 'ed' | 'joe' | 'ju' | 'mike' | 'rei' | 'marinaD' | 'maddy' | 'sam' | 'katie' | 'mason' | 'meli' | 'oscar' | 'alexS' | 'katy' | 'georgia';
  readonly name: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly interactionDistance: number;
  readonly getPosition?: () => { readonly x: number; readonly y: number };
  readonly itemGift?: GiftItem;
  readonly songReward?: Song;
  readonly dialogueLines: readonly string[];
  readonly getFixtureLine?: () => Promise<string>;
  readonly followUpLine?: () => string;
  // Said after the rotating greeting, every time the player walks up.
  readonly requestLine?: string;
}

// Alice and Chris are already rendered at these positions by map-characters.ts.
export const ALICE: NpcDefinition = {
  id: 'alice',
  name: 'Alice',
  x: 260,
  y: 120,
  width: 25,
  height: 52,
  interactionDistance: 58,
  dialogueLines: ALICE_DIALOGUE_LINES,
  itemGift: ALICE_ITEM,
};

export const CHRIS: NpcDefinition = {
  id: 'chris',
  name: 'Chris',
  x: 475,
  y: 270,
  width: 25,
  height: 52,
  interactionDistance: 58,
  dialogueLines: CHRIS_DIALOGUE_LINES,
  itemGift: CHRIS_ITEM,
};

export const ADAM: NpcDefinition = {
  id: 'adam',
  name: 'adam',
  x: 195,
  y: 916,
  width: 37,
  height: 60,
  interactionDistance: 56,
  dialogueLines: ADAM_DIALOGUE_LINES,
  followUpLine: nextAdamFact,
  itemGift: ADAM_ITEM,
};

export const ED: NpcDefinition = {
  id: 'ed',
  name: 'ed',
  x: 254,
  y: 909,
  width: 25,
  height: 54,
  interactionDistance: 56,
  dialogueLines: ED_DIALOGUE_LINES,
  getFixtureLine: getNextArsenalFixtureDialogue,
  itemGift: ED_ITEM,
  songReward: 'Outer wildeds',
};

export const MIKE: NpcDefinition = {
  id: 'mike',
  name: 'mike',
  x: 300,
  y: 685,
  width: 40,
  height: 46,
  interactionDistance: 56,
  itemGift: GIFT_ITEMS[0]!,
  dialogueLines: MIKE_DIALOGUE_LINES,
};

export const REI: NpcDefinition = {
  id: 'rei',
  name: 'rei',
  x: 456,
  y: 500,
  width: 32,
  height: 45,
  interactionDistance: 56,
  dialogueLines: REI_DIALOGUE_LINES,
  songReward: 'Lemon jelly',
  requestLine: 'I need some red paint to finish this sign. Help me find some',
};

// Marina D is already drawn by map-characters.ts.
export const MARINA_D: NpcDefinition = {
  id: 'marinaD',
  name: 'marina d',
  x: 201,
  y: 1034,
  width: 25,
  height: 52,
  interactionDistance: 58,
  dialogueLines: MARINA_D_DIALOGUE_LINES,
};

export const MADDY: NpcDefinition = {
  id: 'maddy',
  name: 'Maddy',
  x: 383,
  y: 1045,
  width: 25,
  height: 59,
  interactionDistance: 58,
  dialogueLines: MADDY_DIALOGUE_LINES,
};

// Sam is already drawn by map-characters.ts.
export const SAM: NpcDefinition = {
  id: 'sam',
  name: 'Sam',
  x: 324,
  y: 974,
  width: 25,
  height: 52,
  interactionDistance: 58,
  dialogueLines: SAM_DIALOGUE_LINES,
  itemGift: SAM_ITEM,
};

// Katie is already drawn by map-characters.ts; she is distinct from Katy.
export const KATIE: NpcDefinition = {
  id: 'katie',
  name: 'Katie',
  x: 1130,
  y: 1018,
  width: 25,
  height: 52,
  interactionDistance: 58,
  dialogueLines: KATIE_DIALOGUE_LINES,
  itemGift: KATIE_ITEM,
};

// Mason and Meli are already drawn next to each other by map-characters.ts.
export const MASON: NpcDefinition = {
  id: 'mason',
  name: 'Mason',
  x: 820,
  y: 570,
  width: 25,
  height: 69,
  interactionDistance: 58,
  dialogueLines: MASON_DIALOGUE_LINES,
};

export const MELI: NpcDefinition = {
  id: 'meli',
  name: 'Meli',
  x: 858,
  y: 570,
  width: 25,
  height: 69,
  interactionDistance: 58,
  dialogueLines: MELI_DIALOGUE_LINES,
};

// Oscar is already drawn by map-characters.ts.
export const OSCAR: NpcDefinition = {
  id: 'oscar',
  name: 'Oscar',
  x: 636,
  y: 564,
  width: 25,
  height: 52,
  interactionDistance: 58,
  itemGift: OSCAR_ITEM,
  dialogueLines: OSCAR_DIALOGUE_LINES,
};

export const JU: NpcDefinition = {
  id: 'ju',
  name: 'Ju',
  x: 1000,
  y: 180,
  width: 25,
  height: 52,
  interactionDistance: 58,
  dialogueLines: JU_DIALOGUE_LINES,
  itemGift: JU_ITEM,
};

export const BOCHRA: NpcDefinition = {
  id: 'bochra',
  name: 'Bochra',
  x: 1114,
  y: 172,
  width: 25,
  height: 52,
  interactionDistance: 58,
  dialogueLines: BOCHRA_DIALOGUE_LINES,
  itemGift: BOCHRA_ITEM,
};

export const DAN: NpcDefinition = {
  id: 'dan',
  name: 'Dan',
  x: 1150,
  y: 372,
  width: 25,
  height: 48,
  interactionDistance: 58,
  dialogueLines: DAN_DIALOGUE_LINES,
  itemGift: DAN_ITEM,
};

export const JOE: NpcDefinition = {
  id: 'joe',
  name: 'Joe',
  x: 1080,
  y: 1070,
  width: 25,
  height: 52,
  interactionDistance: 58,
  dialogueLines: JOE_DIALOGUE_LINES,
  itemGift: JOE_ITEM,
};

export const ALEX_S: NpcDefinition = {
  id: 'alexS',
  name: 'Alex S',
  x: 680,
  y: 1063,
  width: 20,
  height: 46,
  interactionDistance: 58,
  songReward: 'Africa',
  dialogueLines: ALEX_S_DIALOGUE_LINES,
};

export const KATY: NpcDefinition = {
  id: 'katy',
  name: 'Katy',
  x: 422,
  y: 640,
  width: 35,
  height: 52,
  interactionDistance: 58,
  itemGift: GIFT_ITEMS[1]!,
  dialogueLines: KATY_DIALOGUE_LINES,
};

export const GEORGIA_NPC: NpcDefinition = {
  id: 'georgia',
  name: 'Georgia',
  x: GEORGIA.x,
  y: GEORGIA.y,
  width: GEORGIA.width,
  height: GEORGIA.height,
  interactionDistance: 64,
  getPosition: () => georgiaState,
  itemGift: GEORGIA_ITEM,
  dialogueLines: GEORGIA_DIALOGUE_LINES,
};

const NPCS: readonly NpcDefinition[] = [ADAM, ED, MIKE, REI, MARINA_D, MADDY, SAM, KATIE, MASON, MELI, OSCAR, JU, BOCHRA, DAN, JOE, ALEX_S, KATY, GEORGIA_NPC, ALICE, CHRIS];
const dialogue = requireElement<HTMLElement>('#npc-dialogue');
const speaker = requireElement<HTMLElement>('#npc-speaker');
const dialogueLine = requireElement<HTMLElement>('#npc-dialogue-line');
const dialogueProfile = requireElement<HTMLImageElement>('#npc-dialogue-profile');
const dialogueProgress = requireElement<HTMLElement>('#npc-dialogue-progress');
const reiDialogueLinesButton = requireElement<HTMLButtonElement>('#rei-dialogue-lines-button');
const giftConfirmation = requireElement<HTMLElement>('#npc-gift-confirmation');
const closeButton = requireElement<HTMLButtonElement>('#npc-dialogue-close');
const nextButton = requireElement<HTMLButtonElement>('#npc-dialogue-next');
const oscarOptions = requireElement<HTMLElement>('#oscar-dialogue-options');
const aliceOptions = requireElement<HTMLElement>('#alice-dialogue-options');
const gameShell = requireElement<HTMLElement>('.game-shell');
let adamFactIndex = 0;
const maddyDialogueAudio = createGameAudio('chat/maddy/dialogue.mp3');
maddyDialogueAudio.preload = 'auto';
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
  const stage = giftStage(gifts);
  return stage === 0 ? gifts.first : stage === 1 ? gifts.second : null;
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
let reiCompletionStage: 'intro' | 'explanation' | 'thanks' | 'complete' | null = null;

export function isNpcDialogueOpen(): boolean {
  return activeNpc !== null;
}

function showQuestOverlay(imageSource: string, additionalClass = '', soundSource = 'map/audio/mission-accept.mp3'): void {
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
  sound.preload = 'auto';
  void sound.play().catch(() => {
    // Browsers may reject audio until a keyboard or pointer gesture.
  });
}

function showQuestAcceptedOverlay(): void {
  showQuestOverlay('img/external/quest_accepted.png');
}

function showQuestCompleteOverlay(): void {
  showQuestOverlay('img/external/quest-complete.png', '', 'map/audio/mission_success.mp3');
}

function nextDialogueIndex(npc: NpcDefinition): number {
  return nextDialogueVisitIndex(npc.id, npc.dialogueLines.length);
}

function nextAdamFact(): string {
  const fact = ADAM_FACTS[adamFactIndex % ADAM_FACTS.length] ?? '';
  adamFactIndex += 1;
  return fact;
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
  dialogue.hidden = true;
  dialogueProfile.hidden = true;
  nextButton.hidden = true;
  dialogueProgress.hidden = true;
  giftConfirmation.hidden = true;
  oscarOptions.hidden = true;
  aliceOptions.hidden = true;
  reiDialogueLinesButton.hidden = true;
}

function showNextReiDialogueLine(): void {
  if (activeNpc?.id !== 'rei') return;
  currentDialogueLineIndex = (currentDialogueLineIndex + 1) % REI_DIALOGUE_LINES.length;
  dialogueLine.textContent = REI_DIALOGUE_LINES[currentDialogueLineIndex] ?? '';
  dialogueProgress.textContent = `${currentDialogueLineIndex + 1}/${REI_DIALOGUE_LINES.length}`;
  dialogueProgress.hidden = false;
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
  nextButton.hidden = pendingSongReward === null && pendingRequestLine === null && activeNpc?.id !== 'oscar' && activeNpc?.id !== 'alice';
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
  nextButton.hidden = pendingGiftLine === null && pendingSongReward === null;
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
  nextButton.hidden = pendingGiftLine === null && pendingSongReward === null;
}

function showSongLine(): void {
  if (!pendingSongReward) return;
  dialogueLine.textContent = 'Here’s a song for you, too.';
  dialogueProgress.hidden = true;
  giftConfirmation.hidden = true;
  awardSong(pendingSongReward);
  pendingSongReward = null;
  nextButton.hidden = true;
}

function acceptQuest(): void {
  requestLineShown = false;
  if (activeNpc?.id !== 'rei') {
    showQuestAcceptedOverlay();
    closeDialogue();
    return;
  }
  if (pendingGiftItem?.id !== REI_ITEM_1.id || !pendingGiftLine) {
    closeDialogue();
    return;
  }
  showQuestAcceptedOverlay();
  dialogue.hidden = true;
  nextButton.hidden = true;
  const session = dialogueSession;
  window.setTimeout(() => {
    if (session !== dialogueSession || activeNpc?.id !== 'rei') return;
    showGiftLine();
    dialogue.hidden = false;
  }, QUEST_ACCEPTED_OVERLAY_DURATION);
}

function advanceDialogue(): void {
  if (fixtureLoading || !oscarOptions.hidden || !aliceOptions.hidden) return;
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
    reiCompletionStage = 'complete';
    dialogue.hidden = true;
    nextButton.hidden = true;
    const session = dialogueSession;
    window.setTimeout(() => {
      if (session !== dialogueSession || activeNpc?.id !== 'rei') return;
      if (pendingGiftLine) showGiftLine();
      else if (pendingSongReward) showSongLine();
      else { closeDialogue(); return; }
      dialogue.hidden = false;
    }, QUEST_ACCEPTED_OVERLAY_DURATION);
  } else if (reiCompletionStage === 'complete') {
    if (pendingSongReward && !dialogue.hidden) showSongLine();
    return;
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
  } else if (activeNpc && activeNpc.dialogueLines.length > 1) {
    const lines = activeNpc.dialogueLines;
    if (activeNpc.id === 'oscar' && currentDialogueLineIndex === lines.length - 1) {
      showOscarQuestion();
      return;
    }
    currentDialogueLineIndex = (currentDialogueLineIndex + 1) % lines.length;
    dialogueLine.textContent = lines[currentDialogueLineIndex] ?? '';
    dialogueProgress.textContent = `${currentDialogueLineIndex + 1}/${lines.length}`;
    dialogueProgress.hidden = false;
  }
}

function showDialogueLine(npc: NpcDefinition): void {
  const lines = npc.dialogueLines;
  currentDialogueLineIndex = nextDialogueIndex(npc);
  dialogueLine.textContent = lines[currentDialogueLineIndex] ?? '';
  dialogueProgress.textContent = `${currentDialogueLineIndex + 1}/${lines.length}`;
  dialogueProgress.hidden = false;
}

function openDialogue(npc: NpcDefinition): void {
  hideSignDialogue();
  reiDialogueLinesButton.hidden = npc.id !== 'rei';
  oscarOptions.hidden = true;
  aliceOptions.hidden = true;
  beginDialogueAudio(npc.id === 'maddy' || npc.id === 'adam' ? undefined : npc.name);
  activeNpc = npc;
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
  pendingSongReward = npc.songReward && (npc.id !== 'rei' || (hasMikeAftermath() && reiStage !== 0)) && !getUnlockedSongs().includes(npc.songReward) ? npc.songReward : null;
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
  if (npc.id === 'rei') pendingGiftItem = reiStage === 0 ? REI_ITEM_1 : null;
  else pendingGiftItem = npc.itemGift && !hasGift(npc.itemGift) ? npc.itemGift : null;
  pendingGiftLine = pendingGiftItem ? nextGiftLine() : null;
  pendingGiftConfirmation = !pendingGiftLine ? null : npc.id === 'rei'
    ? "Rei's item was added to your inventory."
    : 'An item has been added to your inventory.';
  giftConfirmation.hidden = true;
  requestLineShown = false;
  speaker.textContent = npc.name;
  setProfileImage(dialogueProfile, npc.name);
  showDialogueLine(npc);
  nextButton.hidden = pendingRequestLine === null && pendingFollowUpLine === null && pendingFixtureLine === null && pendingGiftLine === null && pendingSongReward === null && npc.dialogueLines.length <= 1 && npc.id !== 'alice';
  dialogue.hidden = false;
}

export function updateNpcInteractions(playerX: number, playerY: number): void {
  let nextNearbyNpc: NpcDefinition | null = null;
  let closestDistance = Infinity;
  for (const npc of NPCS) {
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
  window.addEventListener('max-game:helen-power-activated', closeDialogue);
  window.addEventListener('max-game:joe-power-activated', closeDialogue);
  window.addEventListener('max-game:ju-power-activated', closeDialogue);
  window.addEventListener('max-game:julian-power-activated', closeDialogue);
  window.addEventListener('max-game:katie-power-activated', closeDialogue);
  window.addEventListener('max-game:georgia-power-activated', () => {
    closeDialogue();
    setGeorgiaInteractionPaused(false);
    nearbyNpc = null;
  });
  window.addEventListener('max-game:chris-power-activated', closeDialogue);
  window.addEventListener('max-game:dan-power-activated', closeDialogue);
  closeButton.addEventListener('click', closeDialogue);
  nextButton.addEventListener('click', advanceDialogue);
  reiDialogueLinesButton.addEventListener('click', showNextReiDialogueLine);
  requireElement<HTMLAnchorElement>('#alice-event-tinder-link').addEventListener('click', closeDialogue);
  requireElement<HTMLButtonElement>('#alice-event-tinder-dismiss').addEventListener('click', closeDialogue);
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
