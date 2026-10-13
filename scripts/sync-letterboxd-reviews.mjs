import { mkdir, writeFile } from 'node:fs/promises';

const FEED_URL = 'https://letterboxd.com/maxbye/rss/';
const OUTPUT_URL = new URL('../data/letterboxd-reviews.json', import.meta.url);

function decode(value) {
  return value.replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function field(item, name) {
  const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return match ? decode(match[1]) : '';
}

function reviewText(description) {
  return decode(description)
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

const response = await fetch(FEED_URL, { headers: { 'user-agent': 'max-game-letterboxd-sync/1.0' } });
if (!response.ok) throw new Error(`Letterboxd RSS request failed: ${response.status}`);
const rss = await response.text();
const reviews = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 30).map((match) => {
  const item = match[1];
  const description = field(item, 'description');
  const poster = description.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1] ?? '';
  return {
    title: field(item, 'letterboxd:filmTitle'),
    year: field(item, 'letterboxd:filmYear'),
    poster,
    rating: Number(field(item, 'letterboxd:memberRating')) || 0,
    review: reviewText(description),
    url: field(item, 'link'),
  };
}).filter((review) => review.title && review.url && review.poster);

await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(OUTPUT_URL, `${JSON.stringify({ updatedAt: new Date().toISOString(), reviews }, null, 2)}\n`);
console.log(`Saved ${reviews.length} Letterboxd reviews.`);
