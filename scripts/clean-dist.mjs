import { readdir, rm } from 'node:fs/promises';

const distUrl = new URL('../dist/', import.meta.url);
const entries = await readdir(distUrl, { withFileTypes: true });
await Promise.all(entries.map((entry) => rm(new URL(entry.name, distUrl), {
  force: true,
  recursive: entry.isDirectory(),
})));
