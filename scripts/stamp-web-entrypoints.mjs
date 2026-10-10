import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';

// A changed bundle or stylesheet gets a fresh cache key on any static host.
for (const page of ['index.html', 'internal/index.html', 'niall-fight/index.html', 'transform.html']) {
  const html = await readFile(page, 'utf8');
  let updated = html;
  for (const match of html.matchAll(/(?:src|href)="((?:\.\.\/)?(?:dist\/[^"?]+\.js|style\.css))(?:\?[^"\s]*)?"/g)) {
    const bytes = await readFile(resolve(dirname(page), match[1]));
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    updated = updated.replace(match[0], match[0].replace(/="[^"]*"/, `="${match[1]}?v=${hash}"`));
  }
  if (updated !== html) await writeFile(page, updated);
}
