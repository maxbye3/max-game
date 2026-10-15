import { getPlayerSpriteFrame } from '../core/player-sprite.js';
import { setupLucyPowerInput } from '../powers/lucy/lucy-power-input.js';
import { isTimInputPowerActive, timInputVector, updateTimInputWorld } from '../powers/tim/tim-input-power.js';
import { hasAlexEatenDoughnut } from '../core/alex-w-state.js';
import { getPlayerBody, setPlayerBody } from '../core/player-body.js';
import { GHOST_SPRITE_SOURCE } from '../generated/core/ghost-sprite.generated.js';
import { isWheldonPlayerSpriteEnabled, setWheldonPlayerSpriteEnabled } from '../core/player-sprite-test.js';
import { isSamPowerActive, samMovementMultiplier, updateSamPower } from '../powers/sam/sam-power.js';
import { isReiPowerActive, reiWorldDeltaTime, updateReiWorld, reiMovementMultiplier } from '../powers/rei/rei-power.js';
import { isNoelPowerActive, updateNoelWorld, noelMovementMultiplier } from '../powers/noel/noel-power.js';
import { aliceMovementMultiplier, aliceWorldDeltaTime, isAlicePowerActive, updateAliceWorld } from '../powers/alice/alice-power.js';
import { isMikePowerActive, mikeWorldDeltaTime, updateMikeWorld, mikeMovementMultiplier } from '../powers/mike/mike-power.js';
import { lucyMovementMultiplier, isLucyPowerActive, updateLucyWorld } from '../powers/lucy/lucy-power.js';
import { isKatiePowerActive, katieWorldDeltaTime, updateKatieWorld } from '../powers/katie/katie-power.js';
import { isJulianPowerActive, julianWorldDeltaTime, updateJulianWorld, julianMovementMultiplier } from '../powers/julian/julian-power.js';
import { isJuPowerActive, juInputVector, juMovementMultiplier, juWorldDeltaTime, updateJuWorld } from '../powers/ju/ju-power.js';
import { isJoePowerActive, updateJoeWorld } from '../powers/joe/joe-power.js';
import { helenMovementMultiplier, helenWorldDeltaTime, isHelenPowerActive, updateHelenWorld } from '../powers/helen/helen-power.js';
import { isGeorgiaPowerActive, moveGeorgiaFlight, settleGeorgiaFlight, updateGeorgiaWorld } from '../powers/georgia/georgia-power.js';
import { danWorldDeltaTime, isDanPowerActive, updateDanWorld } from '../powers/dan/dan-power.js';
import { chrisMovementMultiplier, chrisWorldDeltaTime, isChrisPowerActive, updateChrisWorld } from '../powers/chris/chris-power.js';
import { bochraMovementMultiplier, updateBochraWorld } from '../powers/bochra/bochra-power.js';
import { hasCaveColander } from '../core/colander.js';
import { isAlexResurrectionUiBlocking } from '../powers/alex-s/alex-s-power-ui.js';
import { announceWorldInteraction } from '../core/world-interactions.js';
import { createGameAudio, setupAudioMute } from '../core/audio-mute.js';
import { CAVE_SIBLINGS, CaveSiblingsController } from './cave-siblings.js';
import { CinemaAudienceController } from './cinema-audience.js';
import { createDiaryRoomNpcs } from './diary-room-npcs.js';
import { BOOKSHOP_NPCS } from './bookshop-npcs.js';
import { DiaryLabFeatures } from './diary-lab-features.js';
import { JournalGalleryController } from './journal-gallery.js';
import { DoughnutShopController } from './doughnut-shop.js';
import { canvas, context, requireElement } from '../core/dom.js';
import { GymNpcDialogueController } from './gym-npc-dialogue.js';
import { GoodreadsReadingController } from './goodreads-reading.js';
import { LetterboxdReviewsController } from './letterboxd-reviews.js';
import { HELEN_DIALOGUE_LINES } from '../generated/dialogues/helen-dialogue.js';
import { NOEL_DIALOGUE_LINES } from '../generated/dialogues/noel-dialogue.js';
import { DirectionInputController } from '../core/input.js';
import { isThoughtsOpen } from '../core/thoughts.js';
import { InteriorCollision } from './interior-collision.js';
import { InteriorDoorsController } from './interior-doors.js';
import { setupInventory, updatePowerups } from '../core/inventory.js';
import { maddyWorldDeltaTime } from '../powers/maddy/maddy-tea-power.js';
import { chargeEdGift, edPowerSecondsLeft, showHalsteadTattoo } from '../powers/ed/ed-power.js';
import { niallSpeedMultiplier } from '../powers/niall/niall-speed-power.js';
import { adamAirStrideMultiplier } from '../powers/adam/adam-power.js';
import { isOscarEaten, isOscarPowerActive, isOscarTerrainEaten, oscarMovementMultiplier, updateOscarPower, settleOscarDigestion } from '../powers/oscar/oscar-power.js';
import { andyMovementMultiplier, andyWorldDeltaTime } from '../powers/andy/andy-power.js';
import { updateAndyWorld } from '../powers/andy/andy-world-power.js';
import { characterAsset, playerAsset } from '../core/character-assets.js';
import { isJumpMenuOpen, setupJump } from '../core/jump.js';
import { GYM_NPCS } from './gym-npcs.js';
import { LucyController } from '../characters/lucy/lucy.js';
import { setupInteriorAmbience } from './plant-room-ambience.js';
import { MusicHouseDialogueController } from './music-house-dialogue.js';
import { MUSIC_HOUSE_NPCS } from './music-house-npcs.js';
import { isTimAtCinema, isTimAtMusicShop } from '../characters/tim/tim-location.js';
import { markInteriorVisited } from '../core/world-state.js';
import { JOSH, NOEL, WHELDON, getInteriorScene, type InteractionKind } from './interior-scenes.js';
import { JoshDialogueController } from './josh-dialogue.js';
import type { Direction } from '../core/types.js';
import { moveWithCollisions } from '../core/movement.js';
import { setProfileImage } from '../core/profile-images.js';
import { beginDialogueAudio, endDialogueAudio, bindPowerDialogueDismissal } from '../core/dialogue-audio.js';
import { nextDialogueVisitIndex } from '../core/dialogue-visit.js';
import { prependPlayerReaction } from '../core/player-dialogue.js';
import { addGift, hasGift, HELEN_ITEM, NOEL_ITEM } from '../core/inventory-gifts.js';
import { getUnlockedSongs, unlockSong } from './music-library.js';
import { SHOW_COLLISION_SHAPES } from '../core/config.js';
import { startGameLoop } from '../core/game-loop.js';
import { webImageSource } from '../core/web-images.js';
import { WHELDON_DIALOGUE_LINES } from '../generated/dialogues/wheldon-dialogue.js';
import { DadDialogueController } from '../characters/dad/dad-dialogue-controller.js';
import { createInteriorRenderer } from './interior-render.js';
const searchParams = new URLSearchParams(window.location.search); const SEAL_MODE = searchParams.has('seal'); const doorLoading = requireElement<HTMLElement>('#door-loading');
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
const alexJournalOptions = requireElement<HTMLElement>('#alex-journal-options');
const siblingsDialogueOptions = requireElement<HTMLElement>('#siblings-dialogue-options');
const siblingsViewWebsite = requireElement<HTMLAnchorElement>('#siblings-view-website');
const siblingsDeclineButton = requireElement<HTMLButtonElement>('#siblings-decline');
const musicDialogueOptions = requireElement<HTMLElement>('#music-dialogue-options');
const noelDialogueClose = requireElement<HTMLButtonElement>('#noel-dialogue-close');
const wheldonNoButton = requireElement<HTMLButtonElement>('#wheldon-no');
const wheldonYesButton = requireElement<HTMLButtonElement>('#wheldon-yes');
const possessAlexButton = requireElement<HTMLButtonElement>('#possess-room-alex');
const wheldonHungryAudio = createGameAudio('../character-assets/alex-w/sounds/hungry.m4a');
const FRAME_COUNT = SEAL_MODE ? 8 : 9;
const SPEED = 145;
const enteredDoor = searchParams.get('door');
const scene = getInteriorScene(enteredDoor);
markInteriorVisited();
const isCinemaInterior = scene.kind === 'cinema'; const isMusicShopInterior = scene.kind === 'musicShop';
const isGymInterior = scene.kind === 'gym'; const isBookshopInterior = scene.kind === 'bookshop'; const isPlantRoomInterior = scene.kind === 'plantRoom';
const isCaveInterior = scene.kind === 'cave';
const isDiaryLabInterior = scene.kind === 'diaryLab';
const wheldonPlayer = getPlayerBody() === 'alex-s' || (getPlayerBody() === 'player' && isWheldonPlayerSpriteEnabled());
const ghostWheldonPlayer = getPlayerBody() === 'ghost' && isWheldonPlayerSpriteEnabled();
document.title = scene.title;
canvas.setAttribute('aria-label', scene.ariaLabel);
const WORLD_WIDTH = scene.width;
const WORLD_HEIGHT = scene.height;
const INTERACTION_TARGETS = scene.interactions.filter((interaction) => !(isDiaryLabInterior && wheldonPlayer && interaction.kind === 'wheldon'));
if (isCaveInterior) {
  canvas.width = WORLD_WIDTH;
  canvas.height = WORLD_HEIGHT;
  context.imageSmoothingEnabled = false;
  requireElement<HTMLElement>('.game-shell').classList.add('cave-shell');
}
const interior = new Image(); const collisionMask = new Image();
const doorOverlay = new Image(); const spriteSheet = new Image();
const ghostSpriteSheet = new Image();
ghostSpriteSheet.src = GHOST_SPRITE_SOURCE;
const noelSprite = new Image(); const joshSprite = new Image(); const siblingsSprite = new Image();
const gardenPanda = new Image();
const musicDjMachine = new Image(); const gymGloves = new Image();
const bookshopNpcs = BOOKSHOP_NPCS.map((npc) => ({ ...npc, image: new Image() }));
const diaryRoomNpcs = isDiaryLabInterior ? createDiaryRoomNpcs().filter((npc) => !(wheldonPlayer && npc.id === 'wheldon')) : [];
const musicHouseNpcs = MUSIC_HOUSE_NPCS.filter((npc) => npc.id !== 'tim' || isTimAtMusicShop()).map((npc, index) => ({ ...npc, id: npc.id ?? (index === 0 ? 'andy' : 'aliya'), image: new Image() }));
const gymNpcs = GYM_NPCS.map((npc) => ({ ...npc, image: new Image() }));
const timCinemaSeat = isCinemaInterior && isTimAtCinema() ? new Image() : null;
const cinemaNpcs = isCinemaInterior ? [{ id: 'dad', source: `../${characterAsset('dad', 'avatar')}`, x: 398, y: 462, width: 48, height: 72, image: new Image() }] : [];
interior.src = webImageSource(scene.backgroundSource);
if (SHOW_COLLISION_SHAPES && scene.collisionMaskSource) collisionMask.src = scene.collisionMaskSource;
if (scene.doorOverlaySource) doorOverlay.src = webImageSource(scene.doorOverlaySource);
const playerSpriteSource = ghostWheldonPlayer ? characterAsset('alex-s', 'ghostWheldonSprite') : wheldonPlayer ? characterAsset('alex-s', 'wheldonSprite') : SEAL_MODE ? `${playerAsset('sealSpriteSheet')}?v=20260831-transparent` : playerAsset('spriteSheet');
spriteSheet.src = webImageSource(`../${playerSpriteSource}`);
if (scene.kind === 'artStudio') joshSprite.src = webImageSource(`../${characterAsset('josh', 'avatar')}`);
if (scene.kind === 'mansion') noelSprite.src = webImageSource(`../${characterAsset('noel', 'interiorAvatar')}`);
if (scene.kind === 'plantRoom') gardenPanda.src = webImageSource('../img/internal/art/panda.png');
if (isCaveInterior) siblingsSprite.src = webImageSource(`../${characterAsset('siblings', 'girlsSprite')}`);
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
if (timCinemaSeat) timCinemaSeat.src = '../img/internal/cinema-tim-seat.png';
if (isCinemaInterior) cinemaNpcs.forEach((npc) => { npc.image.src = webImageSource(npc.source); });
const colanderWarningVoices = [
  createGameAudio(`../${characterAsset('siblings', 'maddyAudio')}`),
  createGameAudio(`../${characterAsset('siblings', 'marinaAudio')}`),
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
type NoelDialogueStage = 'opening' | 'question' | 'decline' | 'reward' | 'done';
let noelDialogueStage: NoelDialogueStage = 'done';
let noelRewardQueue: ('item' | 'song')[] = [];
let helenDialogueLineIndex = 0;
type WheldonDialogueStage = 'opening' | 'question' | 'answer' | 'final' | 'done';
let wheldonDialogueStage: WheldonDialogueStage = 'done';
const isCharacterInteraction = (interaction: InteractionKind | null): boolean => interaction === 'noel' || interaction === 'wheldon' || interaction === 'josh' || interaction === 'siblings' || interaction === 'lucy' || interaction === 'andy' || interaction === 'aliya' || interaction === 'julian' || interaction === 'tim' || interaction === 'helen' || interaction === 'dad' || interaction === 'minnie' || interaction === 'buzz' || interaction === 'tigger' || interaction === 'socks';
const OSCAR_INTERIOR_TARGETS = INTERACTION_TARGETS
  .filter((interaction) => isCharacterInteraction(interaction.kind))
  .map((interaction) => ({ id: interaction.kind, x: interaction.x, y: interaction.y, height: 42 }));
const katieSceneryTargets = (isDiaryLabInterior ? diaryRoomNpcs : isGymInterior ? gymNpcs : isBookshopInterior ? bookshopNpcs : isMusicShopInterior ? musicHouseNpcs : isCinemaInterior ? cinemaNpcs : [])
  .flatMap(({ id, x, y, height }) => id ? [{ id, x, y, height }] : []);
const KATIE_INTERIOR_TARGETS = [...katieSceneryTargets, ...OSCAR_INTERIOR_TARGETS.filter((target) => !katieSceneryTargets.some((npc) => npc.id === target.id))]
  .map((target) => ({ ...target, height: target.id === 'noel' ? NOEL.height : target.id === 'wheldon' ? WHELDON.height : target.id === 'josh' ? JOSH.height : target.id === 'siblings' ? CAVE_SIBLINGS.height : target.id === 'lucy' ? 75 : target.height }));
const input = new DirectionInputController({ canHold: () => doorLoading.hidden && !doughnutShop?.eating && !isAlexResurrectionUiBlocking() });
const dadDialogue = new DadDialogueController(
  () => { input.releaseAll(); openNoelDialogue(); },
  () => openFeature('movies'),
);
function openNoelDialogue(characterConversation = true): void {
  announceWorldInteraction();
  input.releaseAll();
  if (characterConversation && !noelDialogueOpen) prependPlayerReaction(noelDialogueLine);
  noelDialogueOpen = true;
}
const joshDialogue = new JoshDialogueController({
  dialogue: noelDialogue,
  speaker: noelSpeaker,
  line: noelDialogueLine,
  profile: noelDialogueProfile,
  progress: noelDialogueProgress,
  next: noelDialogueNext,
  question: noelDialogueQuestion,
  options: noelDialogueOptions,
  artOptions: requireElement<HTMLElement>('#josh-dialogue-options'),
  yes: requireElement<HTMLButtonElement>('#josh-yes'),
  no: requireElement<HTMLButtonElement>('#josh-no'),
  signupOptions: requireElement<HTMLElement>('#josh-signup-options'),
  notNow: requireElement<HTMLButtonElement>('#josh-not-now'),
  codec: requireElement<HTMLElement>('#josh-codec'),
  codecContinue: requireElement<HTMLButtonElement>('#josh-codec-continue'),
}, () => { input.releaseAll(); openNoelDialogue(); }, closeNoelDialogue);
const diaryLabFeatures = new DiaryLabFeatures();
const journalGallery = new JournalGalleryController(closeNoelDialogue);
const goodreadsReading = new GoodreadsReadingController(closeNoelDialogue);
const letterboxdReviews = new LetterboxdReviewsController(closeNoelDialogue);
const lucy = isPlantRoomInterior
  ? new LucyController(noelDialogueLine, noelDialogueNext, noelDialogueProgress, noelGiftConfirmation)
  : null;
const gymNpcDialogue = new GymNpcDialogueController(noelDialogueLine, noelDialogueNext, noelDialogueProgress, noelGiftConfirmation);
const musicHouseDialogue = new MusicHouseDialogueController(noelDialogueLine, noelDialogueNext, noelDialogueProgress, noelGiftConfirmation, closeNoelDialogue);
const NOEL_GAME_URL = 'https://maxbye.co/stealth-game/';
const NOEL_SONG = 'bleep-blops';
let caveColanderHeld = hasCaveColander();
const interiorDoors = new InteriorDoorsController(scene, {
  enteredDoor,
  sealMode: SEAL_MODE,
  hasCaveColander: () => caveColanderHeld,
});
const doughnutShop = scene.kind === 'doughnutShop' && wheldonPlayer
  ? new DoughnutShopController(() => interiorDoors.returnUrl(), () => input.releaseAll())
  : null;
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
    openDialogue: (line, index, total, speaker) => {
      beginDialogueAudio(speaker === 'Tim' ? 'Tim' : undefined, '../'); openNoelDialogue();
      noelSpeaker.textContent = speaker; setProfileImage(noelDialogueProfile, speaker, '../');
      noelDialogueLine.textContent = line;
      if (speaker === 'Tim') {
        const south = document.createElement('mark');
        south.textContent = 'south';
        noelDialogueLine.replaceChildren(line.slice(0, -south.textContent.length), south);
      }
      noelDialogueProgress.textContent = `${index + 1}/${total}`;
      noelDialogueProgress.hidden = speaker === 'Tim';
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
function showWheldonQuestion(): void {
  wheldonDialogueStage = 'question';
  noelDialogueLine.textContent = '';
  noelDialogueProgress.hidden = true;
  noelDialogueNext.hidden = true;
  const eatenDoughnut = hasAlexEatenDoughnut();
  noelDialogueQuestion.textContent = eatenDoughnut ? WHELDON_DIALOGUE_LINES[1] : 'Will you help me find a doughnut?';
  wheldonYesButton.textContent = 'Yes';
  wheldonNoButton.textContent = 'No';
  possessAlexButton.hidden = getPlayerBody() !== 'ghost';
  noelDialogueQuestion.hidden = false;
  noelDialogueOptions.hidden = false;
}
function showWheldonAnswer(wantsToRead: boolean): void {
  wheldonDialogueStage = 'answer';
  if (hasAlexEatenDoughnut() && wantsToRead) { openAlexJournal(); return; }
  noelDialogueLine.textContent = hasAlexEatenDoughnut() ? WHELDON_DIALOGUE_LINES[3] : wantsToRead ? 'Yes please! I just want a delicious doughnut.' : WHELDON_DIALOGUE_LINES[4];
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
  if (nearbyInteraction !== 'noel' || noelDialogueOpen) return;
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
  if (!noelDialogueOpen || nearbyInteraction !== 'noel' || noelDialogueStage !== 'question') return;
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
function closeNoelDialogue(): void {
  endDialogueAudio(); caveSiblings?.closeDialogue();
  joshDialogue.stop();
  noelDialogueOpen = false;
  noelDialogueStage = 'done';
  noelRewardQueue = [];
  wheldonDialogueStage = 'done';
  noelDialogue.hidden = true;
  noelDialogueNext.hidden = true;
  noelDialogueProgress.hidden = true;
  noelGiftConfirmation.hidden = true;
  noelDialogueOptions.hidden = true;
  noelGameOptions.hidden = true;
  noelDialogueQuestion.hidden = true;
  alexJournalOptions.hidden = true;
  siblingsDialogueOptions.hidden = true;
  musicDialogueOptions.hidden = true;
  helenReadingOptions.hidden = true;
  dadDialogue.hide();
  diaryLabFeatures.hide();
  journalGallery.hide();
  goodreadsReading.hide();
  letterboxdReviews.hide();
  lucy?.stop();
  gymNpcDialogue.stop();
  musicHouseDialogue.stop();
  colanderWarningVoices.forEach((voice) => {
    voice.pause();
    voice.currentTime = 0;
  });
  interactionPrompt.hidden = nearbyInteraction === null || isCharacterInteraction(nearbyInteraction);
}
function startAlexJournalOffer(): void {
  if (getPlayerBody() !== 'player' || !isWheldonPlayerSpriteEnabled() || !hasAlexEatenDoughnut()) return;
  openNoelDialogue();
  noelSpeaker.textContent = 'Alex';
  noelDialogueProfile.hidden = true;
  noelDialogueLine.textContent = 'hey I guess I could read that journal now if you want';
  noelDialogueProgress.hidden = true;
  noelDialogueNext.hidden = true;
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  noelGiftConfirmation.hidden = true;
  alexJournalOptions.hidden = false;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
  requireElement<HTMLButtonElement>('#alex-journal-yes').focus();
}
function openAlexJournal(): void {
  alexJournalOptions.hidden = true;
  noelDialogue.hidden = true;
  journalGallery.open();
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
function startWheldonDialogue(): void {
  if (nearbyInteraction !== 'wheldon' || noelDialogueOpen) return;
  openNoelDialogue(); beginDialogueAudio('Alex W', '../');
  wheldonHungryAudio.currentTime = 0;
  if (!hasAlexEatenDoughnut()) window.dispatchEvent(new CustomEvent('max-game:temporary-audio-focus', { detail: true }));
  const resumeAmbience = (): void => { window.dispatchEvent(new CustomEvent('max-game:temporary-audio-focus', { detail: false })); };
  wheldonHungryAudio.addEventListener('ended', resumeAmbience, { once: true });
  if (!hasAlexEatenDoughnut()) void wheldonHungryAudio.play().catch(() => {
    // The browser may block playback until the player has interacted with the page.
    wheldonHungryAudio.removeEventListener('ended', resumeAmbience);
    resumeAmbience();
  });
  wheldonDialogueStage = 'opening';
  noelSpeaker.textContent = 'Alex'; setProfileImage(noelDialogueProfile, 'Alex W', '../');
  noelDialogueLine.textContent = hasAlexEatenDoughnut() ? 'That doughnut hit the spot!' : WHELDON_DIALOGUE_LINES[0];
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  noelDialogueProgress.hidden = true;
  noelDialogueNext.hidden = false;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
}
const CAT_DIALOGUE: Readonly<Record<'minnie' | 'buzz' | 'tigger' | 'socks', { name: string; line: string }>> = {
  minnie: { name: 'Minnie', line: 'Meow meow. I kill everything and I\'m a total diva' },
  buzz: { name: 'Buzz', line: 'Woof. I mean... Meow.' },
  tigger: { name: 'Tigger', line: 'Meow meow stomach scratch now meow' },
  socks: { name: 'Socks', line: 'Food now. Feed me. Meow. Seriously food.' },
};
function startCatDialogue(kind: 'minnie' | 'buzz' | 'tigger' | 'socks'): void {
  if (nearbyInteraction !== kind || noelDialogueOpen) return;
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
function startJoshDialogue(): void {
  if (nearbyInteraction !== 'josh' || noelDialogueOpen) return;
  joshDialogue.start();
  interactionPrompt.hidden = true;
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
function openFeature(kind: 'diary' | 'experiments' | 'reading' | 'movies'): void {
  input.releaseAll(); endDialogueAudio();
  openNoelDialogue(false);
  [interactionPrompt, noelDialogueNext, noelDialogue, helenReadingOptions].forEach((element) => { element.hidden = true; });
  if (kind === 'reading') goodreadsReading.open();
  else if (kind === 'movies') letterboxdReviews.open();
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
  else if (nearbyInteraction === 'wheldon') startWheldonDialogue();
  else if (nearbyInteraction === 'josh') startJoshDialogue();
  else if (nearbyInteraction === 'siblings') startSiblingsDialogue(performance.now());
  else if (nearbyInteraction === 'diary' || nearbyInteraction === 'experiments') startFeatureInteraction(nearbyInteraction);
  else if (nearbyInteraction === 'colander') startColanderPickup();
  else if (nearbyInteraction === 'andy' || nearbyInteraction === 'aliya') startMusicHouseDialogue(nearbyInteraction);
  else if (nearbyInteraction === 'lucy') startLucyDialogue();
  else if (nearbyInteraction === 'helen') startHelenDialogue();
  else if (nearbyInteraction === 'julian' || nearbyInteraction === 'tim') startGymNpcDialogue(nearbyInteraction);
  else if (nearbyInteraction === 'minnie' || nearbyInteraction === 'buzz' || nearbyInteraction === 'tigger' || nearbyInteraction === 'socks') startCatDialogue(nearbyInteraction);
}
function bindControls(): void {
  window.addEventListener('keydown', (event) => {
    if (journalGallery.isOpen()) return;
    if (goodreadsReading.isOpen()) return;
    if (letterboxdReviews.isOpen()) return;
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
    else if (nearbyInteraction === 'wheldon') {
      if (wheldonDialogueStage === 'opening') showWheldonQuestion();
      else if (wheldonDialogueStage === 'answer') showWheldonFinalLine();
    }
    else if (nearbyInteraction === 'josh') joshDialogue.next();
  });
  noelDialogueClose.addEventListener('click', closeNoelDialogue);
  requireElement<HTMLButtonElement>('#helen-reading-yes').addEventListener('click', () => openFeature('reading'));
  requireElement<HTMLButtonElement>('#helen-reading-no').addEventListener('click', closeNoelDialogue);
  possessAlexButton.addEventListener('click', () => {
    if (getPlayerBody() !== 'ghost' || nearbyInteraction !== 'wheldon' || wheldonDialogueStage !== 'question') return;
    setPlayerBody('player');
    setWheldonPlayerSpriteEnabled(true);
    const possessedUrl = new URL(window.location.href);
    possessedUrl.searchParams.set('body', 'player');
    possessedUrl.searchParams.set('wheldon', '1');
    window.history.replaceState(null, '', possessedUrl);
    interiorDoors.syncExitLink(document.querySelector<HTMLAnchorElement>('.interior-exit'));
    closeNoelDialogue();
    nearbyInteraction = null;
    for (const targets of [INTERACTION_TARGETS, OSCAR_INTERIOR_TARGETS, KATIE_INTERIOR_TARGETS]) {
      const index = targets.findIndex((target) => ('kind' in target ? target.kind : target.id) === 'wheldon');
      if (index !== -1) targets.splice(index, 1);
    }
    const npcIndex = diaryRoomNpcs.findIndex((npc) => npc.id === 'wheldon');
    if (npcIndex !== -1) diaryRoomNpcs.splice(npcIndex, 1);
    Object.assign(player, { x: WHELDON.x, y: WHELDON.y, direction: 'down', frame: 0, animationTime: 0 });
    spriteSheet.src = webImageSource(`../${characterAsset('alex-s', 'wheldonSprite')}`);
    startAlexJournalOffer();
  });
  wheldonYesButton.addEventListener('click', () => showWheldonAnswer(true));
  wheldonNoButton.addEventListener('click', () => showWheldonAnswer(false));
  requireElement<HTMLButtonElement>('#noel-game-yes').addEventListener('click', () => chooseNoelGame(true));
  requireElement<HTMLButtonElement>('#noel-game-no').addEventListener('click', () => chooseNoelGame(false));
  requireElement<HTMLButtonElement>('#alex-journal-yes').addEventListener('click', openAlexJournal);
  requireElement<HTMLButtonElement>('#alex-journal-no').addEventListener('click', closeNoelDialogue);
  joshDialogue.bind();
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
  setupLucyPowerInput(canvas);
}
function updatePlayer(deltaTime: number): void {
  if (journalGallery.isOpen() || !alexJournalOptions.hidden) { input.releaseAll(); return; }
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
  const movementSpeed = SPEED * niallSpeedMultiplier() * adamAirStrideMultiplier() * aliceMovementMultiplier() * oscarMovementMultiplier() * andyMovementMultiplier() * bochraMovementMultiplier() * chrisMovementMultiplier() * helenMovementMultiplier() * juMovementMultiplier() * julianMovementMultiplier() * lucyMovementMultiplier() * mikeMovementMultiplier() * noelMovementMultiplier() * reiMovementMultiplier() * samMovementMultiplier();
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
    (x, y) => getPlayerBody() === 'ghost'
      ? x < 0 || y < 0 || x > WORLD_WIDTH || y > WORLD_HEIGHT
      : collision.playerIsBlocked(x, y) && !isOscarTerrainEaten(x, y),
  );
  if (dx < 0 && dy < 0) player.direction = 'upLeft';
  else if (dx > 0 && dy < 0) player.direction = 'upRight';
  else if (dx < 0 && dy > 0) player.direction = 'downLeft';
  else if (dx > 0 && dy > 0) player.direction = 'downRight';
  else if (dx < 0) player.direction = 'left';
  else if (dx > 0) player.direction = 'right';
  else if (dy < 0) player.direction = 'up';
  else player.direction = 'down';
  player.animationTime += deltaTime * aliceMovementMultiplier() * helenMovementMultiplier() * juMovementMultiplier() * julianMovementMultiplier() * lucyMovementMultiplier() * mikeMovementMultiplier() * noelMovementMultiplier() * reiMovementMultiplier() * samMovementMultiplier();
  player.frame = Math.floor(player.animationTime * 11) % FRAME_COUNT;
}
function updateNearbyInteraction(): void {
  if (isCinemaInterior) {
    const previousInteraction = nearbyInteraction;
    const target = INTERACTION_TARGETS
      .map((interaction) => ({ ...interaction, playerDistance: Math.hypot(player.x - interaction.x, player.y - interaction.y) }))
      .filter((interaction) => interaction.playerDistance <= interaction.distance)
      .sort((first, second) => first.playerDistance - second.playerDistance)[0];
    nearbyInteraction = target?.kind ?? null;
    if (nearbyInteraction === 'dad' && previousInteraction !== 'dad') startDadDialogue();
    if (target) interactionPrompt.textContent = target.label;
    interactionPrompt.hidden = true;
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
  if (nextInteraction === 'wheldon') {
    startWheldonDialogue();
    return;
  }
  if (nextInteraction === 'noel') {
    startNoelDialogue();
    return;
  }
  if (nextInteraction === 'josh') {
    startJoshDialogue();
    return;
  }
  if (nextInteraction === 'minnie' || nextInteraction === 'buzz' || nextInteraction === 'tigger' || nextInteraction === 'socks') {
    startCatDialogue(nextInteraction);
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
  scene, player, sealMode: SEAL_MODE, collision, interior, collisionMask, doorOverlay, spriteSheet, ghostSpriteSheet, noelSprite, gardenPanda,
  diaryRoomNpcs, joshSprite, siblingsSprite, musicDjMachine, gymGloves, bookshopNpcs, musicHouseNpcs, gymNpcs, cinemaNpcs, timCinemaSeat,
  caveSiblings, lucy, interiorDoors, getCaveColanderHeld: () => caveColanderHeld,
});
let worldAnimationTime = 0;
function gameLoop(time: number): void {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  const worldDeltaTime = aliceWorldDeltaTime(reiWorldDeltaTime(mikeWorldDeltaTime(katieWorldDeltaTime(julianWorldDeltaTime(juWorldDeltaTime(helenWorldDeltaTime(danWorldDeltaTime(chrisWorldDeltaTime(andyWorldDeltaTime(maddyWorldDeltaTime(deltaTime, time), time), time), time), time), time), time), time), time), time), time);
  worldAnimationTime = worldAnimationTime === 0 ? time : worldAnimationTime + worldDeltaTime * 1000;
  previousTime = time;
  if (doughnutShop?.eating) return;
  updatePowerups(time);
  if (isThoughtsOpen()) { draw(time, worldAnimationTime); return; }
  if (!isKatiePowerActive(time)) settleGeorgiaFlight(player, flightLandingBlocked, FLIGHT_BOUNDS, time);
  let visibleKatieTargets = KATIE_INTERIOR_TARGETS.filter((target) => !isOscarEaten(target.id));
  let visibleOscarTargets = OSCAR_INTERIOR_TARGETS.filter((target) => !isOscarEaten(target.id));
  updateAliceWorld(time, player.x, player.y, visibleKatieTargets);
  updateReiWorld(time, player.x, player.y, visibleKatieTargets);
  updateNoelWorld(time, player.x, player.y, visibleKatieTargets);
  updateMikeWorld(time, player.x, player.y, visibleKatieTargets);
  updateLucyWorld(time, player.x, player.y, visibleKatieTargets, getPlayerSpriteFrame(SEAL_MODE, player.direction, player.frame, 2).height);
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
  doughnutShop?.update(player.x, player.y);
  if (doughnutShop?.eating) return;
  updateSamPower(time, player.x, player.y, visibleKatieTargets, player.direction);
  updateTimInputWorld(time, player.x, player.y);
  updateBochraWorld(time, player.x, player.y, OSCAR_INTERIOR_TARGETS);
  updateChrisWorld(time, player.x, player.y, visibleOscarTargets);
  updateDanWorld(time, player.x, player.y, visibleOscarTargets);
  updateGeorgiaWorld(time, player.x, player.y, visibleOscarTargets);
  if (!isAlicePowerActive(time) && !isChrisPowerActive(time) && !isDanPowerActive(time) && !isGeorgiaPowerActive(time) && !isHelenPowerActive(time) && !isJoePowerActive(time) && !isJuPowerActive(time) && !isJulianPowerActive(time) && !isKatiePowerActive(time) && !isLucyPowerActive(time) && !isMikePowerActive(time) && !isNoelPowerActive(time) && !isOscarPowerActive(time) && !isReiPowerActive(time) && !isSamPowerActive(time) && !isTimInputPowerActive(time)) updateNearbyInteraction();
  if (!isAlicePowerActive(time) && !isGeorgiaPowerActive(time) && !isJulianPowerActive(time) && !isKatiePowerActive(time) && !isLucyPowerActive(time) && !isMikePowerActive(time) && !isNoelPowerActive(time) && !isOscarPowerActive(time) && !isReiPowerActive(time) && !isSamPowerActive(time) && !isTimInputPowerActive(time)) interiorDoors.update(player.x, player.y);
  draw(time, worldAnimationTime);
}
interiorDoors.syncExitLink(document.querySelector<HTMLAnchorElement>('.interior-exit'));
bindControls(); setupAudioMute(); setupInteriorAmbience(enteredDoor);
setupInventory();
bindPowerDialogueDismissal(closeNoelDialogue);
window.addEventListener('max-game:alex-s-dialogue', () => { input.releaseAll(); closeNoelDialogue(); });
document.querySelector('.interior-exit')?.addEventListener('click', (event) => { if (isAlicePowerActive() || isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive() || isTimInputPowerActive()) event.preventDefault(); });
setupJump();
const requiredImages = [
  interior,
  spriteSheet,
  ghostSpriteSheet,
  ...(SHOW_COLLISION_SHAPES && scene.collisionMaskSource ? [collisionMask] : []),
  ...(scene.doorOverlaySource ? [doorOverlay] : []),
  ...diaryRoomNpcs.flatMap((npc) => npc.frames?.map((frame) => frame.image) ?? [npc.image]),
  ...(scene.kind === 'artStudio' ? [joshSprite] : []),
  ...(scene.kind === 'mansion' ? [noelSprite] : []),
  ...(lucy ? [lucy.sprite] : []),
  ...(isBookshopInterior ? bookshopNpcs.map((npc) => npc.image) : []),
  ...(isCaveInterior ? [siblingsSprite] : []),
  ...(isMusicShopInterior ? [...musicHouseNpcs.map((npc) => npc.image), musicDjMachine] : []),
  ...(isGymInterior ? [gymGloves, ...gymNpcs.map((npc) => npc.image)] : []),
  ...cinemaNpcs.map((npc) => npc.image),
  ...(timCinemaSeat ? [timCinemaSeat] : []),
];
Promise.all(requiredImages.map((image) => image.decode()))
  .then(() => {
    input.releaseAll();
    doorLoading.hidden = true;
    context.imageSmoothingEnabled = false;
    startGameLoop(gameLoop, () => { previousTime = 0; });
    doughnutShop?.enter();
    if (isDiaryLabInterior) startAlexJournalOffer();
  })
  .catch((error: unknown) => {
    console.error(error);
    doorLoading.hidden = true;
    context.fillStyle = '#f5fff6';
    context.font = '13px monospace';
    context.fillText('Could not load the interior.', 120, 240); });
