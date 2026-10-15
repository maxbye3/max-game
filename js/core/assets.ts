import { hasMikeAftermath } from './world-state.js';
import { characterAsset, playerAsset } from './character-assets.js';
import { webImageSource } from './web-images.js';
import { GHOST_SPRITE_SOURCE } from '../generated/core/ghost-sprite.generated.js';

const IMAGE_SOURCES = {
  map: 'img/external/overworld.png?v=riverside-sign-bookstore',
  caveCover: 'img/external/cave-cover.png',
  eventTinder: 'img/external/event-tinder.png',
  road: 'img/external/road.png',
  roadTree: 'img/external/tree.png',
  roadBusRoof: 'img/external/bus-roof.png',
  gate: 'img/external/gate.png',
  graveyard: 'img/external/graveyard.png',
  musicShopSign: 'img/external/music-shop-sign.png',
  doorOpen: 'img/external/door-open.png',
  billboard: 'img/external/buildings/billboard.png',
  billboardUnfinished: 'img/external/billboard-unfinished.png',
  billboardFinished: 'img/external/billboard-finished.png',
  tv: 'img/external/buildings/tv.png',
  cinema: 'img/external/buildings/cinema.png',
  musicShop: 'img/external/buildings/music-shop.png',
  gym: 'img/external/buildings/gym.png',
  gymRoof: 'img/external/buildings/gym-roof.png',
  snowMansion: 'img/external/buildings/snow-mansion.png',
  snowmanFallen: 'img/external/snowman-fallen.png',
  jobCenter: 'img/external/buildings/job-center.png',
  artistStudio: 'img/external/buildings/artist-studio.png',
  feedback: 'img/external/doughnut_shop.png',
  diaryLab: 'img/external/buildings/diary-lab.png',
  bookshop: 'img/external/buildings/bookshop.png',
  zenGarden: 'img/external/buildings/zen-garden.png',
  tori: 'img/external/buildings/tori.png',
  spriteSheet: playerAsset('spriteSheet'),
  ghostSpriteSheet: GHOST_SPRITE_SOURCE,
  sealSpriteSheet: `${playerAsset('sealSpriteSheet')}?v=20260831-transparent`,
  georgia: characterAsset('georgia', 'avatar'),
  georgiaBike: characterAsset('georgia', 'bike'),
  mike: characterAsset('mike', 'overworldAvatar'),
  mikeAftermath: 'img/external/mike-aftermath.png',
  paint: 'img/external/paint.png',
  rei: characterAsset('rei', 'overworldAvatar'),
  adam: characterAsset('adam', 'avatar'),
  ed: characterAsset('ed', 'avatar'),
  alexS: characterAsset('alex-s', 'avatar'),
  wheldonSprite: characterAsset('alex-s', 'wheldonSprite'),
  ghostWheldonSprite: characterAsset('alex-s', 'ghostWheldonSprite'),
  katy: characterAsset('katy', 'mapSprite'),
  timWalk: characterAsset('tim', 'walkSprite'),
  niallSprite: characterAsset('niall', 'niallSprite'),
  niallExplanationMark: characterAsset('niall', 'explanationMark'),
  girlsSprite: characterAsset('siblings', 'girlsSprite'),
  bus: 'img/external/bus.png',
  roadCarBlue: 'img/external/cars/blue-hatchback.png',
  roadCarRed: 'img/external/cars/red-hatchback.png',
  roadCarSilver: 'img/external/cars/silver-hatchback.png',
  roadCarGreen: 'img/external/cars/green-suv.png',
  roadCarYellow: 'img/external/cars/yellow-taxi.png',
  roadCarVan: 'img/external/cars/cream-van.png',
} as const;

export type AssetName = keyof typeof IMAGE_SOURCES;

export const images = Object.fromEntries(
  (Object.keys(IMAGE_SOURCES) as AssetName[]).map((name) => [name, new Image()]),
) as Record<AssetName, HTMLImageElement>;

const IMAGE_DECODE_TIMEOUT_MS = 1500;

function decodeBeforeFirstFrame(image: HTMLImageElement): Promise<void> {
  const decode = image.decode?.();
  if (!decode) return Promise.resolve();

  return new Promise((resolve) => {
    const timeout = window.setTimeout(finish, IMAGE_DECODE_TIMEOUT_MS);
    function finish(): void {
      window.clearTimeout(timeout);
      resolve();
    }
    void decode.then(finish, finish);
  });
}

function loadImage(image: HTMLImageElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // decode() keeps the 1254x1254 map's bitmap expansion off the first frame's
    // animation callback, but a stalled browser decode must not trap the game
    // on its loading screen after a successful image load.
    image.onload = () => {
      void decodeBeforeFirstFrame(image).then(resolve);
    };
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = webImageSource(src);
  });
}

export async function loadAssets(needsCaveThief = false): Promise<void> {
  const sealMode = new URLSearchParams(window.location.search).has('seal');
  const requestedAssets = (Object.keys(IMAGE_SOURCES) as AssetName[]).filter((name) =>
    name !== 'georgia' &&
    (name !== 'girlsSprite' || needsCaveThief) &&
    name !== (hasMikeAftermath() ? 'billboardUnfinished' : 'billboardFinished') &&
    name !== (hasMikeAftermath() ? 'mike' : 'mikeAftermath') &&
    (name !== 'paint' || hasMikeAftermath()) &&
    name !== (sealMode ? 'spriteSheet' : 'sealSpriteSheet'),
  );
  const playerImage = sealMode ? 'sealSpriteSheet' : 'spriteSheet';
  const firstFrameAssets: AssetName[] = ['map', 'road', 'bus', playerImage, 'ghostSpriteSheet', 'ghostWheldonSprite'];
  await Promise.all(firstFrameAssets.map((name) => loadImage(images[name], IMAGE_SOURCES[name])));

  const backgroundAssets = requestedAssets.filter((name) => !firstFrameAssets.includes(name));
  const loadBackgroundAssets = (): void => {
    for (const name of backgroundAssets) {
      if (images[name].complete && images[name].naturalWidth > 0) continue;
      void loadImage(images[name], IMAGE_SOURCES[name]).catch(() => {});
    }
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(loadBackgroundAssets, { timeout: 1500 });
  } else {
    window.setTimeout(loadBackgroundAssets, 250);
  }
}
