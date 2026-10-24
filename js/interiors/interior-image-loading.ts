import { decodeLoadedImage } from '../core/image-decoding.js';

function waitForLoad(image: HTMLImageElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
    };
    const loaded = (): void => { cleanup(); resolve(); };
    const failed = (): void => { cleanup(); reject(new Error(`Failed to load interior image: ${image.src.slice(0, 200)}`)); };
    image.addEventListener('load', loaded);
    image.addEventListener('error', failed);
    if (image.complete) {
      if (image.naturalWidth > 0) loaded();
      else failed();
    }
  });
}

export async function loadInteriorImage(image: HTMLImageElement): Promise<void> {
  try {
    await waitForLoad(image);
  } catch (error) {
    if (!/^https?:/.test(image.src)) throw error;
    const retry = new URL(image.src);
    retry.searchParams.set('interior-retry', '1');
    image.src = retry.href;
    await waitForLoad(image);
  }

  await decodeLoadedImage(image);
}
