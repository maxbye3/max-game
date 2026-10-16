import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Shared album pages expose their first page as JSON in this callback. Do not
// scrape every image URL: that also picks up album covers and profile pictures.
export function parseAlbumPage(html) {
  const match = html.match(/AF_initDataCallback\(\{key: 'ds:1',[\s\S]*?data:([\s\S]*?), sideChannel:/);
  if (!match) throw new Error('Google Photos album data is missing');
  return parseAlbumData(JSON.parse(match[1]));
}

export function parseAlbumData(data) {
  if (!Array.isArray(data) || !Array.isArray(data[1]) || typeof data[2] !== 'string') {
    throw new Error('Google Photos album data has changed format');
  }
  const images = data[1].map((item) => item?.[1]?.[0]);
  if (!images.every((url) => typeof url === 'string' && /^https:\/\/lh3\.googleusercontent\.com\//.test(url))) {
    throw new Error('Google Photos returned an invalid photo');
  }
  return { images, nextPage: data[2] };
}

export function parseAlbumRpc(body) {
  // batchexecute returns length-prefixed JSON frames after an anti-XSSI prefix.
  for (const line of body.split('\n')) {
    if (!line.startsWith('[')) continue;
    const frames = JSON.parse(line);
    const frame = frames.find((entry) => entry[0] === 'wrb.fr' && entry[1] === 'snAcKc');
    if (frame && typeof frame[2] === 'string') return parseAlbumData(JSON.parse(frame[2]));
  }
  throw new Error('Google Photos pagination response is missing');
}

export async function fetchAlbumImages(albumUrl, fetcher = fetch) {
  const response = await fetcher(albumUrl, { cache: 'no-store', signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`Google Photos request failed: ${response.status}`);
  const html = await response.text();
  const first = parseAlbumPage(html);
  const images = [...first.images];
  let nextPage = first.nextPage;
  const tokens = new Set();
  // The same request metadata used by the album page includes its share key.
  const request = html.match(/id:'snAcKc',[\s\S]*?request:(\[[^\]]+\])/);
  while (nextPage) {
    if (!request || tokens.has(nextPage)) throw new Error('Google Photos pagination did not advance');
    tokens.add(nextPage);
    const args = JSON.parse(request[1]);
    args[1] = nextPage;
    const url = new URL('/_/PhotosUi/data/batchexecute', response.url);
    url.searchParams.set('rpcids', 'snAcKc');
    url.searchParams.set('source-path', new URL(response.url).pathname);
    const pageResponse = await fetcher(url, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ 'f.req': JSON.stringify([[['snAcKc', JSON.stringify(args), null, 'generic']]]) }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!pageResponse.ok) throw new Error(`Google Photos pagination failed: ${pageResponse.status}`);
    const page = parseAlbumRpc(await pageResponse.text());
    images.push(...page.images);
    nextPage = page.nextPage;
  }
  return [...new Set(images)];
}

export async function syncGooglePhotos() {
  const results = await Promise.allSettled(['art', 'journal', 'plants', 'workout'].map(async (name) => {
    const path = new URL(`../data/photos-${name}.json`, import.meta.url);
    const saved = JSON.parse(await readFile(path, 'utf8'));
    if (!saved.albumUrl) {
      console.warn(`${name}: shared album URL is not configured; keeping saved photos.`);
      return;
    }
    const images = await fetchAlbumImages(saved.albumUrl);
    const data = { albumUrl: saved.albumUrl, images };
    // Keep an unchanged snapshot byte-for-byte to avoid unnecessary deployments.
    if (JSON.stringify(saved.images) !== JSON.stringify(images)) {
      await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
    }
    console.log(`${name}: synced ${images.length} photos.`);
  }));
  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) throw new AggregateError(failures.map((result) => result.reason), 'Photo album sync failed');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await syncGooglePhotos();
}
