import { withCharacterPowers } from '../powers/shared/character-power-render.js';
import { webImageSource } from '../core/web-images.js';
import { characterAsset, type CharacterId } from '../core/character-assets.js';
import { samTargetId, samVictimOffset } from '../powers/sam/sam-power.js';
import { isOscarEaten, oscarCharacterId } from '../powers/oscar/oscar-power.js';
import { RUBY } from './npc-definitions.js';

export interface MapCharacterDefinition {
  readonly id: CharacterId;
  readonly name: string;
  readonly source: string;
  readonly x: number;
  readonly y: number;
  readonly height: number;
}

export interface MapCharacter extends MapCharacterDefinition {
  readonly image: HTMLImageElement;
  sprite: HTMLCanvasElement | null;
}

export const MAP_CHARACTER_DEFINITIONS: readonly MapCharacterDefinition[] = [
  { id: 'alice', name: 'Alice', source: characterAsset('alice', 'mapSprite'), x: 260, y: 120, height: 52 },
  { id: 'bochra', name: 'Bochra', source: characterAsset('bochra', 'mapSprite'), x: 1114, y: 172, height: 52 },
  { id: 'chris', name: 'Chris', source: characterAsset('chris', 'mapSprite'), x: 475, y: 270, height: 52 },
  { id: 'dan', name: 'Dan', source: characterAsset('dan', 'mapSprite'), x: 1150, y: 372, height: 48 },
  { id: 'joe', name: 'Joe', source: characterAsset('joe', 'mapSprite'), x: 1080, y: 1070, height: 52 },
  { id: 'ju', name: 'Ju', source: characterAsset('ju', 'mapSprite'), x: 1000, y: 180, height: 52 },
  { id: 'katie', name: 'Katie', source: characterAsset('katie', 'mapSprite'), x: 1130, y: 1018, height: 52 },
  { id: 'maddy', name: 'Maddy', source: characterAsset('maddy', 'mapSprite'), x: 383, y: 1045, height: 59 },
  { id: 'marina-d', name: 'Marina', source: characterAsset('marina-d', 'mapSprite'), x: 201, y: 1034, height: 52 },
  { id: 'mason', name: 'Mason', source: characterAsset('mason', 'mapSprite'), x: 820, y: 570, height: 69 },
  { id: 'meli', name: 'Meli', source: characterAsset('meli', 'mapSprite'), x: 858, y: 570, height: 69 },
  { id: 'oscar', name: 'Oscar', source: characterAsset('oscar', 'mapSprite'), x: 636, y: 564, height: 52 },
  { id: 'sam', name: 'Sam', source: characterAsset('sam', 'mapSprite'), x: 324, y: 974, height: 52 },
  { id: 'ruby', name: RUBY.name, source: characterAsset('ruby', 'overworldAvatar'), x: RUBY.x, y: RUBY.y, height: RUBY.height },
];

export const mapCharacters: readonly MapCharacter[] = MAP_CHARACTER_DEFINITIONS.map((character) => ({
  ...character,
  image: new Image(),
  sprite: null,
}));

function prepareMapSprite(character: MapCharacter): HTMLCanvasElement {
  // Scaling an HTMLImageElement directly lets the browser sample a reduced
  // decode, which can erase thin features such as Marina's eyes. Copy every
  // source pixel first, then resize the canvas with nearest-neighbor sampling.
  const source = document.createElement('canvas');
  source.width = character.image.naturalWidth;
  source.height = character.image.naturalHeight;
  source.getContext('2d')!.drawImage(character.image, 0, 0);
  const sprite = document.createElement('canvas');
  sprite.height = character.height;
  sprite.width = Math.round(character.height * source.width / source.height);
  const context = sprite.getContext('2d')!;
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0, sprite.width, sprite.height);
  return sprite;
}

function loadImage(character: MapCharacter): Promise<void> {
  return new Promise((resolve, reject) => {
    character.image.onload = async () => {
      try {
        await character.image.decode?.().catch(() => {});
        character.sprite = prepareMapSprite(character);
        resolve();
      } catch (error) {
        reject(error);
      }
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
  shouldDraw: (character: MapCharacter) => boolean = (character) => !isOscarEaten(oscarCharacterId(character.id)),
): void {
  context.save();
  context.imageSmoothingEnabled = false;
  for (const character of mapCharacters) {
    if (!character.sprite) continue;
    if (!shouldDraw(character)) continue;
    // Leave room for stretched poses and recoil beyond the normal sprite.
    const margin = character.height * 4;
    if (character.x - cameraX < -margin || character.x - cameraX > context.canvas.width + margin ||
      character.y - cameraY < -margin || character.y - cameraY > context.canvas.height + margin) continue;
    const width = character.sprite.width;
    const offset = samVictimOffset(samTargetId(character.id));
    withCharacterPowers(context, character.x - cameraX, character.y - cameraY, character.height, samTargetId(character.id), () => context.drawImage(
      character.sprite!,
      Math.round(character.x - cameraX - width / 2 + offset.x),
      Math.round(character.y - cameraY - character.height + offset.y),
      width,
      character.height,
    ));
  }
  context.restore();
}
