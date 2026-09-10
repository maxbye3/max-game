import { drawColander, hasCaveColander } from './colander.js';
import {
  CAVE_SIBLINGS,
  CAVE_SIBLINGS_IDLE_FRAME,
  CAVE_SIBLINGS_WALK_FRAMES,
  CaveSiblingsController,
} from './cave-siblings.js';
import { CinemaAudienceController } from './cinema-audience.js';
import { DiaryLabFeatures } from './diary-lab-features.js';
import { canvas, context, requireElement } from './dom.js';
import { DirectionInputController } from './input.js';
import { InteriorCollision } from './interior-collision.js';
import { InteriorDoorsController } from './interior-doors.js';
import { GYM_NPCS } from './gym-npcs.js';
import { LucyController } from './lucy.js';
import { MUSIC_HOUSE_NPCS } from './music-house-npcs.js';
import { NOEL_DIALOGUE_LINES } from './noel-dialogue.js';
import { getPlayerSpriteFrame } from './player-sprite.js';
import {
  CAVE_COLANDER,
  CAVE_WALLS,
  NOEL,
  getInteriorScene,
  type InteractionKind,
} from './interior-scenes.js';
import type { Direction } from './types.js';
import { moveWithCollisions } from './movement.js';
const searchParams = new URLSearchParams(window.location.search);
const SEAL_MODE = searchParams.has('seal');
const interactionPrompt = requireElement<HTMLButtonElement>('#interaction-prompt');
const noelDialogue = requireElement<HTMLElement>('#noel-dialogue');
const noelSpeaker = requireElement<HTMLElement>('#noel-speaker');
const noelDialogueLine = requireElement<HTMLElement>('#noel-dialogue-line');
const noelDialogueNext = requireElement<HTMLButtonElement>('#noel-dialogue-next');
const noelDialogueQuestion = requireElement<HTMLElement>('#noel-dialogue-question');
const noelDialogueOptions = requireElement<HTMLElement>('#noel-dialogue-options');
const siblingsDialogueOptions = requireElement<HTMLElement>('#siblings-dialogue-options');
const siblingsViewWebsite = requireElement<HTMLAnchorElement>('#siblings-view-website');
const siblingsDeclineButton = requireElement<HTMLButtonElement>('#siblings-decline');
const musicDialogueOptions = requireElement<HTMLElement>('#music-dialogue-options');
const musicSpotify = requireElement<HTMLAnchorElement>('#music-spotify');
const musicYoutube = requireElement<HTMLAnchorElement>('#music-youtube');
const musicDeclineButton = requireElement<HTMLButtonElement>('#music-decline');
const noelDialogueClose = requireElement<HTMLButtonElement>('#noel-dialogue-close');
const noelDeclineButton = requireElement<HTMLButtonElement>('#noel-decline');
const FRAME_COUNT = SEAL_MODE ? 8 : 9;
const PLAYER_SCALE = 2;
const VIEW_SCALE = 1;
const SPEED = 145;
const NOEL_FOLDER = 'chat/noel';
const NOEL_NAME = NOEL_FOLDER.slice(NOEL_FOLDER.lastIndexOf('/') + 1);
const NOEL_QUESTION = 'would you like to checkout some experiments Max is working on or his journal (this will require you to know his phone number)';
const SHOW_COLLISIONS = searchParams.has('collisions');
const enteredDoor = searchParams.get('door');
const scene = getInteriorScene(enteredDoor);
const isCinemaInterior = scene.kind === 'cinema';
const isMusicShopInterior = scene.kind === 'musicShop';
const isGymInterior = scene.kind === 'gym';
const isBookshopInterior = scene.kind === 'bookshop';
const isMansionInterior = scene.kind === 'mansion';
const isCaveInterior = scene.kind === 'cave';
const isDiaryLabInterior = scene.kind === 'diaryLab';
document.title = scene.title;
canvas.setAttribute('aria-label', scene.ariaLabel);
const WORLD_WIDTH = scene.width;
const WORLD_HEIGHT = scene.height;
const INTERACTION_TARGETS = scene.interactions;
if (isCaveInterior) {
  // The cave is wider than it is tall, so it gets its own non-square canvas
  // sized to its true aspect ratio instead of being stretched into the
  // square shell every other interior uses.
  canvas.width = WORLD_WIDTH;
  canvas.height = WORLD_HEIGHT;
  context.imageSmoothingEnabled = false;
  requireElement<HTMLElement>('.game-shell').classList.add('cave-shell');
}
const interior = new Image();
const collisionMask = new Image();
const doorOverlay = new Image();
const spriteSheet = new Image();
const noelSprite = new Image();
const siblingsSprite = new Image();
const musicHouseNpcs = MUSIC_HOUSE_NPCS.map((npc) => ({ ...npc, image: new Image() }));
const gymNpcs = GYM_NPCS.map((npc) => ({ ...npc, image: new Image() }));
interior.src = scene.backgroundSource;
if (scene.collisionMaskSource) collisionMask.src = scene.collisionMaskSource;
if (scene.doorOverlaySource) doorOverlay.src = scene.doorOverlaySource;
spriteSheet.src = SEAL_MODE
  ? '../player/seal-game.png?v=20260831-transparent'
  : '../player/SpriteSheet.png';
if (isDiaryLabInterior || isMansionInterior) noelSprite.src = '../chat/noel/interior-avatar.png';
if (isCaveInterior) siblingsSprite.src = '../chat/siblings/girls-sprite.png';
if (isMusicShopInterior) {
  musicHouseNpcs.forEach((npc) => {
    npc.image.src = npc.source;
  });
}
if (isGymInterior) {
  gymNpcs.forEach((npc) => {
    npc.image.src = npc.source;
  });
}
const noelTheme = new Audio();
if (isDiaryLabInterior) noelTheme.src = '../chat/noel/player/theme.mp3';
noelTheme.preload = 'auto';
// Both sisters shout the colander warning together, so both clips play at once.
const colanderWarningVoices = [
  new Audio('../chat/siblings/maddy.mp3'),
  new Audio('../chat/siblings/marina.mp3'),
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
let noelDialogueLineIndex = 0;
const input = new DirectionInputController({
  canHold: () => !noelDialogueOpen || noelDialogueFollowsProximity,
});
const diaryLabFeatures = new DiaryLabFeatures();
const lucy = isBookshopInterior ? new LucyController(noelDialogueLine, noelDialogueNext) : null;
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
    showLine: ({ speaker, line }) => {
      noelSpeaker.textContent = speaker;
      noelDialogueLine.textContent = line;
    },
    showOptions: () => {
      siblingsDialogueOptions.hidden = false;
    },
    closeDialogue: () => closeNoelDialogue(),
  })
  : null;
const cinemaAudience = isCinemaInterior
  ? new CinemaAudienceController({
    openDialogue: (line) => {
      noelDialogueOpen = true;
      noelDialogueFollowsProximity = true;
      noelSpeaker.textContent = 'cinema audience';
      noelDialogueLine.textContent = line;
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
function finishNoelIntroduction(): void {
  noelDialogueNext.hidden = true;
  noelDialogueQuestion.textContent = NOEL_QUESTION;
  noelDialogueQuestion.hidden = false;
  noelDialogueOptions.hidden = false;
}
function showNoelDialogueLine(): void {
  noelDialogueLine.textContent = NOEL_DIALOGUE_LINES[noelDialogueLineIndex] ?? '';
  noelDialogueNext.hidden = false;
}
function showNextNoelDialogueLine(): void {
  if (!noelDialogueOpen) return;
  if (noelDialogueLineIndex < NOEL_DIALOGUE_LINES.length - 1) {
    noelDialogueLineIndex += 1;
    showNoelDialogueLine();
    return;
  }
  finishNoelIntroduction();
}
function closeNoelDialogue(): void {
  caveSiblings?.closeDialogue();
  noelDialogueOpen = false;
  noelDialogueFollowsProximity = false;
  noelDialogue.hidden = true;
  noelDialogueNext.hidden = true;
  noelDialogueOptions.hidden = true;
  siblingsDialogueOptions.hidden = true;
  musicDialogueOptions.hidden = true;
  diaryLabFeatures.hide();
  noelTheme.pause();
  noelTheme.currentTime = 0;
  noelTheme.onended = null;
  lucy?.stop();
  colanderWarningVoices.forEach((voice) => {
    voice.pause();
    voice.currentTime = 0;
  });
  interactionPrompt.hidden = nearbyInteraction === null || nearbyInteraction === 'siblings';
}
function showSiblingsDialogue(): void {
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
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = true;
  showSiblingsDialogue();
}
function startSiblingsWebsiteReturnDialogue(): void {
  if (!caveSiblings?.canResumeAfterWebsite) return;
  if (noelDialogueOpen) closeNoelDialogue();
  caveSiblings.resumeAfterWebsite(performance.now());
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = true;
  showSiblingsDialogue();
}
function startNoelDialogue(): void {
  if (nearbyInteraction !== 'noel' || noelDialogueOpen) return;
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = true;
  noelDialogueLineIndex = 0;
  noelSpeaker.textContent = NOEL_NAME;
  showNoelDialogueLine();
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
  noelTheme.pause();
  noelTheme.currentTime = 0;
  noelTheme.onended = null;
  void noelTheme.play().catch(() => {
    // Browsers may reject audio until a real keyboard or pointer gesture.
  });
}
function startLucyDialogue(): void {
  if (nearbyInteraction !== 'lucy' || noelDialogueOpen) return;
  input.releaseAll();
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = true;
  noelSpeaker.textContent = 'Lucy';
  lucy?.start();
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  siblingsDialogueOptions.hidden = true;
  musicDialogueOptions.hidden = true;
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
}
function openFeature(kind: 'diary' | 'experiments'): void {
  input.releaseAll();
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = false;
  interactionPrompt.hidden = true;
  noelDialogueNext.hidden = true;
  noelDialogue.hidden = true;
  diaryLabFeatures.open(kind);
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
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = false;
  noelSpeaker.textContent = 'THE GIRLS';
  noelDialogueLine.textContent = 'PUT THAT DOWN NOW';
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
  noelDialogueOpen = true;
  noelDialogueFollowsProximity = false;
  noelSpeaker.textContent = kind === 'andy' ? 'Andy' : 'Aliya';
  noelDialogueLine.textContent = kind === 'andy'
    ? "Would you like to hear Max's music?"
    : "When is Andy done? It's my turn to DJ.";
  noelDialogueNext.hidden = true;
  noelDialogueQuestion.hidden = true;
  noelDialogueOptions.hidden = true;
  siblingsDialogueOptions.hidden = true;
  musicDialogueOptions.hidden = kind !== 'andy';
  noelDialogue.hidden = false;
  interactionPrompt.hidden = true;
}
function activateNearbyInteraction(): void {
  if (nearbyInteraction === 'noel') startNoelDialogue();
  else if (nearbyInteraction === 'siblings') startSiblingsDialogue(performance.now());
  else if (nearbyInteraction === 'diary' || nearbyInteraction === 'experiments') {
    startFeatureInteraction(nearbyInteraction);
  } else if (nearbyInteraction === 'colander') {
    startColanderPickup();
  } else if (nearbyInteraction === 'andy' || nearbyInteraction === 'aliya') {
    startMusicHouseDialogue(nearbyInteraction);
  } else if (nearbyInteraction === 'lucy') {
    startLucyDialogue();
  }
}
function bindControls(): void {
  window.addEventListener('keydown', (event) => {
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
    else showNextNoelDialogueLine();
  });
  noelDialogueClose.addEventListener('click', closeNoelDialogue);
  noelDeclineButton.addEventListener('click', closeNoelDialogue);
  siblingsViewWebsite.addEventListener('click', () => {
    caveSiblings?.chooseWebsite();
    closeNoelDialogue();
  });
  siblingsDeclineButton.addEventListener('click', () => {
    siblingsDialogueOptions.hidden = true;
    caveSiblings?.declineWebsite(performance.now());
    showSiblingsDialogue();
  });
  musicSpotify.addEventListener('click', closeNoelDialogue);
  musicYoutube.addEventListener('click', closeNoelDialogue);
  musicDeclineButton.addEventListener('click', closeNoelDialogue);
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
    (previousInteraction === 'noel' || previousInteraction === 'siblings' || previousInteraction === 'lucy') &&
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
  if (target) interactionPrompt.textContent = target.label;
  interactionPrompt.hidden = !target || noelDialogueOpen;
}
function drawSceneryNpcs(
  npcs: readonly { x: number; y: number; width: number; height: number; image: HTMLImageElement }[],
  cameraX: number,
  cameraY: number,
  scaleX: number,
  scaleY: number,
): void {
  context.save();
  context.imageSmoothingEnabled = false;
  npcs.forEach((npc) => {
    context.drawImage(
      npc.image,
      Math.round((npc.x - cameraX - npc.width / 2) * scaleX),
      Math.round((npc.y - cameraY - npc.height) * scaleY),
      npc.width * scaleX,
      npc.height * scaleY,
    );
  });
  context.restore();
}
function draw(): void {
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
    drawSceneryNpcs(musicHouseNpcs, cameraX, cameraY, scaleX, scaleY);
  }
  if (isGymInterior) {
    drawSceneryNpcs(gymNpcs, cameraX, cameraY, scaleX, scaleY);
  }
  if (isBookshopInterior) {
    drawSceneryNpcs([
      { x: 256, y: 286, width: 42, height: 75, image: lucy!.sprite },
    ], cameraX, cameraY, scaleX, scaleY);
  }
  if (SHOW_COLLISIONS) {
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
    } else if (isMusicShopInterior || isGymInterior || isBookshopInterior || scene.kind === 'mansion') {
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
  context.restore();
}
function gameLoop(time: number): void {
  const deltaTime = previousTime === 0 ? 0 : Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  caveSiblings?.update(deltaTime, time);
  updatePlayer(deltaTime);
  updateNearbyInteraction();
  interiorDoors.update(player.x, player.y);
  draw();
  requestAnimationFrame(gameLoop);
}
interiorDoors.syncExitLink(document.querySelector<HTMLAnchorElement>('.interior-exit'));
bindControls();
const requiredImages = [
  interior,
  spriteSheet,
  ...(scene.collisionMaskSource ? [collisionMask] : []),
  ...(scene.doorOverlaySource ? [doorOverlay] : []),
  ...(isDiaryLabInterior || isMansionInterior ? [noelSprite] : []),
  ...(lucy ? [lucy.sprite] : []),
  ...(isCaveInterior ? [siblingsSprite] : []),
  ...(isMusicShopInterior ? musicHouseNpcs.map((npc) => npc.image) : []),
  ...(isGymInterior ? gymNpcs.map((npc) => npc.image) : []),
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
    context.fillText('Could not load the interior.', 120, 240);
  });
