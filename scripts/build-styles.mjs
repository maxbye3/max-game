import { readFile, writeFile } from 'node:fs/promises';

// Concatenate our ordered imports without rewriting asset URLs or the cascade.
const entry = await readFile('css/game.css', 'utf8');
const imports = [...entry.matchAll(/^@import "\.\/([^"\n]+\.css)";$/gm)];
if (!imports.length) throw new Error('css/game.css must list the game stylesheets.');
const sources = await Promise.all(imports.map(([, name]) => readFile(`css/${name}`, 'utf8')));
const stylesheet = '/* Generated from css/game.css. Do not edit; run npm run bundle. */\n' + sources.join('\n');
if (stylesheet !== await readFile('style.css', 'utf8').catch(() => '')) await writeFile('style.css', stylesheet);
