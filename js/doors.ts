import { hasCaveColander } from './colander.js';
import { createGameAudio } from './audio-mute.js';
import { carryBuildingAmbienceInside } from './nightclub-audio.js';
import { releaseAllInput } from './input.js';

export interface Doorway {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// World-space doorway bounds traced from the green annotations.
export const DOORWAYS: readonly Doorway[] = [
  { id: 'northwest-portal', x: 222, y: 242, width: 27, height: 25 },
  { id: 'garden-room', x: 637, y: 208, width: 19, height: 26 },
  { id: 'diary-lab-center', x: 754, y: 204, width: 24, height: 21 },
  { id: 'diary-lab-right', x: 833, y: 204, width: 22, height: 23 },
  { id: 'music-shop', x: 240, y: 428, width: 30, height: 31 },
  { id: 'gym', x: 1024, y: 519, width: 30, height: 28 },
  { id: 'job-center', x: 1005, y: 775, width: 33, height: 34 },
  { id: 'artist-studio', x: 762, y: 788, width: 33, height: 32 },
  { id: 'cinema', x: 474, y: 800, width: 33, height: 40 },
  { id: 'bookshop', x: 542, y: 1034, width: 25, height: 30 },
  { id: 'snow-mansion', x: 792, y: 1100, width: 32, height: 32 },
  { id: 'feedback-center', x: 123, y: 1103, width: 30, height: 31 },
];

// Re-enable this entrance when the siblings' cave is ready to open.
const TEMPORARILY_CLOSED_DOOR_IDS = new Set(['northwest-portal']);
const ACTIVE_DOORWAYS = DOORWAYS.filter((doorway) => !TEMPORARILY_CLOSED_DOOR_IDS.has(doorway.id));

const OPEN_DISTANCE = 42;
const PASSAGE_MARGIN = 8;
const doorSound = createGameAudio('audio/open-door.mp3');
doorSound.preload = 'none';
doorSound.volume = 0.25;

let openDoorIds = new Set<string>();
let hasSyncedInitialDoorState = false;
let navigationStarted = false;

function distanceToDoorway(x: number, y: number, doorway: Doorway): number {
  const dx = Math.max(doorway.x - x, 0, x - (doorway.x + doorway.width));
  const dy = Math.max(doorway.y - y, 0, y - (doorway.y + doorway.height));
  return Math.hypot(dx, dy);
}

function pointInsideDoorway(x: number, y: number, doorway: Doorway, margin = 0): boolean {
  return x >= doorway.x - margin &&
    x <= doorway.x + doorway.width + margin &&
    y >= doorway.y - margin &&
    y <= doorway.y + doorway.height + margin;
}

function playDoorSound(): void {
  doorSound.currentTime = 0;
  void doorSound.play().catch(() => {
    // Browsers may reject audio until the first keyboard or pointer gesture.
  });
}

function showDoorLoading(): void {
  document.querySelector<HTMLElement>('#door-loading')?.removeAttribute('hidden');
  releaseAllInput();
}

export function isDoorNavigationStarted(): boolean {
  return navigationStarted;
}

export function updateDoors(playerX: number, playerY: number): void {
  const nextOpenDoorIds = new Set(
    ACTIVE_DOORWAYS
      .filter((doorway) => distanceToDoorway(playerX, playerY, doorway) <= OPEN_DISTANCE)
      .map((doorway) => doorway.id),
  );

  // Arriving via a `?door=` link spawns the player right next to that
  // doorway, so skip the very first check — otherwise it looks like the
  // player just walked up and the sound plays again on top of the one that
  // already fired on the page they navigated from.
  if (hasSyncedInitialDoorState && [...nextOpenDoorIds].some((id) => !openDoorIds.has(id))) {
    playDoorSound();
  }
  openDoorIds = nextOpenDoorIds;
  hasSyncedInitialDoorState = true;

  if (navigationStarted) return;
  const enteredDoorway = ACTIVE_DOORWAYS.find((doorway) => pointInsideDoorway(playerX, playerY, doorway));
  if (!enteredDoorway) return;

  navigationStarted = true;
  showDoorLoading();
  carryBuildingAmbienceInside(enteredDoorway.id);
  const params = new URLSearchParams({ door: enteredDoorway.id });
  if (hasCaveColander()) params.set('colander', '1');
  if (new URLSearchParams(window.location.search).has('seal')) params.set('seal', '1');
  const destination = `internal/index.html?${params.toString()}`;
  window.setTimeout(() => window.location.assign(destination), 80);
}

export function getOpenDoorways(): Doorway[] {
  return ACTIVE_DOORWAYS.filter((doorway) => openDoorIds.has(doorway.id));
}

export function isDoorPassagePoint(x: number, y: number): boolean {
  return ACTIVE_DOORWAYS.some((doorway) => pointInsideDoorway(x, y, doorway, PASSAGE_MARGIN));
}

export function isTemporarilyClosedDoorPoint(x: number, y: number): boolean {
  return DOORWAYS.some((doorway) =>
    TEMPORARILY_CLOSED_DOOR_IDS.has(doorway.id) &&
    pointInsideDoorway(x, y, doorway, PASSAGE_MARGIN),
  );
}
