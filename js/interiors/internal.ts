import { hasCaveTransformation, completeCaveTransformation, isSealPlayer, resetCaveTransformationForCurrentForm, SEAL_SIBLING_LINES } from '../core/cave-transformation.js';
import { isSiblingPursuitActive } from '../core/sibling-pursuit.js';
import { InteriorSiblingChase, INTERIOR_CHASE_MESSAGE } from './interior-sibling-chase.js';
import { playMessageVoices, startCatchTransition } from '../overworld/cave-thief-cutscene.js';
import { createInteriorAssets } from './interior-assets.js';
import { loadInteriorImage } from './interior-image-loading.js';
import { createInteriorPlayerUpdater } from './interior-player.js';
import { createRoomCharacterDialogue, type RoomCharacterKind } from './room-character-dialogue.js';
import { isAlexPlayer } from '../core/player-character.js';
import { getTimCinemaDialogue } from '../characters/tim/tim-cinema-dialogue.js';
import { getPlayerSpriteFrame } from '../core/player-sprite.js';
import { setupLucyPowerInput } from '../powers/lucy/lucy-power-input.js';
import { isTimInputPowerActive, updateTimInputWorld } from '../powers/tim/tim-input-power.js';
import { hasAlexEatenDoughnut } from '../core/alex-w-state.js';
import { getPlayerBody, setPlayerBody } from '../core/player-body.js';
import { isWheldonPlayerSpriteEnabled, setWheldonPlayerSpriteEnabled } from '../core/player-sprite-test.js';
import { isSamPowerActive, updateSamPower } from '../powers/sam/sam-power.js';
import { isReiPowerActive, reiWorldDeltaTime, updateReiWorld } from '../powers/rei/rei-power.js';
import { isNoelPowerActive, updateNoelWorld } from '../powers/noel/noel-power.js';
import { aliceWorldDeltaTime, isAlicePowerActive, updateAliceWorld } from '../powers/alice/alice-power.js';
import { isMikePowerActive, mikeWorldDeltaTime, updateMikeWorld } from '../powers/mike/mike-power.js';
import { isLucyPowerActive, updateLucyWorld } from '../powers/lucy/lucy-power.js';
import { isKatiePowerActive, katieWorldDeltaTime, updateKatieWorld } from '../powers/katie/katie-power.js';
import { isJulianPowerActive, julianWorldDeltaTime, updateJulianWorld } from '../powers/julian/julian-power.js';
import { isJuPowerActive, juWorldDeltaTime, updateJuWorld } from '../powers/ju/ju-power.js';
import { isJoePowerActive, updateJoeWorld } from '../powers/joe/joe-power.js';
import { helenWorldDeltaTime, isHelenPowerActive, updateHelenWorld } from '../powers/helen/helen-power.js';
import { isGeorgiaPowerActive, settleGeorgiaFlight, updateGeorgiaWorld } from '../powers/georgia/georgia-power.js';
import { danWorldDeltaTime, isDanPowerActive, updateDanWorld } from '../powers/dan/dan-power.js';
import { chrisWorldDeltaTime, isChrisPowerActive, updateChrisWorld } from '../powers/chris/chris-power.js';
import { updateBochraWorld } from '../powers/bochra/bochra-power.js';
import { hasCaveColander } from '../core/colander.js';
import { isAlexResurrectionUiBlocking } from '../powers/alex-s/alex-s-power-ui.js';
import { announceWorldInteraction } from '../core/world-interactions.js';
import { createGameAudio, setupAudioMute } from '../core/audio-mute.js';
import { setupDialoguePanel } from '../core/dialogue-layout.js';
import { CAVE_SIBLINGS, CaveSiblingsController } from './cave-siblings.js';
import { CinemaAudienceController } from './cinema-audience.js';
import { DiaryLabFeatures } from './diary-lab-features.js';
import { JournalGalleryController } from './journal-gallery.js';
import { DoughnutShopController } from './doughnut-shop.js';
import { canvas, context, requireElement } from '../core/dom.js';
import { GymNpcDialogueController } from './gym-npc-dialogue.js';
import { GoodreadsReadingController } from './goodreads-reading.js';
import { LetterboxdReviewsController } from './letterboxd-reviews.js';
import { DirectionInputController } from '../core/input.js';
import { isThoughtsOpen } from '../core/thoughts.js';
import { InteriorCollision } from './interior-collision.js';
import { InteriorDoorsController } from './interior-doors.js';
import { setupInventory, updatePowerups } from '../core/inventory.js';
import { maddyWorldDeltaTime } from '../powers/maddy/maddy-tea-power.js';
import { isEdTattooOpen } from '../powers/ed/tattoo-ui.js';
import { isKirinMovieOpen } from '../powers/kirin/kirin-movie.js';
import { isOscarEaten, isOscarPowerActive, updateOscarPower } from '../powers/oscar/oscar-power.js';
import { andyWorldDeltaTime } from '../powers/andy/andy-power.js';
import { updateAndyWorld } from '../powers/andy/andy-world-power.js';
import { characterAsset } from '../core/character-assets.js';
import { isJumpMenuOpen, setupJump } from '../core/jump.js';
import { LucyController } from '../characters/lucy/lucy.js';
import { setupInteriorAmbience } from './plant-room-ambience.js';
import { MusicHouseDialogueController } from './music-house-dialogue.js';
import { markInteriorVisited } from '../core/world-state.js';
import { JOSH, NOEL, WHELDON, getInteriorScene, type InteractionKind } from './interior-scenes.js';
import { JoshDialogueController } from './josh-dialogue.js';
import type { Direction } from '../core/types.js';
import { setProfileImage, setSiblingProfileImage } from '../core/profile-images.js';
import { beginDialogueAudio, endDialogueAudio, bindPowerDialogueDismissal } from '../core/dialogue-audio.js';
import { prependPlayerReaction } from '../core/player-dialogue.js';
import { startGameLoop } from '../core/game-loop.js';
import { webImageSource } from '../core/web-images.js';
import { DadDialogueController } from '../characters/dad/dad-dialogue-controller.js';
import { createInteriorRenderer } from './interior-render.js';
import { CharityDialogueController, isCharityNpc } from './charity-dialogue.js';
resetCaveTransformationForCurrentForm();
const searchParams = new URLSearchParams(window.location.search); const SEAL_MODE = isSealPlayer(); const doorLoading = requireElement<HTMLElement>('#door-loading');
const interactionPrompt = requireElement<HTMLButtonElement>('#interaction-prompt');
const noelDialogue = requireElement<HTMLElement>('#noel-dialogue');
const noelSpeaker = requireElement<HTMLElement>('#noel-speaker');
const noelDialogueLine = requireElement<HTMLElement>('#noel-dialogue-line');
const noelDialogueProfile = requireElement<HTMLImageElement>('#noel-dialogue-profile');
const noelDialogueSecondProfile = requireElement<HTMLImageElement>('#noel-dialogue-second-profile');
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

const possessAlexButton = requireElement<HTMLButtonElement>('#possess-room-alex');

const FRAME_COUNT = SEAL_MODE ? 8 : 9;

const enteredDoor = searchParams.get('door');
const scene = getInteriorScene(enteredDoor);
markInteriorVisited();
const isCinemaInterior = scene.kind === 'cinema'; const isMusicShopInterior = scene.kind === 'musicShop';
const isGymInterior = scene.kind === 'gym'; const isBookshopInterior = scene.kind === 'bookshop'; const isPlantRoomInterior = scene.kind === 'plantRoom';
const isCaveInterior = scene.kind === 'cave';
if (isSealPlayer() && searchParams.get('transformed') === '1') completeCaveTransformation();
const isTransformedCave = isCaveInterior && hasCaveTransformation();
let sealSiblingLineIndex = 0;
const isDiaryLabInterior = scene.kind === 'diaryLab';
const wheldonPlayer = getPlayerBody() === 'alex-s' || (getPlayerBody() === 'player' && isWheldonPlayerSpriteEnabled());
const ghostWheldonPlayer = getPlayerBody() === 'ghost' && isWheldonPlayerSpriteEnabled();
document.title = scene.title;
canvas.setAttribute('aria-label', scene.ariaLabel);
const WORLD_WIDTH = scene.width;
const WORLD_HEIGHT = scene.height;
const INTERACTION_TARGETS = scene.interactions.map(interaction => isTransformedCave && interaction.kind === 'siblings' ? { ...interaction, y: 160 } : interaction).filter((interaction) => !(isDiaryLabInterior && wheldonPlayer && interaction.kind === 'wheldon'));
if (isCaveInterior) {
  canvas.width = WORLD_WIDTH;
  canvas.height = WORLD_HEIGHT;
  context.imageSmoothingEnabled = false;
  requireElement<HTMLElement>('.game-shell').classList.add('cave-shell');
}
const assets = createInteriorAssets(scene, SEAL_MODE, wheldonPlayer, ghostWheldonPlayer);
const { diaryRoomNpcs, bookshopNpcs, musicHouseNpcs, gymNpcs, cinemaNpcs, spriteSheet } = assets;
const colanderWarningVoices = [
  createGameAudio(`../${characterAsset('siblings', 'maddyAudio')}`),
  createGameAudio(`../${characterAsset('siblings', 'marinaAudio')}`),
];
colanderWarningVoices.forEach((voice) => {
  voice.preload = 'none';
});
const player = {
  x: isTransformedCave && searchParams.has('awakened') ? 374 : scene.playerStart.x,
  y: scene.playerStart.y,
  direction: 'up' as Direction,
  frame: 0,
  animationTime: 0,
};
let previousTime = 0;
let nearbyInteraction: InteractionKind | null = null;
let noelDialogueOpen = false;

const isCharacterInteraction = (interaction: InteractionKind | null): boolean => interaction === 'noel' || interaction === 'wheldon' || interaction === 'josh' || interaction === 'siblings' || interaction === 'lucy' || interaction === 'andy' || interaction === 'aliya' || interaction === 'julian' || interaction === 'tim' || interaction === 'kirin' || interaction === 'helen' || interaction === 'dad' || interaction === 'minnie' || interaction === 'buzz' || interaction === 'tigger' || interaction === 'socks';
const OSCAR_INTERIOR_TARGETS = INTERACTION_TARGETS
  .filter((interaction) => isCharacterInteraction(interaction.kind))
  .map((interaction) => ({ id: interaction.kind, x: interaction.x, y: interaction.y, height: 42 }));
const katieSceneryTargets = (isDiaryLabInterior ? diaryRoomNpcs : isGymInterior ? gymNpcs : isBookshopInterior ? bookshopNpcs : isMusicShopInterior ? musicHouseNpcs : isCinemaInterior ? cinemaNpcs : [])
  .flatMap(({ id, x, y, height }) => id ? [{ id, x, y, height }] : []);
const KATIE_INTERIOR_TARGETS = [...katieSceneryTargets, ...OSCAR_INTERIOR_TARGETS.filter((target) => !katieSceneryTargets.some((npc) => npc.id === target.id))]
  .map((target) => ({ ...target, height: target.id === 'noel' ? NOEL.height : target.id === 'wheldon' ? WHELDON.height : target.id === 'josh' ? JOSH.height : target.id === 'siblings' ? CAVE_SIBLINGS.height : target.id === 'lucy' ? 75 : target.height }));
const input = new DirectionInputController({ canHold: () => doorLoading.hidden && !doughnutShop?.eating && !isAlexResurrectionUiBlocking() });
const charityDialogue = new CharityDialogueController({
  dialogue: noelDialogue, speaker: noelSpeaker, line: noelDialogueLine,
  profile: noelDialogueProfile, progress: noelDialogueProgress, next: noelDialogueNext,
}, () => { openNoelDialogue(false); interactionPrompt.hidden = true; }, closeNoelDialogue);
const dadDialogue = new DadDialogueController(
  () => { input.releaseAll(); openNoelDialogue(); },
  () => openFeature('movies'),
);
function openNoelDialogue(characterConversation = true): void {
  noelDialogueSecondProfile.hidden = true;
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
let caveColanderHeld = hasCaveColander();
const interiorDoors = new InteriorDoorsController(scene, {
  enteredDoor,
  sealMode: SEAL_MODE,
  hasCaveColander: () => caveColanderHeld && !isTransformedCave,
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
const caveSiblings = isCaveInterior && !isTransformedCave && !isSiblingPursuitActive()
  ? new CaveSiblingsController({
    showLine: ({ speaker, line }, index, total) => {
      noelSpeaker.textContent = speaker; setSiblingProfileImage(noelDialogueProfile, speaker, '../');
      noelDialogueSecondProfile.hidden = true;
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
        south.textContent = getTimCinemaDialogue()?.highlight ?? 'south';
        south.className = 'dialogue-highlight';
        const start = line.indexOf(south.textContent);
        noelDialogueLine.replaceChildren(line.slice(0, start), south, line.slice(start + south.textContent.length));
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

const roomDialogue = createRoomCharacterDialogue({ open: openNoelDialogue, close: closeNoelDialogue, isActive: kind => nearbyInteraction === kind && noelDialogueOpen });
function startRoomCharacterDialogue(kind: RoomCharacterKind): void {
  if (nearbyInteraction === kind && !noelDialogueOpen) roomDialogue.start(kind);
}
function closeNoelDialogue(): void {
  charityDialogue.stop();
  endDialogueAudio(); caveSiblings?.closeDialogue();
  joshDialogue.stop();
  noelDialogueOpen = false;
  roomDialogue.stop();
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
  if (!isAlexPlayer() || !hasAlexEatenDoughnut()) return;
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
  if (!isAlexPlayer() || !hasAlexEatenDoughnut()) return;
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
function showSealSiblingLine(): void {
  const current = SEAL_SIBLING_LINES[sealSiblingLineIndex];
  if (!current) return;
  noelSpeaker.textContent = current.speaker;
  setSiblingProfileImage(noelDialogueProfile, current.speaker, '../');
  noelDialogueLine.textContent = current.text;
  showSiblingsDialogue();
  noelDialogueNext.hidden = false;
  colanderWarningVoices.forEach(voice => { voice.pause(); voice.currentTime = 0; });
  void colanderWarningVoices[current.speaker === 'Maddy' ? 0 : 1]?.play().catch(() => {});
}
function startSiblingsDialogue(time: number): void {
  if (isTransformedCave) {
    if (noelDialogueOpen) return;
    sealSiblingLineIndex = 0;
    openNoelDialogue();
    showSealSiblingLine();
    return;
  }
  if (
    nearbyInteraction !== 'siblings' ||
    noelDialogueOpen ||
    !caveSiblings?.startWelcome(time)
  ) return;
  openNoelDialogue(); beginDialogueAudio(undefined, '../');
  showSiblingsDialogue();
}
function startSiblingsWebsiteReturnDialogue(): void {
  if (!caveSiblings?.canResumeAfterWebsite) return;
  if (noelDialogueOpen) closeNoelDialogue();
  caveSiblings.resumeAfterWebsite(performance.now());
  openNoelDialogue(); beginDialogueAudio(undefined, '../');
  showSiblingsDialogue();
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

const helenReadingOptions = requireElement<HTMLElement>('#helen-reading-options');

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
  if (!isCaveInterior || isTransformedCave || noelDialogueOpen || caveColanderHeld) return;
  input.releaseAll();
  // Stop any in-progress Maddy/Marina line before this hardcoded prompt
  // takes over the shared dialogue UI, so voices never overlap it.
  caveSiblings?.closeDialogue();
  caveColanderHeld = true;
  interiorDoors.syncExitLink(document.querySelector<HTMLAnchorElement>('.interior-exit'));
  nearbyInteraction = null;
  openNoelDialogue(); beginDialogueAudio(undefined, '../');
  noelSpeaker.textContent = 'THE GIRLS'; setSiblingProfileImage(noelDialogueProfile, 'Maddy', '../');
  setSiblingProfileImage(noelDialogueSecondProfile, 'Marina', '../');
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
function startGymNpcDialogue(kind: 'julian' | 'tim' | 'kirin'): void {
  if (nearbyInteraction !== kind || noelDialogueOpen) return; input.releaseAll(); openNoelDialogue();
  const npc = gymNpcDialogue.start(kind, isCinemaInterior); beginDialogueAudio(npc.name, '../'); noelSpeaker.textContent = npc.name; noelDialogueProfile.src = npc.profileSource ?? ''; noelDialogueProfile.alt = npc.profileSource ? `${npc.name} profile` : ''; noelDialogueProfile.hidden = !npc.profileSource;
  noelDialogueQuestion.hidden = true; noelDialogueOptions.hidden = true; siblingsDialogueOptions.hidden = true; musicDialogueOptions.hidden = true; noelDialogue.hidden = false; interactionPrompt.hidden = true;
}
function startDadDialogue(): void {
  if (nearbyInteraction !== 'dad' || noelDialogueOpen) return;
  dadDialogue.start(); interactionPrompt.hidden = true;
}
function activateNearbyInteraction(): void {
  if (isCharityNpc(nearbyInteraction)) { if (!noelDialogueOpen) charityDialogue.start(nearbyInteraction); return; }
  if (nearbyInteraction === 'noel') startRoomCharacterDialogue('noel');
  else if (nearbyInteraction === 'wheldon') startRoomCharacterDialogue('wheldon');
  else if (nearbyInteraction === 'josh') startJoshDialogue();
  else if (nearbyInteraction === 'siblings') startSiblingsDialogue(performance.now());
  else if (nearbyInteraction === 'diary' || nearbyInteraction === 'experiments') startFeatureInteraction(nearbyInteraction);
  else if (nearbyInteraction === 'andy' || nearbyInteraction === 'aliya') startMusicHouseDialogue(nearbyInteraction);
  else if (nearbyInteraction === 'lucy') startLucyDialogue();
  else if (nearbyInteraction === 'helen') startRoomCharacterDialogue('helen');
  else if (nearbyInteraction === 'julian' || nearbyInteraction === 'tim' || nearbyInteraction === 'kirin') startGymNpcDialogue(nearbyInteraction);
  else if (nearbyInteraction === 'minnie' || nearbyInteraction === 'buzz' || nearbyInteraction === 'tigger' || nearbyInteraction === 'socks') startRoomCharacterDialogue(nearbyInteraction);
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
    if (isTransformedCave && nearbyInteraction === 'siblings') {
      if (++sealSiblingLineIndex < SEAL_SIBLING_LINES.length) showSealSiblingLine();
      else closeNoelDialogue();
      return;
    }
    if (isCharityNpc(nearbyInteraction)) { charityDialogue.next(); return; }
    if (nearbyInteraction === 'lucy') lucy?.next();
    else if (nearbyInteraction === 'helen') roomDialogue.next('helen');
    else if (nearbyInteraction === 'andy' || nearbyInteraction === 'aliya') musicHouseDialogue.next();
    else if (nearbyInteraction === 'julian' || nearbyInteraction === 'tim' || nearbyInteraction === 'kirin') gymNpcDialogue.next();
    else if (nearbyInteraction === 'dad') dadDialogue.next();
    else if (nearbyInteraction === 'noel') roomDialogue.next('noel');
    else if (nearbyInteraction === 'wheldon') roomDialogue.next('wheldon');
    else if (nearbyInteraction === 'josh') joshDialogue.next();
  });
  noelDialogueClose.addEventListener('click', closeNoelDialogue);
  requireElement<HTMLButtonElement>('#helen-reading-yes').addEventListener('click', () => openFeature('reading'));
  requireElement<HTMLButtonElement>('#helen-reading-no').addEventListener('click', closeNoelDialogue);
  possessAlexButton.addEventListener('click', () => {
    if (getPlayerBody() !== 'ghost' || nearbyInteraction !== 'wheldon' || !roomDialogue.isWheldonQuestion) return;
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

const updatePlayer = createInteriorPlayerUpdater({
  player, input, width: WORLD_WIDTH, height: WORLD_HEIGHT, frameCount: FRAME_COUNT, collision,
  flightBounds: FLIGHT_BOUNDS, flightLandingBlocked,
  isJournalOpen: () => journalGallery.isOpen() || !alexJournalOptions.hidden || (isTransformedCave && noelDialogueOpen),
  isCaveEntering: () => caveSiblings?.isEntering ?? false,
});
function updateNearbyInteraction(): void {
  if (isCinemaInterior) {
    const previousInteraction = nearbyInteraction;
    const target = INTERACTION_TARGETS
      .filter((interaction) => !isOscarEaten(interaction.kind))
      .map((interaction) => ({ ...interaction, playerDistance: Math.hypot(player.x - interaction.x, player.y - interaction.y) }))
      .filter((interaction) => interaction.playerDistance <= interaction.distance)
      .sort((first, second) => first.playerDistance - second.playerDistance)[0];
    nearbyInteraction = target?.kind ?? null;
    if (nearbyInteraction !== previousInteraction && noelDialogueOpen) closeNoelDialogue();
    if (nearbyInteraction === 'dad' && previousInteraction !== 'dad') startDadDialogue();
    if (nearbyInteraction === 'kirin' && previousInteraction !== 'kirin') startGymNpcDialogue('kirin');
    if (target) interactionPrompt.textContent = target.label;
    interactionPrompt.hidden = true;
    cinemaAudience?.update(player.x, player.y, noelDialogueOpen, target !== undefined);
    return;
  }
  const target = INTERACTION_TARGETS
    .filter((interaction) => interaction.kind !== 'colander' || (!caveColanderHeld && !isTransformedCave))
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
  if (isCharityNpc(previousInteraction) && !nextInteraction && noelDialogueOpen) closeNoelDialogue();
  if (isCharityNpc(nextInteraction)) { charityDialogue.start(nextInteraction); return; }
  if (previousInteraction === 'siblings' && nextInteraction !== 'siblings') {
    caveSiblings?.leaveRange();
  }
  if (nextInteraction === 'colander') { startColanderPickup(); return; }
  if (nextInteraction === 'wheldon') {
    startRoomCharacterDialogue('wheldon');
    return;
  }
  if (nextInteraction === 'noel') {
    startRoomCharacterDialogue('noel');
    return;
  }
  if (nextInteraction === 'josh') {
    startJoshDialogue();
    return;
  }
  if (nextInteraction === 'minnie' || nextInteraction === 'buzz' || nextInteraction === 'tigger' || nextInteraction === 'socks') {
    startRoomCharacterDialogue(nextInteraction);
    return;
  }
  if (nextInteraction === 'siblings') {
    interactionPrompt.hidden = true;
    startSiblingsDialogue(performance.now());
    return;
  }
  if (nextInteraction === 'lucy') { interactionPrompt.hidden = true; startLucyDialogue(); return; }
  if (nextInteraction === 'helen') { interactionPrompt.hidden = true; startRoomCharacterDialogue('helen'); return; }
  if (nextInteraction === 'andy' || nextInteraction === 'aliya') { interactionPrompt.hidden = true; startMusicHouseDialogue(nextInteraction); return; }
  if (nextInteraction === 'julian' || nextInteraction === 'tim' || nextInteraction === 'kirin') { interactionPrompt.hidden = true; startGymNpcDialogue(nextInteraction); return; }
  if (target) interactionPrompt.textContent = target.label;
  interactionPrompt.hidden = !target || noelDialogueOpen;
}
const chaseMessage = document.createElement('section');
chaseMessage.className = 'npc-dialogue sibling-chase-message';
chaseMessage.setAttribute('role', 'status');
chaseMessage.textContent = INTERIOR_CHASE_MESSAGE;
chaseMessage.hidden = true;
if (isSiblingPursuitActive()) requireElement<HTMLElement>('.game-shell').append(chaseMessage);
const siblingChase = isSiblingPursuitActive() ? new InteriorSiblingChase(
  scene.playerStart,
  (x, y) => collision.playerIsBlocked(x, y),
  () => { closeNoelDialogue(); chaseMessage.hidden = false; playMessageVoices('../'); },
  () => { closeNoelDialogue(); input.releaseAll(); chaseMessage.hidden = true; startCatchTransition('../transform.html'); requireElement<HTMLElement>('.game-shell').inert = true; },
) : null;
const draw = createInteriorRenderer({
  ...assets, scene, player, sealMode: SEAL_MODE, collision, siblingChase,
  caveSiblings, lucy, interiorDoors, getCaveColanderHeld: () => caveColanderHeld,
});
let worldAnimationTime = 0;
function gameLoop(time: number): void {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  const worldDeltaTime = aliceWorldDeltaTime(reiWorldDeltaTime(mikeWorldDeltaTime(katieWorldDeltaTime(julianWorldDeltaTime(juWorldDeltaTime(helenWorldDeltaTime(danWorldDeltaTime(chrisWorldDeltaTime(andyWorldDeltaTime(maddyWorldDeltaTime(deltaTime, time), time), time), time), time), time), time), time), time), time), time);
  worldAnimationTime = worldAnimationTime === 0 ? time : worldAnimationTime + worldDeltaTime * 1000;
  previousTime = time;
  if (doughnutShop?.eating) return;
  siblingChase?.update(deltaTime, player);
  if (siblingChase) {
    chaseMessage.hidden = siblingChase.phase !== 'message';
    canvas.dataset.siblingChase = siblingChase.phase;
    if (siblingChase.phase === 'caught') { draw(time, worldAnimationTime); return; }
  }
  updatePowerups(time);
  if (isThoughtsOpen() || isEdTattooOpen() || isKirinMovieOpen()) { draw(time, worldAnimationTime); return; }
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
  if (!siblingChase) caveSiblings?.update(worldDeltaTime, time);
  updatePlayer(deltaTime);
  doughnutShop?.update(player.x, player.y);
  if (doughnutShop?.eating) return;
  updateSamPower(time, player.x, player.y, visibleKatieTargets, player.direction);
  updateTimInputWorld(time, player.x, player.y);
  updateBochraWorld(time, player.x, player.y, OSCAR_INTERIOR_TARGETS);
  updateChrisWorld(time, player.x, player.y, visibleOscarTargets);
  updateDanWorld(time, player.x, player.y, visibleOscarTargets);
  updateGeorgiaWorld(time, player.x, player.y, visibleOscarTargets);
  if (!siblingChase && !isAlicePowerActive(time) && !isChrisPowerActive(time) && !isDanPowerActive(time) && !isGeorgiaPowerActive(time) && !isHelenPowerActive(time) && !isJoePowerActive(time) && !isJuPowerActive(time) && !isJulianPowerActive(time) && !isKatiePowerActive(time) && !isLucyPowerActive(time) && !isMikePowerActive(time) && !isNoelPowerActive(time) && !isOscarPowerActive(time) && !isReiPowerActive(time) && !isSamPowerActive(time) && !isTimInputPowerActive(time)) updateNearbyInteraction();
  if (!isAlicePowerActive(time) && !isGeorgiaPowerActive(time) && !isJulianPowerActive(time) && !isKatiePowerActive(time) && !isLucyPowerActive(time) && !isMikePowerActive(time) && !isNoelPowerActive(time) && !isOscarPowerActive(time) && !isReiPowerActive(time) && !isSamPowerActive(time) && !isTimInputPowerActive(time)) interiorDoors.update(player.x, player.y);
  draw(time, worldAnimationTime);
}
interiorDoors.syncExitLink(document.querySelector<HTMLAnchorElement>('.interior-exit'));
document.querySelectorAll<HTMLElement>('.npc-dialogue').forEach(setupDialoguePanel);
bindControls(); setupAudioMute(); setupInteriorAmbience(enteredDoor);
setupInventory();
bindPowerDialogueDismissal(closeNoelDialogue);
window.addEventListener('max-game:alex-s-dialogue', () => { input.releaseAll(); closeNoelDialogue(); });
document.querySelector('.interior-exit')?.addEventListener('click', (event) => { if (isAlicePowerActive() || isKatiePowerActive() || isLucyPowerActive() || isMikePowerActive() || isNoelPowerActive() || isOscarPowerActive() || isReiPowerActive() || isSamPowerActive() || isTimInputPowerActive()) event.preventDefault(); });
setupJump();

Promise.all([...assets.requiredImages, ...(lucy ? [lucy.sprite] : [])].map(loadInteriorImage))
  .then(() => {
    input.releaseAll();
    doorLoading.hidden = true;
    context.imageSmoothingEnabled = false;
    startGameLoop(gameLoop, () => { previousTime = 0; });
    doughnutShop?.enter();
    if (isDiaryLabInterior && !siblingChase) startAlexJournalOffer();
  })
  .catch((error: unknown) => {
    console.error(error);
    doorLoading.hidden = true;
    context.fillStyle = '#f5fff6';
    context.font = '13px monospace';
    context.fillText('Could not load the interior.', 120, 240); });
