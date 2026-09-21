import {
  ARTIST_STUDIO_X,
  ARTIST_STUDIO_Y,
  DIARY_LAB_X,
  DIARY_LAB_Y,
  BOOKSHOP_X,
  BOOKSHOP_Y,
  SNOW_MANSION_X,
  SNOW_MANSION_Y,
  ZEN_GARDEN_X,
  ZEN_GARDEN_Y,
} from './config.js';

const HEAR_DISTANCE = 160;
const FULL_VOLUME_DISTANCE = 58;

interface BuildingAmbience {
  readonly x: number;
  readonly y: number;
  readonly audio: HTMLAudioElement;
}

function createAmbience(source: string): HTMLAudioElement {
  const audio = new Audio(source);
  audio.loop = true;
  audio.preload = 'auto';
  return audio;
}

const BUILDING_AMBIENCE: readonly BuildingAmbience[] = [
  { x: 255, y: 443, audio: createAmbience('map/audio/nightclub.mp3') },
  { x: 1039, y: 533, audio: createAmbience('map/audio/gym.mp3') },
  { x: 1021, y: 792, audio: createAmbience('map/audio/jobCenter.mp3') },
  { x: 490, y: 820, audio: createAmbience('map/audio/cinema.mp3') },
  { x: ZEN_GARDEN_X + 108, y: ZEN_GARDEN_Y + 150, audio: createAmbience('map/audio/zen-garden.mp3') },
  { x: ARTIST_STUDIO_X + 92, y: ARTIST_STUDIO_Y + 99, audio: createAmbience('map/audio/art-studio.mp3') },
  { x: 235, y: 255, audio: createAmbience('map/audio/siblings.mp3') },
  { x: DIARY_LAB_X + 112, y: DIARY_LAB_Y + 85, audio: createAmbience('map/audio/journal.mp3') },
  { x: BOOKSHOP_X + 45, y: BOOKSHOP_Y + 56, audio: createAmbience('map/audio/bookstore.mp3') },
  { x: SNOW_MANSION_X + 109, y: SNOW_MANSION_Y + 171, audio: createAmbience('map/audio/snow-mansion.mp3') },
];

function updateAmbience(ambience: BuildingAmbience, playerX: number, playerY: number): void {
  const distance = Math.hypot(playerX - ambience.x, playerY - ambience.y);
  if (distance > HEAR_DISTANCE) {
    if (!ambience.audio.paused) {
      ambience.audio.pause();
      ambience.audio.currentTime = 0;
    }
    return;
  }

  const fadeRange = HEAR_DISTANCE - FULL_VOLUME_DISTANCE;
  ambience.audio.volume = Math.max(0, Math.min(1, (HEAR_DISTANCE - distance) / fadeRange));
  if (ambience.audio.paused) {
    void ambience.audio.play().catch(() => {
      // Browsers may wait for a player gesture before allowing ambience.
    });
  }
}

export function updateBuildingAmbience(playerX: number, playerY: number): void {
  BUILDING_AMBIENCE.forEach((ambience) => updateAmbience(ambience, playerX, playerY));
}
