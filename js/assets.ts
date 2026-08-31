const IMAGE_SOURCES = {
  map: 'img/external/overworld.png?v=no-bushes-no-pink-trees',
  road: 'img/external/road.png',
  roadTree: 'img/external/tree.png',
  roadBusRoof: 'img/external/bus-roof.png',
  doorOpen: 'img/external/door-open.png',
  billboard: 'img/external/buildings/billboard.png',
  cinema: 'img/external/buildings/cinema.png',
  musicShop: 'img/external/buildings/music-shop.png',
  gym: 'img/external/buildings/gym.png',
  gymRoof: 'img/external/buildings/gym-roof.png',
  snowMansion: 'img/external/buildings/snow-mansion.png',
  snowmanFallen: 'img/external/snowman-fallen.png',
  jobCenter: 'img/external/buildings/job-center.png',
  artistStudio: 'img/external/buildings/artist-studio.png',
  feedback: 'img/external/buildings/feedback.png?v=91x97',
  diaryLab: 'img/external/buildings/diary-lab.png',
  bookshop: 'img/external/buildings/bookshop.png',
  zenGarden: 'img/external/buildings/zen-garden.png',
  tori: 'img/external/buildings/tori.png',
  spriteSheet: 'player/SpriteSheet.png',
  sealSpriteSheet: 'player/seal-game.png',
  mike: 'chat/mike/overworld-avatar.png',
  mikeAftermath: 'img/external/mike-aftermath.png',
  niall: 'chat/niall/avatar.png',
  niallSprite: 'chat/niall/niall-sprite.png',
  niallExplanationMark: 'chat/niall/explanation-mark.png',
  girlsSprite: 'chat/siblings/girls-sprite.png',
  bus: 'img/external/bus.png',
} as const;

export type AssetName = keyof typeof IMAGE_SOURCES;

export const images = Object.fromEntries(
  (Object.keys(IMAGE_SOURCES) as AssetName[]).map((name) => [name, new Image()]),
) as Record<AssetName, HTMLImageElement>;

function loadImage(image: HTMLImageElement, src: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    // decode() keeps the 1254x1254 map's bitmap expansion off the first frame's
    // animation callback; it is optional, so a failure there is not fatal.
    image.onload = () => resolve(image.decode?.().catch(() => {}));
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = src;
  });
}

export function loadAssets(): Promise<unknown[]> {
  return Promise.all(
    (Object.entries(IMAGE_SOURCES) as Array<[AssetName, string]>).map(([name, src]) =>
      loadImage(images[name], src)),
  );
}
