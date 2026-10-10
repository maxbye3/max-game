import { isTimInputPowerActive, timInputVector, updateTimInputWorld } from './tim-input-power.js';
import { isSamPowerActive, samMovementMultiplier, updateSamPower } from './sam-power.js';
import { isReiPowerActive, reiWorldDeltaTime, updateReiWorld, reiMovementMultiplier } from './rei-power.js';
import { isNoelPowerActive, updateNoelWorld, noelMovementMultiplier } from './noel-power.js';
import { isMikePowerActive, mikeWorldDeltaTime, updateMikeWorld, mikeMovementMultiplier } from './mike-power.js';
import { lucyMovementMultiplier, isLucyPowerActive, updateLucyWorld } from './lucy-power.js';
import { isKatiePowerActive, katieWorldDeltaTime, updateKatieWorld } from './katie-power.js';
import { isJulianPowerActive, julianWorldDeltaTime, updateJulianWorld, julianMovementMultiplier } from './julian-power.js';
import { isJuPowerActive, juInputVector, juMovementMultiplier, juWorldDeltaTime, updateJuWorld } from './ju-power.js';
import { isJoePowerActive, updateJoeWorld } from './joe-power.js';
import { helenMovementMultiplier, helenWorldDeltaTime, isHelenPowerActive, updateHelenWorld } from './helen-power.js';
import { isGeorgiaPowerActive, moveGeorgiaFlight, settleGeorgiaFlight, updateGeorgiaWorld } from './georgia-power.js';
import { danWorldDeltaTime, isDanPowerActive, updateDanWorld } from './dan-power.js';
import { chrisMovementMultiplier, chrisWorldDeltaTime, isChrisPowerActive, updateChrisWorld } from './chris-power.js';
import { bochraMovementMultiplier, updateBochraWorld } from './bochra-power.js';
import { hasCaveColander } from './colander.js';
import { isAlexResurrectionUiBlocking } from './alex-s-power-ui.js';
import { announceWorldInteraction } from './world-interactions.js';
import { createGameAudio, setupAudioMute } from './audio-mute.js';
import { CAVE_SIBLINGS, CaveSiblingsController } from './cave-siblings.js';
import { CinemaAudienceController } from './cinema-audience.js';
import { BOOKSHOP_NPCS } from './bookshop-npcs.js';
import { DiaryLabFeatures } from './diary-lab-features.js';
import { canvas, context, requireElement } from './dom.js';
import { GymNpcDialogueController } from './gym-npc-dialogue.js';
import { GoodreadsReadingController } from './goodreads-reading.js';
import { HELEN_DIALOGUE_LINES } from './helen-dialogue.js';
import { DirectionInputController } from './input.js';
import { InteriorCollision } from './interior-collision.js';
import { InteriorDoorsController } from './interior-doors.js';
import { setupInventory, updatePowerups } from './inventory.js';
import { maddyWorldDeltaTime } from './maddy-tea-power.js';
import { chargeEdGift, edPowerSecondsLeft, showHalsteadTattoo } from './ed-power.js';
import { niallSpeedMultiplier } from './niall-speed-power.js';
import { adamAirStrideMultiplier } from './adam-power.js';
import { isOscarEaten, isOscarPowerActive, isOscarTerrainEaten, oscarMovementMultiplier, updateOscarPower, settleOscarDigestion } from './oscar-power.js';
import { andyMovementMultiplier, andyWorldDeltaTime } from './andy-power.js';
import { updateAndyWorld } from './andy-world-power.js';
import { isJumpMenuOpen, setupJump } from './jump.js';
import { GYM_NPCS } from './gym-npcs.js';
import { LucyController } from './lucy.js';
import { setupInteriorAmbience } from './plant-room-ambience.js';
import { MusicHouseDialogueController } from './music-house-dialogue.js';
import { MUSIC_HOUSE_NPCS } from './music-house-npcs.js';
import { isTimAtMusicShop } from './tim-location.js';
import { markInteriorVisited } from './world-state.js';
import { NOEL, getInteriorScene, type InteractionKind } from './interior-scenes.js';
import type { Direction } from './types.js';
import { moveWithCollisions } from './movement.js';
import { setProfileImage } from './profile-images.js';
import { beginDialogueAudio, endDialogueAudio, bindPowerDialogueDismissal } from './dialogue-audio.js';
import { nextDialogueVisitIndex } from './dialogue-visit.js';
import { addGift, hasGift, HELEN_ITEM, NOEL_ITEM } from './inventory-gifts.js';
import { getSongArtwork, getUnlockedSongs, unlockSong } from './music-library.js';
import { SHOW_COLLISION_SHAPES } from './config.js';
import { startGameLoop } from './game-loop.js';
import { webImageSource } from './web-images.js';
import { resolveSiteAsset } from './site-assets.js';
import { NOEL_DIALOGUE_LINES } from './noel-dialogue.js';
import { DadDialogueController } from './dad-dialogue-controller.js';
import { createInteriorRenderer } from './interior-render.js';

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
const bookshopNpcs = BOOKSHOP_NPCS.map((npc, index) => ({ ...npc, id: index === 0 ? 'alex-w' : 'helen', image: new Image() }));
const musicHouseNpcs = MUSIC_HOUSE_NPCS.filter((npc) => npc.id !== 'tim' || isTimAtMusicShop()).map((npc, index) => ({ ...npc, id: npc.id ?? (index === 0 ? 'andy' : 'aliya'), image: new Image() }));
const gymNpcs = GYM_NPCS.map((npc) => ({ ...npc, image: new Image() }));
const cinemaNpcs = isCinemaInterior ? [{ id: 'dad', source: '../chat/dad/avatar.png', x: 398, y: 462, width: 48, height: 72, image: new Image() }] : [];
interior.src = webImageSource(scene.backgroundSource);
if (SHOW_COLLISION_SHAPES && scene.collisionMaskSource) collisionMask.src = scene.collisionMaskSource;
if (scene.doorOverlaySource) doorOverlay.src = webImageSource(scene.doorOverlaySource);
spriteSheet.src = webImageSource(SEAL_MODE ? '../player/seal-game.png?v=20260831-transparent' : '../player/SpriteSheet.png');
if (isDiaryLabInterior || isMansionInterior) noelSprite.src = webImageSource('../chat/noel/interior-avatar.png');
if (isCaveInterior) siblingsSprite.src = webImageSource('../chat/siblings/girls-sprite.png');
if (isMusicShopInterior) musicDjMachine.src = '../img/internal/music-dj-machine.png';
if (isBookshopInterior) {
  bookshopNpcs.forEach((npc) => {
    npc.image.src = webImageSource(npc.source);
  });
}
if (isMusicShopInterior) {
  musicHouseNpcs.forEach((npc) => {
    npc.image.src = webImageSource(npc.source);
  });
}
if (isGymInterior) { gymGloves.src = '../img/internal/gloves.png'; gymNpcs.forEach((npc) => { npc.image.src = webImageSource(npc.source); }); }
if (isCinemaInterior) cinemaNpcs.forEach((npc) => { npc.image.src = webImageSource(npc.source); });
const colanderWarningVoices = [
  createGameAudio('../chat/siblings/maddy.mp3'),
  createGameAudio('../chat/siblings/marina.mp3'),
];
colanderWarningVoices.forEach((voice) => {
  voice.preload = 'none';
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
let noelDialogueLineIndex = 0; let helenDialogueLineIndex = 0;
type NoelDialogueStage = 'opening' | 'question' | 'decline' | 'reward' | 'done';
type NoelReward = 'item' | 'song';
let noelDialogueStage: NoelDialogueStage = 'done';
let noelRewardQueue: NoelReward[] = [];
const isCharacterInteraction = (interaction: InteractionKind | null): boolean => interaction === 'noel' || interaction === 'siblings' || interaction === 'lucy' || interaction === 'andy' || interaction === 'aliya' || interaction === 'julian' || interaction === 'tim' || interaction === 'helen' || interaction === 'dad';
const OSCAR_INTERIOR_TARGETS = INTERACTION_TARGETS
  .filter((interaction) => isCharacterInteraction(interaction.kind))
  .map((interaction) => ({ id: interaction.kind, x: interaction.x, y: interaction.y, height: 42 }));
const katieSceneryTargets = (isGymInterior ? gymNpcs : isBookshopInterior ? bookshopNpcs : isMusicShopInterior ? musicHouseNpcs : isCinemaInterior ? cinemaNpcs : [])
  .flatMap(({ id, x, y, height }) => id ? [{ id, x, y, height }] : []);
const KATIE_INTERIOR_TARGETS = [...katieSceneryTargets, ...OSCAR_INTERIOR_TARGETS.filter((target) => !katieSceneryTargets.some((npc) => npc.id === target.id))]
  .map((target) => ({ ...target, height: target.id === 'noel' ? NOEL.height : target.id === 'siblings' ? CAVE_SIBLINGS.height : target.id === 'lucy' ? 75 : target.height }));
const input = new DirectionInputController({ canHold: () => !isAlexResurrectionUiBlocking() });
const dadDialogue = new DadDialogueController(() => { input.releaseAll(); openNoelDialogue(); });
function openNoelDialogue(): void {
  announceWorldInteraction();
  input.releaseAll();
  noelDialogueOpen = true;
}
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
const FLIGHT_BOUNDS = { minX: 23, minY: 160, maxX: WORLD_WIDTH - 23, maxY: WORLD_HEIGHT - 1 };
const flightLandingBlocked = (x: number, y: number): boolean => collision.playerIsBlocked(x, y) || scene.doors.some((door) => Math.hypot(x - door.exitX, y - door.exitY) < 32);
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
      beginDialogueAudio(); openNoelDialogue();
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
  const lastLine = Math.max(0, NOEL_DIALOGUE_LINES.length - 1);
  const index = Math.min(noelVisitStage, lastLine);
  noelVisitStage = Math.min(noelVisitStage + 1, lastLine);
  return index;
}
function closeNoelDialogue(): void {
  endDialogueAudio(); caveSiblings?.closeDialogue();
  noelDialogueOpen = false;
  noelDialogueStage = 'done';
  noelRewardQueue = [];
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
  interactionPrompt.hidden = nearbyInteraction === null || (isCharacterInteraction(nearbyInteraction) && nearbyInteraction !== 'dad');
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
  openNoelDialogue(); beginDialogueAudio('Maddy', '../');
  showSiblingsDialogue();
}
function startSiblingsWebsiteReturnDialogue(): void {
  if (!caveSiblings?.canResumeAfterWebsite) return;
  if (noelDialogueOpen) closeNoelDialogue();
  caveSiblings.resumeAfterWebsite(performance.now());
  openNoelDialogue(); beginDialogueAudio('Maddy', '../');
  showSiblingsDialogue();
}
function startNoelDialogue(): void {
  if (nearbyInteraction !== 'noel' || noelDialogueOpen) return;
  openNoelDialogue(); beginDialogueAudio(NOEL_NAME, '../');
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
  openNoelDialogue(); beginDialogueAudio('Lucy', '../');
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
function showHelenReadingOffer(): void {
  helenReadingOfferPending = false;
  noelDialogueLine.textContent = 'Would you like to see what Max is reading?';
  noelDialogueProgress.hidden = true; noelDialogueNext.hidden = true; helenReadingOptions.hidden = false;
  if (addGift(HELEN_ITEM)) {
    noelGiftConfirmation.textContent = "Helen's item was added to your inventory.";
    noelGiftConfirmation.hidden = false;
  }
}
function startHelenDialogue(): void { if (nearbyInteraction !== 'helen' || noelDialogueOpen) return; input.releaseAll(); openNoelDialogue(); beginDialogueAudio('Helen', '../'); helenDialogueLineIndex = nextDialogueVisitIndex('helen', HELEN_DIALOGUE_LINES.length); helenReadingOfferPending = true; noelSpeaker.textContent = 'Helen'; setProfileImage(noelDialogueProfile, 'Helen', '../'); showHelenDialogue(); noelDialogueQuestion.hidden = true; noelDialogueOptions.hidden = true; siblingsDialogueOptions.hidden = true; musicDialogueOptions.hidden = true; helenReadingOptions.hidden = true; noelDialogue.hidden = false; interactionPrompt.hidden = true; if (edPowerSecondsLeft() > 0) { showHalsteadTattoo('Helen'); addGift(HELEN_ITEM); chargeEdGift(HELEN_ITEM); } }
function openFeature(kind: 'diary' | 'experiments' | 'reading'): void {
  input.releaseAll(); endDialogueAudio();
  openNoelDialogue();
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
  openNoelDialogue(); beginDialogueAudio('Maddy', '../');
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
  openNoelDialogue(); beginDialogueAudio(kind === 'andy' ? 'Andy' : 'Aliya', '../');
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
  if (nearbyInteraction !== kind || noelDialogueOpen) return; input.releaseAll(); openNoelDialogue();
  beginDialogueAudio(kind === 'julian' ? 'Julian' : 'Tim', '../'); const npc = gymNpcDialogue.start(kind); noelSpeaker.textContent = npc.name; noelDialogueProfile.src = npc.profileSource ?? ''; noelDialogueProfile.alt = npc.profileSource ? `${npc.name} profile` : ''; noelDialogueProfile.hidden = !npc.profileSource;
  noelDialogueQuestion.hidden = true; noelDialogueOptions.hidden = true; siblingsDialogueOptions.hidden = true; musicDialogueOptions.hidden = true; noelDialogue.hidden = false; interactionPrompt.hidden = true;
}
function startDadDialogue(): void {
  if (nearbyInteraction !== 'dad' || noelDialogueOpen) return;
  dadDialogue.start(); interactionPrompt.hidden = true;
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
  else if (nearbyInteraction === 'dad') startDadDialogue();
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
    if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select')) return;
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
    else if (nearbyInteraction === 'dad') dadDialogue.next();
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
  if (isAlexResurrectionUiBlocking()) { input.releaseAll(); player.animationTime = 0; player.frame = 0; return; }
  settleOscarDigestion(player, flightLandingBlocked);
  if (isDanPowerActive() || isKatiePowerActive()) { player.animationTime = 0; player.frame = 0; return; }
  if (caveSiblings?.isEntering) {
    player.animationTime = 0;
    player.frame = 0;
    return;
  }
  let dx = 0;
  let dy = 0;
  if (input.isHeld('left')) dx -= 1;
  if (input.isHeld('right')) dx += 1;
  if (input.isHeld('up')) dy -= 1;
  if (input.isHeld('down')) dy += 1;
  const juDirection = juInputVector(dx, dy);
  dx = juDirection.x; dy = juDirection.y;
  const timDirection = timInputVector(dx, dy); dx = timDirection.x; dy = timDirection.y;
  const flying = isGeorgiaPowerActive();
  const movementSpeed = SPEED * niallSpeedMultiplier() * adamAirStrideMultiplier() * oscarMovementMultiplier() * andyMovementMultiplier() * bochraMovementMultiplier() * chrisMovementMultiplier() * helenMovementMultiplier() * juMovementMultiplier() * julianMovementMultiplier() * lucyMovementMultiplier() * mikeMovementMultiplier() * noelMovementMultiplier() * reiMovementMultiplier() * samMovementMultiplier();
  if (flying) moveGeorgiaFlight(player, dx, dy, movementSpeed, deltaTime, FLIGHT_BOUNDS);
  if (dx === 0 && dy === 0) {
    player.animationTime = 0;
    player.frame = 0;
    return;
  }
  const length = Math.hypot(dx, dy);
  if (!flying) moveWithCollisions(
    player,
    (dx / length) * movementSpeed * deltaTime,
    (dy / length) * movementSpeed * deltaTime,
    (x, y) => collision.playerIsBlocked(x, y) && !isOscarTerrainEaten(x, y),
  );
  if (dx < 0 && dy < 0) player.direction = 'upLeft';
  else if (dx > 0 && dy < 0) player.direction = 'upRight';
  else if (dx < 0 && dy > 0) player.direction = 'downLeft';
  else if (dx > 0 && dy > 0) player.direction = 'downRight';
  else if (dx < 0) player.direction = 'left';
  else if (dx > 0) player.direction = 'right';
  else if (dy < 0) player.direction = 'up';
  else player.direction = 'down';
  player.animationTime += deltaTime * helenMovementMultiplier() * juMovementMultiplier() * julianMovementMultiplier() * lucyMovementMultiplier() * mikeMovementMultiplier() * noelMovementMultiplier() * reiMovementMultiplier() * samMovementMultiplier();
  player.frame = Math.floor(player.animationTime * 11) % FRAME_COUNT;
}
function updateNearbyInteraction(): void {
  if (isCinemaInterior) {
    const target = INTERACTION_TARGETS
      .map((interaction) => ({ ...interaction, playerDistance: Math.hypot(player.x - interaction.x, player.y - interaction.y) }))
      .filter((interaction) => interaction.playerDistance <= interaction.distance)
      .sort((first, second) => first.playerDistance - second.playerDistance)[0];
    nearbyInteraction = target?.kind ?? null;
    if (target) interactionPrompt.textContent = target.label;
    interactionPrompt.hidden = !target || noelDialogueOpen;
    cinemaAudience?.update(player.x, player.y, noelDialogueOpen);
    return;
  }
  const target = INTERACTION_TARGETS
    .filter((interaction) => interaction.kind !== 'colander' || !caveColanderHeld)
    .filter((interaction) => !isOscarEaten(interaction.kind))
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
  if (noelDialogueOpen && nextInteraction) closeNoelDialogue();
  if (previousInteraction === 'siblings' && nextInteraction !== 'siblings') {
    caveSiblings?.leaveRange();
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
const draw = createInteriorRenderer({
  scene, player, sealMode: SEAL_MODE, collision, interior, collisionMask, doorOverlay, spriteSheet,
  noelSprite, siblingsSprite, musicDjMachine, gymGloves, bookshopNpcs, musicHouseNpcs, gymNpcs, cinemaNpcs,
  caveSiblings, lucy, interiorDoors, getCaveColanderHeld: () => caveColanderHeld,
});
let worldAnimationTime = 0;
function gameLoop(time: number): void {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  const worldDeltaTime = reiWorldDeltaTime(mikeWorldDeltaTime(katieWorldDeltaTime(julianWorldDeltaTime(juWorldDeltaTime(helenWorldDeltaTime(danWorldDeltaTime(chrisWorldDeltaTime(andyWorldDeltaTime(maddyWorldDeltaTime(deltaTime, time), time), time), time), time), time), time), time), time), time);
  worldAnimationTime = worldAnimationTime === 0 ? time : worldAnimationTime + worldDeltaTime * 1000;
  previousTime = time;
  updatePowerups(time);
  if (!isKatiePowerActive(time)) settleGeorgiaFlight(player, flightLandingBlocked, FLIGHT_BOUNDS, time);
  let visibleKatieTargets = KATIE_INTERIOR_TARGETS.filter((target) => !isOscarEaten(target.id));
  let visibleOscarTargets = OSCAR_INTERIOR_TARGETS.filter((target) => !isOscarEaten(target.id));
  updateReiWorld(time, player.x, player.y, visibleKatieTargets);
  updateNoelWorld(time, player.x, player.y, visibleKatieTargets);
  updateMikeWorld(time, player.x, player.y, visibleKatieTargets);
  updateLucyWorld(time, player.x, player.y, visibleKatieTargets);
  updateKatieWorld(time, player.x, player.y, visibleKatieTargets);
  updateJulianWorld(time, player.x, player.y, visibleOscarTargets);
  updateOscarPower(time, player.x, player.y, OSCAR_INTERIOR_TARGETS, player.direction);
  if (isOscarPowerActive(time)) {
    visibleKatieTargets = KATIE_INTERIOR_TARGETS.filter((target) => !isOscarEaten(target.id));
    visibleOscarTargets = OSCAR_INTERIOR_TARGETS.filter((target) => !isOscarEaten(target.id));
  }
  updateAndyWorld(time, player.x, player.y, OSCAR_INTERIOR_TARGETS);
  updateJoeWorld(time, player.x, player.y, visibleOscarTargets);
  updateJuWorld(time, player.x, player.y, visibleOscarTargets);
  updateHelenWorld(time, player.x, player.y, visibleOscarTargets);
  if (isJumpMenuOpen() || isAlexResurrectionUiBlocking()) {
    updateGeorgiaWorld(time, player.x, player.y, visibleOscarTargets);
    updateChrisWorld(time, player.x, player.y, visibleOscarTargets);
    updateDanWorld(time, player.x, player.y, visibleOscarTargets);
    draw(time, worldAnimationTime);
    return;
  }
  caveSiblings?.update(worldDeltaTime, time);
  updatePlayer(deltaTime);
  updateSamPower(time, player.x, player.y, visibleKatieTargets, player.direction);
  updateTimInputWorld(time, player.x, player.y);
  updateBochraWorld(time, player.x, player.y, OSCAR_INTERIOR_TARGETS);
  updateChrisWorld(time, player.x, player.y, visibleOscarTargets);
  updateDanWorld(time, player.x, player.y, visibleOscarTargets);
  updateGeorgiaWorld(time, player.x, player.y, visibleOscarTargets);
  if (!isChrisPowerActive(time) && !isDanPowerActive(time) && !isGeorgiaPowerActive(time) && !isHelenPowerActive(time) && !isJoePowerActive(time) && !isJuPowerActive(time) && !isJulianPowerActive(time) && !isKatiePowerActive(time) && !isLucyPowerActive(time) && !isMikePowerActive(time) && !isNoelPowerActive(time) && !isOscarPowerActive(time) && !isReiPowerActive(time) && !isSamPowerActive(time) && !isTimInputPowerActive(time)) updateNearbyInteraction();
  if (!isGeorgiaPowerActive(time) && !isJulianPowerActive(time) && !isKatiePowerActive(time) && !isLucyPowerActive(time) && !isMikePowerActive(time) && !isNoelPowerActive(time) && !isOscarPowerActive(time) && !isReiPowerActive(time) && !isSamPowerActive(time) && !isTimInputPowerActive(time)) interiorDoors.update(player.x, player.y);
  draw(time, worldAnimationTime);
}
interiorDoors.syncExitLink(document.querySelector<HTMLAnchorElement>('.interior-exit'));
bindControls(); setupAudioMute(); setupInteriorAmbience(enteredDoor);
setupInventory();
bindPowerDialogueDismissal(closeNoelDialogue);
window.addEventListener('max-game:alex-s-dialogue', () => { input.releaseAll(); closeNoelDialogue(); });
document.querySelector('.interior-exit')?.addEventListener('click', (event) => { if (isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive() || isTimInputPowerActive()) event.preventDefault(); });
setupJump();
const requiredImages = [
  interior,
  spriteSheet,
  ...(SHOW_COLLISION_SHAPES && scene.collisionMaskSource ? [collisionMask] : []),
  ...(scene.doorOverlaySource ? [doorOverlay] : []),
  ...(isDiaryLabInterior || isMansionInterior ? [noelSprite] : []),
  ...(lucy ? [lucy.sprite] : []),
  ...(isBookshopInterior ? bookshopNpcs.map((npc) => npc.image) : []),
  ...(isCaveInterior ? [siblingsSprite] : []),
  ...(isMusicShopInterior ? [...musicHouseNpcs.map((npc) => npc.image), musicDjMachine] : []),
  ...(isGymInterior ? [gymGloves, ...gymNpcs.map((npc) => npc.image)] : []),
  ...cinemaNpcs.map((npc) => npc.image),
];
Promise.all(requiredImages.map((image) => image.decode()))
  .then(() => {
    context.imageSmoothingEnabled = false;
    startGameLoop(gameLoop, () => { previousTime = 0; });
  })
  .catch((error: unknown) => {
    console.error(error);
    context.fillStyle = '#f5fff6';
    context.font = '13px monospace';
    context.fillText('Could not load the interior.', 120, 240); });
