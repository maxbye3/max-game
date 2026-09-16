export interface MapCharacterDefinition {
  readonly name: string;
  readonly source: string;
  readonly x: number;
  readonly y: number;
  readonly height: number;
}

export interface MapCharacter extends MapCharacterDefinition {
  readonly image: HTMLImageElement;
}

export const MAP_CHARACTER_DEFINITIONS: readonly MapCharacterDefinition[] = [
  { name: 'Alice', source: 'chat/alice/map-sprite.png', x: 220, y: 530, height: 52 },
  { name: 'Bochra', source: 'chat/bochra/map-sprite.png', x: 1114, y: 322, height: 52 },
  { name: 'Dan', source: 'chat/dan/map-sprite.png', x: 1114, y: 322, height: 48 },
  { name: 'Joe', source: 'chat/joe/map-sprite.png', x: 1080, y: 1070, height: 52 },
  { name: 'Katie', source: 'chat/katie/map-sprite.png', x: 1130, y: 1018, height: 52 },
  { name: 'Mason', source: 'chat/mason/map-sprite.png', x: 820, y: 570, height: 69 },
  { name: 'Meli', source: 'chat/meli/map-sprite.png', x: 858, y: 570, height: 69 },
  { name: 'Oscar', source: 'chat/oscar/map-sprite.png', x: 336, y: 864, height: 52 },
  { name: 'Sam', source: 'chat/sam/map-sprite.png', x: 324, y: 974, height: 52 },
  { name: 'Chris', source: 'chat/chris/map-sprite.png', x: 475, y: 270, height: 52 },
  { name: 'Ju', source: 'chat/ju/map-sprite.png', x: 1114, y: 322, height: 52 },
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
    character.image.src = character.source;
  });
}

export function loadMapCharacters(): Promise<void> {
  return Promise.all(mapCharacters.map(loadImage)).then(() => undefined);
}

export function drawMapCharacters(
  context: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  shouldDraw: (character: MapCharacter) => boolean = () => true,
): void {
  context.save();
  context.imageSmoothingEnabled = false;
  for (const character of mapCharacters) {
    if (!shouldDraw(character)) continue;
    const width = Math.round(character.height * (character.image.naturalWidth / character.image.naturalHeight));
    context.drawImage(
      character.image,
      Math.round(character.x - cameraX - width / 2),
      Math.round(character.y - cameraY - character.height),
      width,
      character.height,
    );
  }
  context.restore();
}
