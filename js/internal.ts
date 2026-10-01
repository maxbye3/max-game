import { drawColander, hasCaveColander } from './colander.js';
import { createGameAudio, setupAudioMute } from './audio-mute.js';
import { CAVE_SIBLINGS, CAVE_SIBLINGS_IDLE_FRAME, CAVE_SIBLINGS_WALK_FRAMES, CaveSiblingsController } from './cave-siblings.js';
import { CinemaAudienceController } from './cinema-audience.js'; import { SHOW_COLLISION_SHAPES } from './config.js';
import { BOOKSHOP_NPCS } from './bookshop-npcs.js';
import { DiaryLabFeatures } from './diary-lab-features.js';
import { canvas, context, requireElement } from './dom.js';
import { GymNpcDialogueController } from './gym-npc-dialogue.js';
import { GoodreadsReadingController } from './goodreads-reading.js';
import { HELEN_DIALOGUE_LINES } from './helen-dialogue.js';
import { DirectionInputController } from './input.js';
import { InteriorCollision } from './interior-collision.js';
import { InteriorDoorsController } from './interior-doors.js';
import { drawSceneryNpcs } from './interior-scenery-npcs.js';
import { setupInventory, updatePowerups } from './inventory.js';
import { isJumpMenuOpen, setupJump } from './jump.js';
import { GYM_NPCS } from './gym-npcs.js';
import { LucyController } from './lucy.js';
import { setupInteriorAmbience } from './plant-room-ambience.js';
import { MusicHouseDialogueController } from './music-house-dialogue.js';
import { MUSIC_HOUSE_NPCS } from './music-house-npcs.js';
import { isTimAtMusicShop } from './tim-location.js';
import { markInteriorVisited } from './world-state.js';
import { getPlayerSpriteFrame } from './player-sprite.js';
import { CAVE_COLANDER, CAVE_WALLS, NOEL, getInteriorScene, type InteractionKind } from './interior-scenes.js';
import type { Direction } from './types.js';
import { moveWithCollisions } from './movement.js'; import { setProfileImage } from './profile-images.js'; import { beginDialogueAudio, endDialogueAudio } from './dialogue-audio.js';
import { nextDialogueVisitIndex } from './dialogue-visit.js';
import { addGift, hasGift, NOEL_ITEM } from './inventory-gifts.js';
import { getSongArtwork, getUnlockedSongs, unlockSong } from './music-library.js';
import { resolveSiteAsset } from './site-assets.js';
import { NOEL_DIALOGUE_LINES } from './noel-dialogue.js';
const searchParams = new URLSearchParams(window.location.search); const SEAL_MODE = searchParams.has('seal');
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
const siblingsDialogueOptions = requireElement<HTMLElement>('#siblings-dialogue-options');
const siblingsViewWebsite = requireElement<HTMLAnchorElement>('#siblings-view-website');
const siblingsDeclineButton = requireElement<HTMLButtonElement>('#siblings-decline');
const musicDialogueOptions = requireElement<HTMLElement>('#music-dialogue-options');
const noelDialogueClose = requireElement<HTMLButtonElement>('#noel-dialogue-close');
const noelDeclineButton = requireElement<HTMLButtonElement>('#noel-decline');
const FRAME_COUNT = SEAL_MODE ? 8 : 9;
const PLAYER_SCALE = 2; const VIEW_SCALE = 1;
const SPEED = 145;
const NOEL_FOLDER = 'chat/noel';
const NOEL_NAME = NOEL_FOLDER.slice(NOEL_FOLDER.lastIndexOf('/') + 1);
const NOEL_QUESTION = "Play a game where I'm the protagonist";
const NOEL_GAME_URL = 'https://maxbye.co/stealth-game/';
const NOEL_SONG = 'bleep-blops' as const;
let noelVisitStage = 0;
const enteredDoor = searchParams.get('door');
const scene = getInteriorScene(enteredDoor);
markInteriorVisited();
const isCinemaInterior = scene.kind === 'cinema'; const isMusicShopInterior = scene.kind === 'musicShop';
const isGymInterior = scene.kind === 'gym'; const isBookshopInterior = scene.kind === 'bookshop'; const isPlantRoomInterior = scene.kind === 'plantRoom';
const isMansionInterior = scene.kind === 'mansion'; const isCaveInterior = scene.kind === 'cave';
const isDiaryLabInterior = scene.kind === 'diaryLab';
document.title = scene.title;
canvas.setAttribute('aria-label', scene.ariaLabel);
const WORLD_WIDTH = scene.width;
const WORLD_HEIGHT = scene.height;
const INTERACTION_TARGETS = scene.interactions;
if (isCaveInterior) {
  canvas.width = WORLD_WIDTH;
  canvas.height = WORLD_HEIGHT;
  context.imageSmoothingEnabled = false;
  requireElement<HTMLElement>('.game-shell').classList.add('cave-shell');
}
const interior = new Image(); const collisionMask = new Image();
const doorOverlay = new Image(); const spriteSheet = new Image();
const noelSprite = new Image(); const siblingsSprite = new Image();
const musicDjMachine = new Image(); const gymGloves = new Image();
const bookshopNpcs = BOOKSHOP_NPCS.map((npc) => ({ ...npc, image: new Image() }));
const musicHouseNpcs = MUSIC_HOUSE_NPCS.filter((npc) => npc.id !== 'tim' || isTimAtMusicShop()).map((npc) => ({ ...npc, image: new Image() }));
const gymNpcs = GYM_NPCS.map((npc) => ({ ...npc, image: new Image() }));
interior.src = scene.backgroundSource;
if (scene.collisionMaskSource) collisionMask.src = scene.collisionMaskSource;
if (scene.doorOverlaySource) doorOverlay.src = scene.doorOverlaySource;
spriteSheet.src = SEAL_MODE ? '../player/seal-game.png?v=20260831-transparent' : '../player/SpriteSheet.png';
if (isDiaryLabInterior || isMansionInterior) noelSprite.src = '../chat/noel/interior-avatar.png';
if (isCaveInterior) siblingsSprite.src = '../chat/siblings/girls-sprite.png';
if (isMusicShopInterior) musicDjMachine.src = '../img/internal/music-dj-machine.png';
if (isBookshopInterior) {
  bookshopNpcs.forEach((npc) => {
    npc.image.src = npc.source;
  });
}
if (isMusicShopInterior) {
  musicHouseNpcs.forEach((npc) => {
    npc.image.src = npc.source;
  });
}
if (isGymInterior) { gymGloves.src = '../img/internal/gloves.png'; gymNpcs.forEach((npc) => { npc.image.src = npc.source; }); }
const colanderWarningVoices = [
  createGameAudio('../chat/siblings/maddy.mp3'),
  createGameAudio('../chat/siblings/marina.mp3'),
];
colanderWarningVoices.forEach((voice) => {
  voice.preload = 'auto';
});
const player = {
  x: scene.playerStart.x,
  y: scene.playerStart.y,
  direction: 'up' as Direction,
  frame: 0,
  animationTime: 0,
};
let previousTime = 0;
let nearbyInteraction: InteractionKind | null = null;
let noelDialogueOpen = false;
let noelDialogueFollowsProximity = false;
let noelDialogueLineIndex = 0; let helenDialogueLineIndex = 0;
type NoelDialogueStage = 'opening' | 'question' | 'decline' | 'reward' | 'done';
type NoelReward = 'item' | 'song';
let noelDialogueStage: NoelDialogueStage = 'done';
let noelRewardQueue: NoelReward[] = [];
const isCharacterInteraction = (interaction: InteractionKind | null): boolean => interaction === 'noel' || interaction === 'siblings' || interaction === 'lucy' || interaction === 'andy' || interaction === 'aliya' || interaction === 'julian' || interaction === 'tim' || interaction === 'helen';
const input = new DirectionInputController({
  canHold: () => !noelDialogueOpen || noelDialogueFollowsProximity,
});
const diaryLabFeatures = new DiaryLabFeatures();
const goodreadsReading = new GoodreadsReadingController(closeNoelDialogue);
const lucy = isPlantRoomInterior
  ? new LucyController(noelDialogueLine, noelDialogueNext, noelDialogueProgress, noelGiftConfirmation, closeNoelDialogue)
  : null;
const gymNpcDialogue = new GymNpcDialogueController(noelDialogueLine, noelDialogueNext, noelDialogueProgress, noelGiftConfirmation);
const musicHouseDialogue = new MusicHouseDialogueController(noelDialogueLine, noelDialogueNext, noelDialogueProgress, noelGiftConfirmation, closeNoelDialogue);
let caveColanderHeld = hasCaveColander();
const interiorDoors = new InteriorDoorsController(scene, {
  enteredDoor,
  sealMode: SEAL_MODE,
  hasCaveColander: () => caveColanderHeld,
});
const collision = new InteriorCollision(
  scene,
  (x, y) => interiorDoors.passageIsOpen(x, y),
);
const caveSiblings = isCaveInterior
  ? new CaveSiblingsController({
    showLine: ({ speaker, line }, index, total) => {
      noelSpeaker.textContent = speaker; setProfileImage(noelDialogueProfile, speaker, '../');
      noelDialogueLine.textContent = line;
      noelDialogueProgress.textContent = `${index + 1}/${total}`;
      noelDialogueProgress.hidden = false;
    },
    showOptions: () => {
      siblingsDialogueOptions.hidden = false;
    },
    closeDialogue: () => closeNoelDialogue(),
  })
  : null;
const cinemaAudience = isCinemaInterior
  ? new CinemaAudienceController({
    openDialogue: (line, index, total) => {
      beginDialogueAudio(); noelDialogueOpen = true;
      noelDialogueFollowsProximity = true;
      noelSpeaker.textContent = 'cinema audience'; setProfileImage(noelDialogueProfile, 'cinema audience', '../');
      noelDialogueLine.textContent = line;
      noelDialogueProgress.textContent = `${index + 1}/${total}`;
      noelDialogueProgress.hidden = false;
      noelDialogueNext.hidden = true;
      noelDialogueQuestion.hidden = true;
      noelDialogueOptions.hidden = true;
      musicDialogueOptions.hidden = true;
      noelDialogue.hidden = false;
      interactionPrompt.hidden = true;
    },
    closeDialogue: () => closeNoelDialogue(),
  })
  : null;
function showNoelGameQuestion(): void {
  noelDialogueStage = 'question';
  noelDialogueLine.textContent = '';
  noelDialogueProgress.hidden = true;
  noelDialogueNext.hidden = true;
  noelDialogueProgress.hidden = true;
  noelDialogueQuestion.textContent = NOEL_QUESTION;
  noelDialogueQuestion.hidden = false;
  noelDialogueOptions.hidden = false;
}
function showNoelDialogueLine(): void {
  noelDialogueStage = 'opening';
  noelDialogueLine.textContent = NOEL_DIALOGUE_LINES[noelDialogueLineIndex] ?? '';
  noelDialogueProgress.textContent = `${noelDialogueLineIndex + 1}/${NOEL_DIALOGUE_LINES.length}`;
  noelDialogueProgress.hidden = false;
  noelDialogueNext.hidden = false;
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
}
function chooseNoelGame(accept: boolean): void {
  if (!noelDialogueOpen || nearbyInteraction !== 'noel' || noelDialogueStage !== 'question') return;
  if (accept) window.open(NOEL_GAME_URL, '_blank', 'noopener,noreferrer');
  noelDialogueOptions.hidden = true;
  noelDialogueQuestion.hidden = true;
  noelDialogueProgress.hidden = true;
  noelGiftConfirmation.hidden = true;
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
function showNextNoelReward(): void {
  const reward = noelRewardQueue.shift();
  if (!reward) {
    noelDialogueStage = 'done';
    closeNoelDialogue();
    return;
  }
  noelDialogueStage = 'reward';
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  noelDialogueProgress.hidden = true;
  noelGiftConfirmation.hidden = true;
  noelDialogueNext.hidden = false;
  if (reward === 'item') {
    noelDialogueLine.textContent = 'Here, take my item.';
    const added = addGift(NOEL_ITEM);
    noelGiftConfirmation.textContent = added ? "Noel’s item was added to your inventory." : '';
    noelGiftConfirmation.hidden = !added;
    return;
  }
  noelDialogueLine.textContent = `And here’s ${NOEL_SONG}.`;
  if (!unlockSong(NOEL_SONG)) return showNextNoelReward();
  noelGiftConfirmation.textContent = `${NOEL_SONG} was added to your music playlist.`;
  noelGiftConfirmation.hidden = false;
  const shell = document.querySelector<HTMLElement>('.game-shell');
  if (shell) {
    const overlay = document.createElement('div');
    overlay.className = 'quest-accepted-overlay item-received-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    const image = document.createElement('img');
    image.src = resolveSiteAsset(getSongArtwork(NOEL_SONG));
    image.alt = '';
    overlay.append(image);
    shell.append(overlay);
    window.setTimeout(() => overlay.remove(), 3200);
    void createGameAudio(resolveSiteAsset('audio/music-accepted.mp3')).play().catch(() => {});
  }
}
function nextNoelDialogueVisitIndex(): number {
  const index = Math.min(noelVisitStage, 1);
  noelVisitStage = Math.min(noelVisitStage + 1, 1);
  return index;
}
function closeNoelDialogue(): void {
  endDialogueAudio(); caveSiblings?.closeDialogue();
  noelDialogueOpen = false;
  noelDialogueStage = 'done';
  noelRewardQueue = [];
  noelDialogueFollowsProximity = false;
  noelDialogue.hidden = true;
  noelDialogueNext.hidden = true;
  noelDialogueProgress.hidden = true;
  noelGiftConfirmation.hidden = true;
  noelDialogueOptions.hidden = true;
  siblingsDialogueOptions.hidden = true;
  musicDialogueOptions.hidden = true;
  helenReadingOptions.hidden = true;
  diaryLabFeatures.hide();
  goodreadsReading.hide();
  lucy?.stop();
  gymNpcDialogue.stop();
  musicHouseDialogue.stop();
  colanderWarningVoices.forEach((voice) => {
    voice.pause();
    voice.currentTime = 0;
  });
  interactionPrompt.hidden = nearbyInteraction === null || isCharacterInteraction(nearbyInteraction);
}
function showSiblingsDialogue(): void {
  noelDialogueProgress.hidden = true;
  noelGiftConfirmation.hidden = true;
  noelDialogueNext.hidden = true;
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  siblingsDialogueOptions.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
}
function startSiblingsDialogue(time: number): void {
  if (
    nearbyInteraction !== 'siblings' ||
    noelDialogueOpen ||
    !caveSiblings?.startWelcome(time)
  ) return;
  noelDialogueOpen = true; beginDialogueAudio('Maddy', '../');
  noelDialogueFollowsProximity = true;
  showSiblingsDialogue();
}
function startSiblingsWebsiteReturnDialogue(): void {
  if (!caveSiblings?.canResumeAfterWebsite) return;
  if (noelDialogueOpen) closeNoelDialogue();
  caveSiblings.resumeAfterWebsite(performance.now());
  noelDialogueOpen = true; beginDialogueAudio('Maddy', '../');
  noelDialogueFollowsProximity = true;
  showSiblingsDialogue();
}
function startNoelDialogue(): void {
  if (nearbyInteraction !== 'noel' || noelDialogueOpen) return;
  noelDialogueOpen = true; beginDialogueAudio(NOEL_NAME, '../');
  noelDialogueFollowsProximity = true;
  noelDialogueLineIndex = nextNoelDialogueVisitIndex();
  noelSpeaker.textContent = NOEL_NAME; setProfileImage(noelDialogueProfile, NOEL_NAME, '../');
  noelDialogueLine.textContent = '';
  noelDialogueProgress.hidden = true;
  noelDialogueNext.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
  showNoelDialogueLine();
}
function startLucyDialogue(): void {
  if (nearbyInteraction !== 'lucy' || noelDialogueOpen) return;
  input.releaseAll();
  noelDialogueOpen = true; beginDialogueAudio('Lucy', '../');
  noelDialogueFollowsProximity = true;
  noelSpeaker.textContent = 'Lucy'; setProfileImage(noelDialogueProfile, 'Lucy', '../');
  lucy?.start();
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  siblingsDialogueOptions.hidden = true;
  musicDialogueOptions.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
}
let helenReadingOfferPending = false;
const helenReadingOptions = requireElement<HTMLElement>('#helen-reading-options');
function showHelenDialogue(): void { noelDialogueLine.textContent = HELEN_DIALOGUE_LINES[helenDialogueLineIndex] ?? ''; noelDialogueProgress.textContent = `${helenDialogueLineIndex + 1}/${HELEN_DIALOGUE_LINES.length}`; noelDialogueProgress.hidden = false; noelDialogueNext.hidden = false; }
function showHelenReadingOffer(): void { helenReadingOfferPending = false; noelDialogueLine.textContent = 'Would you like to see what Max is reading?'; noelDialogueProgress.hidden = true; noelDialogueNext.hidden = true; helenReadingOptions.hidden = false; }
function startHelenDialogue(): void { if (nearbyInteraction !== 'helen' || noelDialogueOpen) return; input.releaseAll(); noelDialogueOpen = true; beginDialogueAudio('Helen', '../'); noelDialogueFollowsProximity = true; helenDialogueLineIndex = nextDialogueVisitIndex('helen', HELEN_DIALOGUE_LINES.length); helenReadingOfferPending = true; noelSpeaker.textContent = 'Helen'; setProfileImage(noelDialogueProfile, 'Helen', '../'); showHelenDialogue(); noelDialogueQuestion.hidden = true; noelDialogueOptions.hidden = true; siblingsDialogueOptions.hidden = true; musicDialogueOptions.hidden = true; helenReadingOptions.hidden = true; noelDialogue.hidden = false; interactionPrompt.hidden = true; }
function openFeature(kind: 'diary' | 'experiments' | 'reading'): void {
  input.releaseAll(); endDialogueAudio();
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = false;
  [interactionPrompt, noelDialogueNext, noelDialogue, helenReadingOptions].forEach((element) => { element.hidden = true; });
  if (kind === 'reading') goodreadsReading.open();
  else diaryLabFeatures.open(kind);
}
function startFeatureInteraction(kind: 'diary' | 'experiments'): void {
  if (!noelDialogueOpen) openFeature(kind);
}
function startColanderPickup(): void {
  if (!isCaveInterior || noelDialogueOpen || caveColanderHeld) return;
  input.releaseAll();
  // Stop any in-progress Maddy/Marina line before this hardcoded prompt
  // takes over the shared dialogue UI, so voices never overlap it.
  caveSiblings?.closeDialogue();
  caveColanderHeld = true;
  interiorDoors.syncExitLink(document.querySelector<HTMLAnchorElement>('.interior-exit'));
  nearbyInteraction = null;
  noelDialogueOpen = true; beginDialogueAudio('Maddy', '../');
  noelDialogueFollowsProximity = false;
  noelSpeaker.textContent = 'THE GIRLS'; setProfileImage(noelDialogueProfile, 'Maddy', '../');
  noelDialogueLine.textContent = 'PUT THAT DOWN NOW';
  noelDialogueProgress.hidden = true;
  noelGiftConfirmation.hidden = true;
  noelDialogueNext.hidden = true;
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  musicDialogueOptions.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
  colanderWarningVoices.forEach((voice) => {
    voice.pause();
    voice.currentTime = 0;
    void voice.play().catch(() => {
      // Browsers may reject audio until movement provides a keyboard or pointer gesture.
    });
  });
}
function startMusicHouseDialogue(kind: 'andy' | 'aliya'): void {
  if (nearbyInteraction !== kind || noelDialogueOpen) return;
  input.releaseAll();
  noelDialogueOpen = true; beginDialogueAudio(kind === 'andy' ? 'Andy' : 'Aliya', '../');
  noelDialogueFollowsProximity = true;
  noelSpeaker.textContent = kind === 'andy' ? 'Andy' : 'Aliya';
  if (kind === 'andy') {
    setProfileImage(noelDialogueProfile, 'Andy', '../');
  } else {
    noelDialogueProfile.hidden = true;
    noelDialogueProfile.alt = '';
    noelDialogueProfile.removeAttribute('src');
  }
  musicHouseDialogue.start(kind);
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  siblingsDialogueOptions.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
}
function startGymNpcDialogue(kind: 'julian' | 'tim'): void {
  if (nearbyInteraction !== kind || noelDialogueOpen) return; input.releaseAll(); noelDialogueOpen = true; noelDialogueFollowsProximity = true;
  beginDialogueAudio(kind === 'julian' ? 'Julian' : 'Tim', '../'); const npc = gymNpcDialogue.start(kind); noelSpeaker.textContent = npc.name; noelDialogueProfile.src = npc.profileSource ?? ''; noelDialogueProfile.alt = npc.profileSource ? `${npc.name} profile` : ''; noelDialogueProfile.hidden = !npc.profileSource;
  noelDialogueQuestion.hidden = true; noelDialogueOptions.hidden = true; siblingsDialogueOptions.hidden = true; musicDialogueOptions.hidden = true; noelDialogue.hidden = false; interactionPrompt.hidden = true;
}
function activateNearbyInteraction(): void {
  if (nearbyInteraction === 'noel') startNoelDialogue();
  else if (nearbyInteraction === 'siblings') startSiblingsDialogue(performance.now());
  else if (nearbyInteraction === 'diary' || nearbyInteraction === 'experiments') startFeatureInteraction(nearbyInteraction);
  else if (nearbyInteraction === 'colander') startColanderPickup();
  else if (nearbyInteraction === 'andy' || nearbyInteraction === 'aliya') startMusicHouseDialogue(nearbyInteraction);
  else if (nearbyInteraction === 'lucy') startLucyDialogue();
  else if (nearbyInteraction === 'helen') startHelenDialogue();
  else if (nearbyInteraction === 'julian' || nearbyInteraction === 'tim') startGymNpcDialogue(nearbyInteraction);
}
function bindControls(): void {
  window.addEventListener('keydown', (event) => {
    if (goodreadsReading.isOpen()) return;
    if (event.ctrlKey || event.metaKey || event.altKey) {
      input.releaseAll();
      return;
    }
    if (event.code === 'Escape' && noelDialogueOpen) {
      event.preventDefault();
      if (diaryLabFeatures.closeLightbox()) return;
      closeNoelDialogue();
      return;
    }
    if ((event.code === 'KeyE' || event.code === 'Enter' || event.code === 'Space') && nearbyInteraction) {
      event.preventDefault();
      activateNearbyInteraction();
      return;
    }
  });
  window.addEventListener('blur', () => {
    caveSiblings?.notePageLeft();
  });
  window.addEventListener('focus', startSiblingsWebsiteReturnDialogue);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      caveSiblings?.notePageLeft();
      return;
    }
    startSiblingsWebsiteReturnDialogue();
  });
  interactionPrompt.addEventListener('click', activateNearbyInteraction);
  noelDialogueNext.addEventListener('click', () => {
    if (nearbyInteraction === 'lucy') lucy?.next();
    else if (nearbyInteraction === 'helen') {
      if (helenDialogueLineIndex < HELEN_DIALOGUE_LINES.length - 1) { helenDialogueLineIndex += 1; showHelenDialogue(); }
      else if (helenReadingOfferPending) showHelenReadingOffer();
    }
    else if (nearbyInteraction === 'andy' || nearbyInteraction === 'aliya') musicHouseDialogue.next();
    else if (nearbyInteraction === 'julian' || nearbyInteraction === 'tim') gymNpcDialogue.next();
    else if (nearbyInteraction === 'noel') {
      if (noelDialogueStage === 'opening') showNoelGameQuestion();
      else if (noelDialogueStage === 'decline' || noelDialogueStage === 'reward') showNextNoelReward();
    }
  });
  noelDialogueClose.addEventListener('click', closeNoelDialogue);
  requireElement<HTMLButtonElement>('#helen-reading-yes').addEventListener('click', () => openFeature('reading'));
  requireElement<HTMLButtonElement>('#helen-reading-no').addEventListener('click', closeNoelDialogue);
  requireElement<HTMLButtonElement>('#noel-yes').addEventListener('click', () => chooseNoelGame(true));
  noelDeclineButton.addEventListener('click', () => chooseNoelGame(false));
  siblingsViewWebsite.addEventListener('click', () => {
    caveSiblings?.chooseWebsite();
    closeNoelDialogue();
  });
  siblingsDeclineButton.addEventListener('click', () => {
    siblingsDialogueOptions.hidden = true;
    caveSiblings?.declineWebsite(performance.now());
    showSiblingsDialogue();
  });
  diaryLabFeatures.bind(openFeature, closeNoelDialogue);
  input.setup();
}
function updatePlayer(deltaTime: number): void {
  if (caveSiblings?.isEntering) {
    player.animationTime = 0;
    player.frame = 0;
    return;
  }
  if (noelDialogueOpen && !noelDialogueFollowsProximity) return;
  let dx = 0;
  let dy = 0;
  if (input.isHeld('left')) dx -= 1;
  if (input.isHeld('right')) dx += 1;
  if (input.isHeld('up')) dy -= 1;
  if (input.isHeld('down')) dy += 1;
  if (dx === 0 && dy === 0) {
    player.animationTime = 0;
    player.frame = 0;
    return;
  }
  const length = Math.hypot(dx, dy);
  moveWithCollisions(
    player,
    (dx / length) * SPEED * deltaTime,
    (dy / length) * SPEED * deltaTime,
    (x, y) => collision.playerIsBlocked(x, y),
  );
  if (dx < 0 && dy < 0) player.direction = 'upLeft';
  else if (dx > 0 && dy < 0) player.direction = 'upRight';
  else if (dx < 0 && dy > 0) player.direction = 'downLeft';
  else if (dx > 0 && dy > 0) player.direction = 'downRight';
  else if (dx < 0) player.direction = 'left';
  else if (dx > 0) player.direction = 'right';
  else if (dy < 0) player.direction = 'up';
  else player.direction = 'down';
  player.animationTime += deltaTime;
  player.frame = Math.floor(player.animationTime * 11) % FRAME_COUNT;
}
function updateNearbyInteraction(): void {
  if (isCinemaInterior) {
    nearbyInteraction = null;
    interactionPrompt.hidden = true;
    cinemaAudience?.update(player.x, player.y, noelDialogueOpen);
    return;
  }
  const target = INTERACTION_TARGETS
    .filter((interaction) => interaction.kind !== 'colander' || !caveColanderHeld)
    .map((interaction) => ({
      ...interaction,
      playerDistance: Math.hypot(player.x - interaction.x, player.y - interaction.y),
    }))
    .filter((interaction) => interaction.playerDistance <= interaction.distance)
    .sort((first, second) => first.playerDistance - second.playerDistance)[0];
  const nextInteraction = target?.kind ?? null;
  if (nextInteraction === nearbyInteraction) return;
  const previousInteraction = nearbyInteraction;
  nearbyInteraction = nextInteraction;
  if (previousInteraction === 'siblings' && nextInteraction !== 'siblings') {
    caveSiblings?.leaveRange();
  }
  if (
    isCharacterInteraction(previousInteraction) &&
    nextInteraction !== previousInteraction &&
    noelDialogueOpen &&
    noelDialogueFollowsProximity
  ) {
    closeNoelDialogue();
  }
  if (nextInteraction === 'noel') {
    startNoelDialogue();
    return;
  }
  if (nextInteraction === 'siblings') {
    interactionPrompt.hidden = true;
    startSiblingsDialogue(performance.now());
    return;
  }
  if (nextInteraction === 'lucy') { interactionPrompt.hidden = true; startLucyDialogue(); return; }
  if (nextInteraction === 'helen') { interactionPrompt.hidden = true; startHelenDialogue(); return; }
  if (nextInteraction === 'andy' || nextInteraction === 'aliya') { interactionPrompt.hidden = true; startMusicHouseDialogue(nextInteraction); return; }
  if (nextInteraction === 'julian' || nextInteraction === 'tim') { interactionPrompt.hidden = true; startGymNpcDialogue(nextInteraction); return; }
  if (target) interactionPrompt.textContent = target.label;
  interactionPrompt.hidden = !target || noelDialogueOpen;
}
function draw(timeMs = 0): void {
  // The cave is small enough to show in full with no camera panning at all;
  // every other interior is bigger than the canvas and keeps scrolling.
  const viewportWidth = isCaveInterior ? WORLD_WIDTH : Math.min(WORLD_WIDTH, canvas.width / VIEW_SCALE);
  const viewportHeight = isCaveInterior ? WORLD_HEIGHT : Math.min(WORLD_HEIGHT, canvas.height / VIEW_SCALE);
  const cameraX = Math.round(Math.max(0, Math.min(WORLD_WIDTH - viewportWidth, player.x - viewportWidth / 2)));
  const cameraY = Math.round(Math.max(0, Math.min(WORLD_HEIGHT - viewportHeight, player.y - viewportHeight / 2)));
  // Stretch the viewport to fill the canvas on both axes so a world smaller
  // than the canvas (the cave) shows in full with no letterboxed black bars.
  const scaleX = canvas.width / viewportWidth;
  const scaleY = canvas.height / viewportHeight;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#0b0d0d';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  const interiorSourceScale = scene.sourceScale;
  context.drawImage(
    interior,
    cameraX * interiorSourceScale,
    cameraY * interiorSourceScale,
    viewportWidth * interiorSourceScale,
    viewportHeight * interiorSourceScale,
    0,
    0,
    viewportWidth * scaleX,
    viewportHeight * scaleY,
  );
  if (isCaveInterior) {
    // The background art bakes in a colander graphic that the darkness
    // overlay would otherwise dim; always erase it here and redraw it (below,
    // after the overlay) so it stays fully lit like the player.
    context.fillStyle = '#0b0d0d';
    context.fillRect(
      (CAVE_COLANDER.eraseX - cameraX) * scaleX,
      (CAVE_COLANDER.eraseY - cameraY) * scaleY,
      CAVE_COLANDER.eraseWidth * scaleX,
      CAVE_COLANDER.eraseHeight * scaleY,
    );
  }
  if (isCaveInterior) {
    const frame = caveSiblings?.isEntering
      ? CAVE_SIBLINGS_WALK_FRAMES[caveSiblings.walkFrame]
      : CAVE_SIBLINGS_IDLE_FRAME;
    if (frame) {
      const [sourceX, sourceY, sourceWidth, sourceHeight] = frame;
      context.drawImage(
        siblingsSprite,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        Math.round((CAVE_SIBLINGS.x - cameraX - CAVE_SIBLINGS.width / 2) * scaleX),
        Math.round(((caveSiblings?.y ?? CAVE_SIBLINGS.endY) - cameraY - CAVE_SIBLINGS.height) * scaleY),
        CAVE_SIBLINGS.width * scaleX,
        CAVE_SIBLINGS.height * scaleY,
      );
    }
  }
  if (isDiaryLabInterior || isMansionInterior) {
    context.drawImage(
      noelSprite,
      Math.round((NOEL.x - cameraX - NOEL.width / 2) * scaleX),
      Math.round((NOEL.y - cameraY - NOEL.height) * scaleY),
      NOEL.width * scaleX,
      NOEL.height * scaleY,
    );
  }
  if (isMusicShopInterior) {
    drawSceneryNpcs(context, musicHouseNpcs, cameraX, cameraY, scaleX, scaleY, timeMs);
  }
  if (isGymInterior) {
    context.drawImage(gymGloves, Math.round((292 - cameraX) * scaleX + 50), Math.round((270 - cameraY - 195) * scaleY), 50 * scaleX, 81 * scaleY);
    drawSceneryNpcs(context, gymNpcs, cameraX, cameraY, scaleX, scaleY, timeMs);
  }
  if (isBookshopInterior) drawSceneryNpcs(context, bookshopNpcs, cameraX, cameraY, scaleX, scaleY);
  if (isPlantRoomInterior) drawSceneryNpcs(context, [{ x: 355, y: 350, width: 42, height: 75, image: lucy!.sprite }], cameraX, cameraY, scaleX, scaleY);
  if (SHOW_COLLISION_SHAPES) {
    context.save();
    context.globalAlpha = 0.55;
    if (isCaveInterior) {
      context.fillStyle = '#005cff';
      for (const [wallX, wallY, wallWidth, wallHeight] of CAVE_WALLS) {
        context.fillRect(
          (wallX - cameraX) * scaleX,
          (wallY - cameraY) * scaleY,
          wallWidth * scaleX,
          wallHeight * scaleY,
        );
      }
    } else if (isMusicShopInterior || isGymInterior || isBookshopInterior || scene.kind === 'mansion' || scene.kind === 'plantRoom') {
      context.fillStyle = '#005cff';
      const firstColumn = Math.max(0, Math.floor(cameraX / collision.cellSize));
      const lastColumn = Math.min(collision.columns - 1, Math.ceil((cameraX + viewportWidth) / collision.cellSize));
      const firstRow = Math.max(0, Math.floor(cameraY / collision.cellSize));
      const lastRow = Math.min(collision.rows - 1, Math.ceil((cameraY + viewportHeight) / collision.cellSize));
      for (let row = firstRow; row <= lastRow; row += 1) {
        for (let column = firstColumn; column <= lastColumn; column += 1) {
          const x = column * collision.cellSize;
          const y = row * collision.cellSize;
          if (!collision.isBlocked(x + collision.cellSize / 2, y + collision.cellSize / 2)) continue;
          context.fillRect(
            (x - cameraX) * scaleX,
            (y - cameraY) * scaleY,
            collision.cellSize * scaleX,
            collision.cellSize * scaleY,
          );
        }
      }
    } else {
      const collisionSourceScale = 1;
      context.drawImage(
        collisionMask,
        cameraX * collisionSourceScale,
        cameraY * collisionSourceScale,
        viewportWidth * collisionSourceScale,
        viewportHeight * collisionSourceScale,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    }
    context.restore();
  }
  if (isCaveInterior) {
    // Darken the environment and the siblings but never the player, who
    // should stay fully visible regardless of how dark the cave gets.
    context.save();
    context.globalAlpha = caveSiblings?.darknessAlpha ?? 0.2;
    context.fillStyle = '#000';
    context.fillRect(0, 0, viewportWidth * scaleX, viewportHeight * scaleY);
    context.restore();
  }
  if (isCaveInterior && !caveColanderHeld) {
    drawColander(
      context,
      Math.round((CAVE_COLANDER.x - cameraX) * scaleX),
      Math.round((CAVE_COLANDER.eraseY + 12 - cameraY) * scaleY),
      Math.min(scaleX, scaleY),
    );
  }
  const spriteFrame = getPlayerSpriteFrame(SEAL_MODE, player.direction, player.frame, PLAYER_SCALE);
  const { sourceX, sourceY, sourceWidth, sourceHeight, width, height, baselineOffset } = spriteFrame;
  context.drawImage(
    spriteSheet,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    Math.round((player.x - cameraX - width / 2) * scaleX),
    Math.round((player.y - cameraY - height + baselineOffset) * scaleY),
    width * scaleX,
    height * scaleY,
  );
  if (caveColanderHeld) {
    drawColander(
      context,
      Math.round((player.x - cameraX + 19) * scaleX),
      Math.round((player.y - cameraY - 30) * scaleY),
      Math.min(scaleX, scaleY),
    );
  }
  interiorDoors.drawOverlay(context, doorOverlay, cameraX, cameraY, scaleX);
  if (isMusicShopInterior) context.drawImage(
    musicDjMachine,
    Math.round((247 - cameraX) * scaleX),
    Math.round((254 - cameraY) * scaleY),
    48 * scaleX,
    30 * scaleY,
  );
  context.restore();
}
function gameLoop(time: number): void {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  updatePowerups(time);
  if (isJumpMenuOpen()) {
    draw(time);
    requestAnimationFrame(gameLoop);
    return;
  }
  caveSiblings?.update(deltaTime, time);
  updatePlayer(deltaTime);
  updateNearbyInteraction();
  interiorDoors.update(player.x, player.y);
  draw(time);
  requestAnimationFrame(gameLoop);
}
interiorDoors.syncExitLink(document.querySelector<HTMLAnchorElement>('.interior-exit'));
bindControls(); setupAudioMute(); setupInteriorAmbience(enteredDoor);
setupInventory();
setupJump();
const requiredImages = [
  interior,
  spriteSheet,
  ...(scene.collisionMaskSource ? [collisionMask] : []),
  ...(scene.doorOverlaySource ? [doorOverlay] : []),
  ...(isDiaryLabInterior || isMansionInterior ? [noelSprite] : []),
  ...(lucy ? [lucy.sprite] : []),
  ...(isBookshopInterior ? bookshopNpcs.map((npc) => npc.image) : []),
  ...(isCaveInterior ? [siblingsSprite] : []),
  ...(isMusicShopInterior ? [...musicHouseNpcs.map((npc) => npc.image), musicDjMachine] : []),
  ...(isGymInterior ? [gymGloves, ...gymNpcs.map((npc) => npc.image)] : []),
];
Promise.all(requiredImages.map((image) => image.decode()))
  .then(() => {
    context.imageSmoothingEnabled = false;
    requestAnimationFrame(gameLoop);
  })
  .catch((error: unknown) => {
    console.error(error);
    context.fillStyle = '#f5fff6';
    context.font = '13px monospace';
    context.fillText('Could not load the interior.', 120, 240); });
