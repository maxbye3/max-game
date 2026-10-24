import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

async function audioFixture(run) {
  await withGameTest(async fixture => {
    const { values, element } = fixture;
    values.set('max-game:audio-muted', 'true');
    const events = new Map(), tracks = [];
    window.addEventListener = (name, callback) => { if (!events.has(name)) events.set(name, []); events.get(name).push(callback); };
    window.dispatchEvent = event => { events.get(event.type)?.forEach(callback => callback(event)); return true; };
    const documents = new Map(); document.addEventListener = (name, callback) => { if (!documents.has(name)) documents.set(name, []); documents.get(name).push(callback); };
    element('#audio-mute-toggle').querySelector = () => null;
    globalThis.Audio = class {
      src = ''; preload = ''; loop = false; muted = false; paused = true; currentTime = 0; plays = 0; loads = 0; duration = 1; events = new Map();
      constructor() { tracks.push(this); }
      addEventListener(name, callback) { this.events.set(name, callback); }
      removeEventListener(name) { this.events.delete(name); }
      play() { this.plays++; this.paused = false; this.events.get('play')?.(); return Promise.resolve(); }
      pause() { this.paused = true; }
      load() { this.loads++; }
      removeAttribute() { this.src = ''; }
    };
    const audio = await fixture.loadModule('mute', 'js/core/audio-mute.ts');
    audio.setupAudioMute();
    const toggle = () => element('#audio-mute-toggle').listeners.get('click')();
    await run({ ...fixture, tracks, toggle, documents });
  });
}

for (const door of ['gym', 'job-center', 'music-shop', 'cinema']) {
  await audioFixture(async ({ loadModule, tracks, toggle }) => {
    // Export the shared mute module from the same bundle so its state matches.
    const module = await loadModule('room-ambience', 'js/interiors/plant-room-ambience.ts', "export { setupAudioMute as bindMute } from './js/core/audio-mute.ts';");
    module.bindMute();
    module.setupInteriorAmbience(door);
    const music = tracks.filter(track => track.loop && track.src);
    assert.ok(music.length > 0);
    assert.ok(music.every(track => track.plays === 0), `${door} does not start music while muted`);
    toggle();
    assert.ok(music.every(track => track.plays === 1 && !track.paused), 'unmute starts room music immediately');
    music.forEach(track => { track.currentTime = 9; });
    toggle();
    assert.ok(music.every(track => track.paused && track.currentTime === 9), 'muting pauses without losing the playback position');
    toggle();
    assert.ok(music.every(track => track.plays === 2 && track.currentTime === 9));
  });
}

await audioFixture(async ({ loadModule, tracks, toggle }) => {
  const module = await loadModule('world-ambience', 'js/core/nightclub-audio.ts', "export { setupAudioMute as bindMute } from './js/core/audio-mute.ts';");
  module.bindMute();
  module.updateBuildingAmbience(1039, 533);
  assert.ok(tracks.every(track => track.plays === 0));
  toggle(); await new Promise(setImmediate);
  const gym = tracks.find(track => track.src.endsWith('audio/map/gym.mp3'));
  assert.equal(gym.plays, 1, 'unmuting works even when the Options menu has paused world updates');
  gym.currentTime = 12; toggle();
  assert.equal(gym.paused, true); assert.equal(gym.currentTime, 12);
  toggle(); await new Promise(setImmediate);
  assert.equal(gym.plays, 2);
});

for (const muted of [true, false]) {
  await audioFixture(async ({ loadModule, tracks, values }) => {
    values.set('max-game:audio-muted', String(muted));
    const { SNOWMAN, playerCollidesWithSnowman, isSnowmanFallen } = await loadModule('snowman', 'js/overworld/snowman.ts');
    const sound = tracks.at(-1);
    assert.equal(sound.preload, 'none', 'the snowman sound stays out of initial loading');
    assert.equal(playerCollidesWithSnowman(0, 0), false);
    assert.equal(sound.loads, 0);
    assert.equal(playerCollidesWithSnowman(SNOWMAN.x + 100, SNOWMAN.y), false);
    assert.equal(sound.loads, muted ? 0 : 1, 'only an audible nearby interaction warms its sound');
    assert.equal(playerCollidesWithSnowman(SNOWMAN.x, SNOWMAN.y), true);
    assert.equal(isSnowmanFallen(), true, 'muting never prevents the gameplay event');
    assert.equal(sound.plays, muted ? 0 : 1);
  });
}

await audioFixture(async ({ loadModule, tracks }) => {
  let finished = false;
  const { playAlexVoice } = await loadModule('story-voice', 'js/core/alex-w-voice.ts');
  playAlexVoice('dialogue.m4a', () => { finished = true; });
  const voice = tracks.at(-1);
  assert.equal(voice.muted, true); assert.equal(voice.plays, 1, 'muted dialogue still advances its timing');
  voice.events.get('ended')();
  assert.equal(finished, true);
});
