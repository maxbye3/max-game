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
  { name: 'Alice', source: 'chat/alice/map-sprite.png', x: 438, y: 430, height: 52 },
  { name: 'Bochra', source: 'chat/bochra/map-sprite.png', x: 480, y: 430, height: 52 },
  { name: 'Dan', source: 'chat/dan/map-sprite.png', x: 522, y: 430, height: 52 },
  { name: 'Joe', source: 'chat/joe/map-sprite.png', x: 736, y: 418, height: 52 },
  { name: 'Josh', source: 'chat/josh/map-sprite.png', x: 782, y: 418, height: 52 },
  { name: 'Katie', source: 'chat/katie/map-sprite.png', x: 830, y: 418, height: 52 },
  { name: 'Katy', source: 'chat/katy/map-sprite.png', x: 402, y: 570, height: 52 },
  { name: 'Mason', source: 'chat/mason/map-sprite.png', x: 450, y: 570, height: 52 },
  { name: 'Meli', source: 'chat/meli/map-sprite.png', x: 498, y: 570, height: 52 },
  { name: 'Oscar', source: 'chat/oscar/map-sprite.png', x: 776, y: 574, height: 52 },
  { name: 'Sam', source: 'chat/sam/map-sprite.png', x: 824, y: 574, height: 52 },
  { name: 'Noel', source: 'chat/noel/map-sprite.png', x: 608, y: 270, height: 52 },
  { name: 'Chris', source: 'chat/chris/map-sprite.png', x: 655, y: 270, height: 52 },
  { name: 'Ju', source: 'chat/ju/map-sprite.png', x: 914, y: 322, height: 52 },
  { name: 'Alex W', source: 'chat/alex w/map-sprite.png', x: 584, y: 1025, height: 52 },
  { name: 'Helen', source: 'chat/helen/map-sprite.png', x: 628, y: 1025, height: 52 },
  { name: 'Lucy', source: 'chat/lucy/map-sprite.png', x: 672, y: 1025, height: 52 },
  { name: 'Andy', source: 'chat/andy/map-sprite.png', x: 700, y: 914, height: 52 },
  { name: 'Aliya', source: 'chat/aliya/map-sprite.png', x: 742, y: 914, height: 52 },
  { name: 'Julian', source: 'chat/julian/map-sprite.png', x: 1012, y: 640, height: 52 },
  { name: 'Tim', source: 'chat/tim/map-sprite.png', x: 1062, y: 640, height: 52 },
  { name: 'Maddy', source: 'chat/maddy/map-sprite.png', x: 1010, y: 1115, height: 52 },
  { name: 'Marina', source: 'chat/marina d/map-sprite.png', x: 1060, y: 1115, height: 52 },
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
