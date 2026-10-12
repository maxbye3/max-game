import { withCharacterPowers } from './character-power-render.js';
import { webImageSource } from './web-images.js';
import { samTargetId, samVictimOffset } from './sam-power.js';
import { isOscarEaten, oscarCharacterId } from './oscar-power.js';

export interface MapCharacterDefinition {
  readonly name: string;
  readonly source: string;
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly smoothScaling?: boolean;
}

export interface MapCharacter extends MapCharacterDefinition {
  readonly image: HTMLImageElement;
}

export const MAP_CHARACTER_DEFINITIONS: readonly MapCharacterDefinition[] = [
  { name: 'Alice', source: 'chat/alice/map-sprite.png', x: 260, y: 120, height: 52 },
  { name: 'Bochra', source: 'chat/bochra/map-sprite.png', x: 1114, y: 172, height: 52 },
  { name: 'Chris', source: 'chat/chris/map-sprite.png', x: 475, y: 270, height: 52 },
  { name: 'Dan', source: 'chat/dan/map-sprite.png', x: 1150, y: 372, height: 48 },
  { name: 'Joe', source: 'chat/joe/map-sprite.png', x: 1080, y: 1070, height: 52 },
  { name: 'Ju', source: 'chat/ju/map-sprite.png', x: 1000, y: 180, height: 52 },
  { name: 'Katie', source: 'chat/katie/map-sprite.png', x: 1130, y: 1018, height: 52 },
  { name: 'Maddy', source: 'chat/maddy/map-sprite.png', x: 383, y: 1045, height: 59 },
  { name: 'Marina', source: 'chat/marina d/map-sprite.png', x: 201, y: 1034, height: 52, smoothScaling: true },
  { name: 'Mason', source: 'chat/mason/map-sprite.png', x: 820, y: 570, height: 69 },
  { name: 'Meli', source: 'chat/meli/map-sprite.png', x: 858, y: 570, height: 69 },
  { name: 'Oscar', source: 'chat/oscar/map-sprite.png', x: 636, y: 564, height: 52 },
  { name: 'Sam', source: 'chat/sam/map-sprite.png', x: 324, y: 974, height: 52 },
];

export const mapCharacters: readonly MapCharacter[] = MAP_CHARACTER_DEFINITIONS.map((character) => ({
  ...character,
  image: new Image(),
}));

function loadImage(character: MapCharacter): Promise<void> {
  return new Promise((resolve, reject) => {
    character.image.onload = async () => {
      await character.image.decode?.().catch(() => {});
      resolve();
    };
    character.image.onerror = () => reject(new Error(`Failed to load ${character.source}`));
    character.image.src = webImageSource(character.source);
  });
}

export function loadMapCharacters(): Promise<void> {
  // Character sprites are spread across the whole world. Start these after
  // the opening frame; the canvas skips each sprite until its image is ready.
  const loadCharacters = (): void => {
    for (const character of mapCharacters) {
      void loadImage(character).catch(() => {});
    }
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(loadCharacters, { timeout: 1500 });
  } else {
    window.setTimeout(loadCharacters, 250);
  }
  return Promise.resolve();
}

export function drawMapCharacters(
  context: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  shouldDraw: (character: MapCharacter) => boolean = (character) => !isOscarEaten(oscarCharacterId(character.name)),
): void {
  context.save();
  context.imageSmoothingQuality = 'high';
  for (const character of mapCharacters) {
    if (!character.image.complete || character.image.naturalWidth === 0) continue;
    if (!shouldDraw(character)) continue;
    // Leave room for stretched poses and recoil beyond the normal sprite.
    const margin = character.height * 4;
    if (character.x - cameraX < -margin || character.x - cameraX > context.canvas.width + margin ||
      character.y - cameraY < -margin || character.y - cameraY > context.canvas.height + margin) continue;
    const width = Math.round(character.height * (character.image.naturalWidth / character.image.naturalHeight));
    const offset = samVictimOffset(samTargetId(character.name));
    context.imageSmoothingEnabled = character.smoothScaling ?? false;
    withCharacterPowers(context, character.x - cameraX, character.y - cameraY, character.height, samTargetId(character.name), () => context.drawImage(
      character.image,
      Math.round(character.x - cameraX - width / 2 + offset.x),
      Math.round(character.y - cameraY - character.height + offset.y),
      width,
      character.height,
    ));
  }
  context.restore();
}
