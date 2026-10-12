import { WEB_IMAGE_SOURCES } from './web-images.generated.js';

/** Keep source paths canonical; select a lossless browser copy when available. */
export function webImageSource(source: string): string {
  const prefix = source.startsWith('../') ? '../' : '';
  const key = source.slice(prefix.length).split('?')[0] ?? source;
  return WEB_IMAGE_SOURCES[key] ? prefix + WEB_IMAGE_SOURCES[key] : source;
}
