import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, element, values }) => {
  const npcs = await loadModule('npcs', 'js/overworld/npcs.ts');
  npcs.setupNpcInteractions();
  const click = selector => element(selector).listeners.get('click')();
  const next = () => click('#npc-dialogue-next');
  const leave = () => npcs.updateNpcInteractions(-100, -100);
  const approach = () => npcs.updateNpcInteractions(npcs.RUBY.x + 20, npcs.RUBY.y);
  const line = () => element('#npc-dialogue-line').textContent;

  for (const accept of [false, true]) for (const songOwned of [false, true]) {
    values.clear();
    if (songOwned) values.set('max-game:unlocked-songs', '["Moomoo"]');
    const overlayCount = element('.game-shell').children.length;
    leave(); approach();
    assert.equal(element('#npc-speaker').textContent, 'Ruby');
    assert.equal(line(), "Moo moo makes dumb videos of me that I don't enjoy.");
    assert.equal(element('#npc-dialogue-profile').hidden, true);
    assert.equal(element('#ruby-dialogue-options').hidden, true);
    assert.equal(element('#npc-dialogue-next').hidden, false);
    next();
    assert.equal(line(), 'Wanna see them?');
    assert.equal(element('#ruby-dialogue-options').hidden, false);
    assert.equal(element('#npc-dialogue-next').hidden, true);
    next();
    assert.equal(line(), 'Wanna see them?', 'advancing cannot skip the choice');
    click(accept ? '#ruby-videos-yes' : '#ruby-videos-no');
    assert.equal(element('#ruby-dialogue-options').hidden, true);
    if (!accept) {
      assert.equal(line(), "good they're dumb");
      assert.equal(element('#npc-dialogue-next').hidden, false);
      next();
    }
    assert.equal(line(), "We're going to Japan together soon. We're very excited.");
    assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs') ?? '[]'), songOwned ? ['Moomoo'] : [], 'the song waits until after the final dialogue line');
    assert.equal(element('#npc-dialogue-next').hidden, songOwned);
    if (!songOwned) {
      next();
      assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Moomoo']);
      assert.match(element('#npc-gift-confirmation').textContent, /Moomoo was added to your music playlist/);
      assert.equal(element('#npc-gift-confirmation').hidden, false);
      assert.equal(element('.game-shell').children.length, overlayCount + 1);
      assert.equal(element('.game-shell').children.at(-1).children[0].src, 'audio/music/sibling.png');
      next();
      assert.deepEqual(JSON.parse(values.get('max-game:unlocked-songs')), ['Moomoo']);
      assert.equal(element('.game-shell').children.length, overlayCount + 1, 'the song reward appears only once');
    } else {
      assert.equal(element('.game-shell').children.length, overlayCount, 'repeat conversations skip the owned song');
    }
    assert.equal(element('#npc-dialogue-next').hidden, true);
  }

  values.clear();
  leave(); approach(); next();
  click('#npc-dialogue-close');
  assert.equal(element('#ruby-dialogue-options').hidden, true);
  assert.equal(values.has('max-game:unlocked-songs'), false, 'closing before the dialogue ends does not award the song');
  leave();
  npcs.updateNpcInteractions(npcs.SAM.x, npcs.SAM.y);
  click('#ruby-videos-no');
  assert.equal(element('#npc-speaker').textContent, 'Sam');
  assert.equal(element('#npc-dialogue-profile').hidden, false);
  assert.equal(element('#ruby-dialogue-options').hidden, true);
});

await withGameTest(async ({ loadModule, element }) => {
  const plays = [];
  const audioInstances = [];
  const FakeAudio = globalThis.Audio;
  globalThis.Audio = class extends FakeAudio {
    constructor() { super(); audioInstances.push(this); }
    play() { this.paused = false; plays.push({ source: this.src?.split('?')[0], loop: this.loop }); return Promise.resolve(); }
    pause() { this.paused = true; }
  };
  const npcs = await loadModule('ruby-voice', 'js/overworld/npcs.ts');
  npcs.setupNpcInteractions();
  const voicePlays = () => plays.filter(play => play.source?.startsWith('char/ruby/'));
  const click = selector => element(selector).listeners.get('click')();
  const next = () => click('#npc-dialogue-next');
  for (let visit = 0; visit < 6; visit++) {
    const start = voicePlays().length;
    const accept = visit % 2 === 1;
    npcs.updateNpcInteractions(-100, -100);
    npcs.updateNpcInteractions(npcs.RUBY.x, npcs.RUBY.y);
    assert.equal(voicePlays().length, start + 1);
    assert.deepEqual(voicePlays().at(-1), { source: 'char/ruby/audio-1.mp3', loop: false });
    npcs.updateNpcInteractions(npcs.RUBY.x, npcs.RUBY.y);
    assert.equal(voicePlays().length, start + 1, 'staying nearby does not replay the opening');
    next();
    assert.equal(element('#npc-dialogue-line').textContent, 'Wanna see them?');
    assert.equal(voicePlays().length, start + 2);
    assert.deepEqual(voicePlays().at(-1), { source: 'char/ruby/audio-2.mp3', loop: false });
    next();
    assert.equal(voicePlays().length, start + 2, 'waiting at the choices never replays the question');
    click(accept ? '#ruby-videos-yes' : '#ruby-videos-no');
    if (!accept) {
      assert.equal(element('#npc-dialogue-line').textContent, "good they're dumb");
      assert.deepEqual(voicePlays().at(-1), { source: 'char/ruby/audio-3.mp3', loop: false });
      next();
    }
    assert.equal(element('#npc-dialogue-line').textContent, "We're going to Japan together soon. We're very excited.");
    assert.deepEqual(voicePlays().at(-1), { source: 'char/ruby/audio-4.mp3', loop: false });
    next();
    assert.deepEqual(voicePlays().slice(start).map(play => play.source),
      (accept ? [1, 2, 4] : [1, 2, 3, 4]).map(clip => `char/ruby/audio-${clip}.mp3`), 'each screen plays its clip once; rewards never replay it');
    const audio = audioInstances.find(audio => audio.src?.split('?')[0] === voicePlays().at(-1).source);
    audio.currentTime = 1;
    if (visit % 2 === 0) click('#npc-dialogue-close');
    else npcs.updateNpcInteractions(npcs.SAM.x, npcs.SAM.y);
    assert.equal(audio.paused, true, 'closing or leaving Ruby stops the voice');
    assert.equal(audio.currentTime, 0);
  }
});
