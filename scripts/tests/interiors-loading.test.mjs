import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const video = { src: '', plays: 0, play() { this.plays++; return Promise.resolve(); } };
  document.createElement = () => video;
  globalThis.Image = class extends EventTarget {
    src = ''; complete = true; naturalWidth = 136;
    decode() { return Promise.resolve(); }
  };
  const frames = [];
  globalThis.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
  const { createInteriorAssets } = await loadModule('interior-assets', 'js/interiors/interior-assets.ts');
  const { getInteriorScene } = await loadModule('scenes', 'js/interiors/interior-scenes.ts');
  const { SEAL_SPRITE_SOURCE } = await loadModule('seal', 'js/generated/core/seal-sprite.generated.ts');
  assert.ok(!SEAL_SPRITE_SOURCE.startsWith('data:'), 'the optional seal sheet stays outside every JS bundle');
  const cinema = createInteriorAssets(getInteriorScene('cinema'), false, false, false);
  assert.equal(video.src, '', 'the film downloads nothing while room images are loading');
  assert.equal(video.plays, 0);
  assert.ok(cinema.requiredImages.every(image => !image.src.includes('seal-sprite')), 'ordinary players do not fetch the seal sheet');
  cinema.startDeferredAssets();
  assert.equal(video.src, '', 'the first room frame is scheduled before the film starts');
  frames.shift()();
  assert.equal(video.src, '../video/film.mp4');
  assert.equal(video.plays, 1, 'the cinema still plays its film after entry');
  const doughnuts = createInteriorAssets(getInteriorScene('feedback-center'), false, false, false);
  assert.ok(doughnuts.interior.src.endsWith('.webp'), 'doughnut shop uses its prepared browser image');
  assert.ok(cinema.cinemaNpcs.find(npc => npc.id === 'kirin').image.src.endsWith('.webp'), 'Kirin uses a smaller lossless copy');
  const charity = createInteriorAssets(getInteriorScene('job-center'), false, false, false);
  assert.equal(charity.interiorFrames[0], charity.interior, 'the first background pose shares the already loaded room image');
  assert.ok(charity.interiorFrames.slice(1).every(image => !image.src), 'later background poses stay off the entry path');
  assert.ok(charity.interiorFrames.slice(1).every(image => !charity.requiredImages.includes(image)));
  charity.startDeferredAssets(); frames.shift()();
  assert.ok(charity.interiorFrames.slice(1).every(image => image.src), 'background animation still loads after entry');
  const diary = createInteriorAssets(getInteriorScene('diary-lab-left'), false, false, false);
  const poses = diary.diaryRoomNpcs.flatMap(npc => npc.frames?.slice(1) ?? []);
  assert.ok(poses.length > 0 && poses.every(frame => !frame.image.src), 'extra cat poses do not compete with the first pose');
  diary.startDeferredAssets(); frames.shift()();
  assert.ok(poses.every(frame => frame.image.src), 'cat animation follows the first room frame');
});
