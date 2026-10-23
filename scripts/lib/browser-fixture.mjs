import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { build } from 'esbuild';

export async function serveGame() {
  const root = process.cwd();
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4' };
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      let path = resolve(root, '.' + decodeURIComponent(url.pathname));
      if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
      if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
      const info = await stat(path);
      response.writeHead(200, { 'content-type': mime[extname(path)] ?? 'application/octet-stream', 'content-length': info.size });
      createReadStream(path).pipe(response);
    } catch (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 500).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); } };
}

/** Append test hooks to the actual entry source; hooks never enter production bundles. */
export async function buildBrowserFixture(interior, directory) {
  const entry = interior ? 'js/interiors/internal.ts' : 'js/core/main.ts';
  const hook = interior
    ? `window.__gameTest = { isHeld: direction => input.isHeld(direction), openNpc: kind => { closeNoelDialogue(); nearbyInteraction = kind; activateNearbyInteraction(); } };`
    : `import { isHeld } from './input.js'; import { NPCS } from '../overworld/npc-definitions.js'; import { SIGNS } from './signs.js';
       import { DOORWAYS } from './doors.js';
       import { isGymTimCutsceneBlockingPlayer, getGymTimCutsceneDialogue } from '../interiors/gym-tim-cutscene.js';
       import { isTimAtMusicShop, isTimAtCinema } from '../characters/tim/tim-location.js';
       import { openAlexResurrectionChoice } from '../powers/alex-s/alex-s-power-ui.js';
       import { drawMapCharacters, mapCharacters } from '../overworld/map-characters.js';
       window.__gameTest = { isHeld, signIds: SIGNS.map(sign => sign.id),
         doors: DOORWAYS,
         moveToNpc: id => { const npc = NPCS.find(npc => npc.id === id); const position = npc.getPosition?.() ?? npc; player.x = position.x; player.y = position.y; },
         timScene: () => ({ blocking: isGymTimCutsceneBlockingPlayer(), dialogue: getGymTimCutsceneDialogue(), atMusicShop: isTimAtMusicShop(), atCinema: isTimAtCinema() }),
         mapNpcPixels: id => {
           const character = mapCharacters.find(character => character.id === id);
           if (!character?.sprite) return null;
           const canvas = document.createElement('canvas');
           canvas.width = character.sprite.width; canvas.height = character.height;
           const context = canvas.getContext('2d');
           drawMapCharacters(context, character.x - canvas.width / 2, character.y - canvas.height, npc => npc.id === id);
           return { width: canvas.width, height: canvas.height, pixels: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data) };
         },
         prepareResurrectionDialogues: () => { openAlexResurrectionChoice(() => {}); document.querySelector('.alex-resurrection-choice').hidden = true; },
         openSign: id => { updateSigns(-100, -100); const sign = SIGNS.find(sign => sign.id === id); updateSigns(sign.x + sign.width / 2, sign.y + sign.height); },
         openNpc: id => { const npc = NPCS.find(npc => npc.id === id); updateNpcInteractions(-100, -100); const position = npc.getPosition?.() ?? npc; updateNpcInteractions(position.x, position.y); } };`;
  const outfile = join(directory, interior ? 'interior.js' : 'main.js');
  await build({ stdin: { contents: await readFile(entry, 'utf8') + '\n' + hook, resolveDir: resolve(entry, '..'), loader: 'ts' }, bundle: true, format: 'iife', outfile });
  return outfile;
}
