import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

function recordAudio() {
  const instances = [], plays = [];
  globalThis.Audio = class {
    paused = true;
    currentTime = 0;
    addEventListener() {}
    removeEventListener() {}
    removeAttribute() {}
    load() {}
    pause() { this.paused = true; }
    play() { this.paused = false; plays.push(this.src); return Promise.resolve(); }
    constructor() { instances.push(this); }
  };
  return { instances, plays };
}

await withGameTest(async ({ loadModule, values, element, scheduledCallbacks }) => {
  const { instances, plays } = recordAudio();
  values.set('max-game:audio-muted', 'true');
  const getElement = document.querySelector;
  document.querySelector = selector => {
    const node = getElement(selector);
    if (node) node.classList = { toggle() {}, add() {}, remove() {} };
    return node;
  };
  element('#inventory-panel').contains = () => false;
  await loadModule('niall-fight-audio', 'js/characters/niall/niall-fight.ts');
  const next = () => element('#opening-next').listeners.get('click')();
  const action = name => element('#move-grid').listeners.get('click')({ target: { closest: () => ({ dataset: { action: name } }) } });
  const hits = () => plays.filter(source => /\/hit-\d\.mp3$/.test(source));
  const music = instances.find(audio => audio.src?.endsWith('/battle-music.mp3'));
  assert.equal(music.loop, true);
  assert.equal(music.muted, true, 'the battle honors the saved mute setting without needing an overworld mute button');
  assert.ok(plays.includes(music.src), 'music starts with the battle opening');
  next();
  for (let round = 0; round < 5; round++) {
    action('attack');
    assert.equal(hits().length, round * 2, 'announcing a move does not play its impact early');
    next(); next(); next(); next();
  }
  assert.deepEqual(hits().map(source => source.split('/').at(-1)), [...Array.from({length:9}, (_, index) => `hit-${index + 1}.mp3`), 'hit-1.mp3'], 'player and Niall attacks share the nine-clip rotation and wrap');
  action('wait'); next();
  assert.equal(hits().length, 10, 'waiting does not play an attack sound');
  next(); next(); next();
  assert.equal(hits().at(-1).split('/').at(-1), 'hit-2.mp3', 'Niall still attacks after the player waits');
  action('run');
  scheduledCallbacks.at(-1)();
  assert.equal(music.paused, true, 'battle music stops when the fight ends');
  assert.equal(instances.find(audio => /\/hit-\d\.mp3$/.test(audio.src))?.paused, false, 'the final impact can finish naturally instead of being cut off with the music');
});

await withGameTest(async ({ loadModule, element }) => {
  const { instances, plays } = recordAudio();
  element('#niall-dialogue').hidden = true;
  const niall = await loadModule('niall-caught-audio', 'js/characters/niall/niall.ts', "export { setPlayerBody } from './js/core/player-body.ts';");
  niall.updateNiallInteraction(0, niall.NIALL.x, niall.NIALL.y + 60);
  assert.equal(plays.filter(source => source?.endsWith('/caught.m4a')).length, 0, 'the first challenge does not play the pizza voice');
  element('#niall-dialogue-next').listeners.get('click')();
  niall.updateNiallInteraction(0, niall.NIALL.x, niall.NIALL.y);
  niall.updateNiallInteraction(0, niall.NIALL.x, niall.NIALL.y);
  assert.equal(plays.filter(source => source?.endsWith('/caught.m4a')).length, 1, 'the catch line plays once, not every frame');
  niall.setPlayerBody('ghost');
  niall.updateNiallInteraction(0, niall.NIALL.x, niall.NIALL.y);
  assert.equal(instances.find(audio => audio.src?.endsWith('/caught.m4a')).paused, true, 'cancelling the encounter stops its voice');
});

await withGameTest(async ({ loadModule, values }) => {
  const { plays } = recordAudio();
  values.set('max-game:niall-quest-state', 'following');
  const niall = await loadModule('niall-return-audio', 'js/characters/niall/niall.ts');
  niall.updateNiallInteraction(0, 700, 500);
  niall.updateNiallInteraction(0, 700, 500);
  niall.updateNiallInteraction(0, niall.NIALL_BUS_STOP.triggerX, niall.NIALL_BUS_STOP.triggerY);
  assert.equal(plays.filter(source => source?.endsWith('/back-to-bus.mp3')).length, 1, 'the walk-back clip starts once during the escort');
});
