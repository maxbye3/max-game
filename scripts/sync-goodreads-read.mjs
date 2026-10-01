import { mkdir, writeFile } from 'node:fs/promises';

const FEED_URL = 'https://www.goodreads.com/review/list_rss/198385610?shelf=read';
const OUTPUT_URL = new URL('../data/goodreads-read.json', import.meta.url);

function clean(value) {
  return value.replace(/^<!\[CDATA\[|\]\]>$/g, '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

function field(item, name) {
  const match = item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return match ? clean(match[1]) : '';
}

const response = await fetch(FEED_URL, { headers: { 'user-agent': 'max-game-goodreads-sync/1.0' } });
if (!response.ok) throw new Error(`Goodreads RSS request failed: ${response.status}`);
const rss = await response.text();
const reviews = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 30).map((match) => {
  const item = match[1];
  return {
    title: field(item, 'title'), author: field(item, 'author_name'),
    cover: field(item, 'book_large_image_url') || field(item, 'book_medium_image_url'),
    rating: Number(field(item, 'user_rating')) || 0, review: field(item, 'user_review'), url: field(item, 'link'),
  };
}).filter((review) => review.title && review.url);
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(OUTPUT_URL, `${JSON.stringify({ updatedAt: new Date().toISOString(), reviews }, null, 2)}\n`);
console.log(`Saved ${reviews.length} Goodreads reviews.`);
