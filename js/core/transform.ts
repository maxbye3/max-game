import { CAVE_SIBLINGS, CAVE_SIBLINGS_IDLE_FRAME } from '../interiors/cave-siblings.js';
import { canvas, context, requireElement } from './dom.js';
import { characterAsset } from './character-assets.js';
import { CAVE_COLANDER, CAVE_HEIGHT, CAVE_WIDTH } from '../interiors/interior-scenes.js';
import { drawColander } from './colander.js';
import { setSiblingProfileImage } from './profile-images.js';
import { completeCaveTransformation } from './cave-transformation.js';
import { setPlayerBody } from './player-body.js';
import { setWheldonPlayerSpriteEnabled } from './player-sprite-test.js';
import { createGameAudio } from './audio-mute.js';
import { webImageSource } from './web-images.js';
import { loadInteriorImage } from '../interiors/interior-image-loading.js';

const CAVE_DARKNESS_ALPHA = 0.68;
const SCENE_VIEW = { x: 232, y: 20, width: 176, height: 224 };
const LINES = [
  { speaker: 'Maddy', text: 'you picked up' },
  { speaker: 'Marina', text: 'the colander now' },
  { speaker: 'Maddy', text: 'you will be a test guinea pig' },
  { speaker: 'Marina', text: 'on our experimental dream prototype' },
] as const;
const AFTER_LINES = [
  { speaker: 'Maddy', text: 'what the hell was that?' },
  { speaker: 'Marina', text: 'ah that was the wrong.. colander' },
  { speaker: 'Maddy', text: 'yeah, that was the colander that transferred his consciousness to the baby seal' },
] as const;
const voices = {
  Maddy: createGameAudio(characterAsset('siblings', 'maddyAudio')),
  Marina: createGameAudio(characterAsset('siblings', 'marinaAudio')),
};

function stopVoices(): void {
  for (const voice of Object.values(voices)) {
    voice.pause();
    voice.currentTime = 0;
  }
}

function showSpokenLine(current: { readonly speaker: 'Maddy' | 'Marina'; readonly text: string }): void {
  speaker.textContent = current.speaker;
  line.textContent = current.text;
  requireElement<HTMLImageElement>('#transform-maddy-profile').hidden = current.speaker !== 'Maddy';
  requireElement<HTMLImageElement>('#transform-marina-profile').hidden = current.speaker !== 'Marina';
  stopVoices();
  void voices[current.speaker].play().catch(() => {});
}

window.addEventListener('pagehide', stopVoices);

const speaker = requireElement<HTMLElement>('#transform-speaker');
const scene = requireElement<HTMLElement>('main');
const seal = { x: 374, y: 284 };
let afterMovie = false;
const view = { x: SCENE_VIEW.x, y: SCENE_VIEW.y };
const dialogue = requireElement<HTMLElement>('#transform-dialogue');
const line = requireElement<HTMLElement>('#transform-dialogue-line');
const next = requireElement<HTMLButtonElement>('#transform-dialogue-next');
const movie = requireElement<HTMLElement>('#transform-movie');
const video = requireElement<HTMLVideoElement>('#transform-video');
const playVideo = requireElement<HTMLButtonElement>('#transform-movie-play');
video.src = characterAsset('siblings', 'sealVideo');
let lineIndex = 0;
let placementProgress = 0;
let placingColander = false;

canvas.width = SCENE_VIEW.width;
canvas.height = SCENE_VIEW.height;
context.imageSmoothingEnabled = false;

const background = new Image();
const siblingsSprite = new Image();
const sealChair = new Image();
const playerChair = new Image();
background.src = webImageSource('img/internal/cave.jpg?v=20260901-half-size-no-sword');
siblingsSprite.src = webImageSource(characterAsset('siblings', 'girlsSprite'));
sealChair.src = webImageSource(characterAsset('siblings', 'sealChair'));
playerChair.src = webImageSource(characterAsset('siblings', 'playerChair'));

const playerChairPlacement = { x: 284, y: 136, width: 72, height: 72 };
const sealChairPlacement = { x: 348, y: 246, width: 52, height: 61 };

function draw(): void {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(-view.x, -view.y);
  context.drawImage(background, 0, 0, CAVE_WIDTH, CAVE_HEIGHT);

  const [sourceX, sourceY, sourceWidth, sourceHeight] = CAVE_SIBLINGS_IDLE_FRAME;
  context.drawImage(
    siblingsSprite,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    Math.round(CAVE_SIBLINGS.x - CAVE_SIBLINGS.width / 2),
    Math.round(CAVE_SIBLINGS.endY - CAVE_SIBLINGS.height + 28 * placementProgress),
    CAVE_SIBLINGS.width,
    CAVE_SIBLINGS.height,
  );

  // Remove the colander baked into the cave floor while it is being carried.
  if (placingColander) {
    context.fillStyle = '#0b0d0d';
    context.fillRect(CAVE_COLANDER.eraseX, CAVE_COLANDER.eraseY, CAVE_COLANDER.eraseWidth, CAVE_COLANDER.eraseHeight);
  }

  context.save();
  context.globalAlpha = CAVE_DARKNESS_ALPHA;
  context.fillStyle = '#000';
  context.fillRect(0, 0, CAVE_WIDTH, CAVE_HEIGHT);
  context.restore();

  // Keep the chairs visible in the cave's darkness while preserving the
  // requested top-to-bottom order (siblings, player chair, seal chair).
  context.drawImage(
    playerChair,
    playerChairPlacement.x,
    playerChairPlacement.y,
    playerChairPlacement.width,
    playerChairPlacement.height,
  );
  context.drawImage(sealChair, sealChairPlacement.x, sealChairPlacement.y, sealChairPlacement.width, sealChairPlacement.height);

  if (placingColander) {
    const progress = placementProgress;
    const x = CAVE_COLANDER.x + (320 - CAVE_COLANDER.x) * progress;
    const y = 282 + (146 - 282) * progress - Math.sin(Math.PI * progress) * 100;
    context.save();
    context.translate(Math.round(x), Math.round(y));
    context.rotate(Math.PI * progress);
    drawColander(context, 0, -11);
    context.restore();
  }
  context.restore();
}

function placeColander(): void {
  stopVoices();
  dialogue.hidden = true;
  placingColander = true;
  const startedAt = performance.now();
  function animate(time: number): void {
    const progress = Math.min(1, (time - startedAt) / 1800);
    placementProgress = progress * progress * (3 - 2 * progress);
    draw();
    if (progress < 1) requestAnimationFrame(animate);
    else {
      canvas.dataset.sceneStage = 'colander-placed';
      window.setTimeout(startMovie, 600);
    }
  }
  canvas.dataset.sceneStage = 'placing-colander';
  requestAnimationFrame(animate);
}

async function playMovie(): Promise<void> {
  playVideo.hidden = true;
  void movie.requestFullscreen?.().catch(() => {});
  try {
    await video.play();
  } catch {
    playVideo.hidden = false;
    playVideo.focus();
  }
}

function startMovie(): void {
  movie.hidden = false;
  scene.inert = true;
  canvas.dataset.sceneStage = 'video';
  video.focus();
  void playMovie();
}

function finishMovie(): void {
  if (movie.hidden) return;
  video.pause();
  movie.hidden = true;
  scene.inert = false;
  afterMovie = true;
  lineIndex = 0;
  if (document.fullscreenElement === movie) void document.exitFullscreen().catch(() => {});
  showAfterLine();
  next.focus();
}

function showAfterLine(): void {
  const current = AFTER_LINES[lineIndex];
  if (!current) return;
  showSpokenLine(current);
  dialogue.hidden = false;
  canvas.dataset.sceneStage = 'after-dialogue';
}

function panToSeal(): void {
  stopVoices();
  dialogue.hidden = true;
  canvas.dataset.sceneStage = 'panning-to-seal';
  const startedAt = performance.now();
  function animate(time: number): void {
    const progress = Math.min(1, (time - startedAt) / 1500);
    const eased = progress * progress * (3 - 2 * progress);
    view.x = SCENE_VIEW.x + (seal.x - SCENE_VIEW.width / 2 - SCENE_VIEW.x) * eased;
    view.y = SCENE_VIEW.y + (CAVE_HEIGHT - SCENE_VIEW.height - SCENE_VIEW.y) * eased;
    draw();
    if (progress < 1) requestAnimationFrame(animate);
    else enableSealControl();
  }
  requestAnimationFrame(animate);
}

function enableSealControl(): void {
  completeCaveTransformation();
  setPlayerBody('player');
  setWheldonPlayerSpriteEnabled(false);
  window.location.assign('internal/index.html?door=northwest-portal&seal=1&transformed=1&awakened=1');
}

playVideo.addEventListener('click', () => { void playMovie(); });
video.addEventListener('ended', finishMovie);

next.addEventListener('click', () => {
  if (dialogue.hidden) return;
  if (afterMovie) {
    if (lineIndex < AFTER_LINES.length - 1) { lineIndex++; showAfterLine(); }
    else panToSeal();
    return;
  }
  if (placingColander) return;
  const nextLine = LINES[lineIndex + 1];
  if (nextLine) {
    lineIndex++;
    showSpokenLine(nextLine);
  } else placeColander();
});
window.addEventListener('keydown', (event) => {
  if (dialogue.hidden || event.repeat || !['Space', 'Enter'].includes(event.code)) return;
  event.preventDefault();
  next.click();
});

Promise.all([background, siblingsSprite, sealChair, playerChair].map(loadInteriorImage))
  .then(() => {
    context.imageSmoothingEnabled = false;
    draw();
    setSiblingProfileImage(requireElement<HTMLImageElement>('#transform-maddy-profile'), 'Maddy');
    setSiblingProfileImage(requireElement<HTMLImageElement>('#transform-marina-profile'), 'Marina');
    showSpokenLine(LINES[0]);
    dialogue.hidden = false;
    canvas.dataset.sceneStage = 'dialogue';
  })
  .catch((error: unknown) => {
    console.error(error);
  });
