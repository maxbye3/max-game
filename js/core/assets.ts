import { IMAGE_SOURCES } from './asset-sources.js';
import { hasMikeAftermath } from './world-state.js';
import { webImageSource } from './web-images.js';
import { decodeLoadedImage } from './image-decoding.js';
import { getPlayerBody } from './player-body.js';
import { isWheldonPlayerSpriteEnabled } from './player-sprite-test.js';



export type AssetName = keyof typeof IMAGE_SOURCES;

export const images = Object.fromEntries(
  (Object.keys(IMAGE_SOURCES) as AssetName[]).map((name) => [name, new Image()]),
) as Record<AssetName, HTMLImageElement>;

function loadImage(image: HTMLImageElement, src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // decode() keeps the 1254x1254 map's bitmap expansion off the first frame's
    // animation callback, but a stalled browser decode must not trap the game
    // on its loading screen after a successful image load.
    image.onload = () => {
      void decodeLoadedImage(image).then(resolve);
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
  const wheldon = getPlayerBody() === 'alex-s' || isWheldonPlayerSpriteEnabled();
  const playerImage = getPlayerBody() === 'ghost' ? (wheldon ? 'ghostWheldonSprite' : 'ghostSpriteSheet')
    : wheldon ? 'wheldonSprite' : sealMode ? 'sealSpriteSheet' : 'spriteSheet';
  const firstFrameAssets: AssetName[] = [...new Set<AssetName>(['map', 'road', 'bus', playerImage, 'ghostSpriteSheet'])];
  await Promise.all(firstFrameAssets.map((name) => loadImage(images[name], IMAGE_SOURCES[name])));

  const backgroundAssets = requestedAssets.filter((name) => !firstFrameAssets.includes(name));
  const loadBackgroundAssets = (): void => {
    for (const name of backgroundAssets) {
      if (images[name].complete && images[name].naturalWidth > 0) continue;
      images[name].fetchPriority = 'low';
      void loadImage(images[name], IMAGE_SOURCES[name]).catch(() => {});
    }
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(loadBackgroundAssets, { timeout: 1500 });
  } else {
    window.setTimeout(loadBackgroundAssets, 250);
  }
}
