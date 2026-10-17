import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule }) => {
  const sprites = await loadModule('player-sprite', 'js/core/player-sprite.ts');
  assert.equal(sprites.getPlayerSpriteFrame(false, 'up', 2, 2).sourceY, 144);
  assert.equal(sprites.getPlayerSpriteFrame(true, 'down', 0, 2).sourceY, 1290);
  assert.equal(sprites.getPlayerSpriteFrame(true, 'left', 0, 2).sourceY, 486);

  const wheldon = await loadModule('wheldon-sprite', 'js/core/player-sprite-test.ts');
  const wheldonFrame = (direction, tick, ghost = false) => wheldon.getWheldonPlayerSpriteFrame(direction, (tick + 0.01) / 8, ghost);
  for (const ghost of [false, true]) {
    for (const direction of ['down', 'left', 'right', 'up']) {
      const idle = wheldon.getWheldonPlayerSpriteFrame(direction, 0, ghost);
      assert.deepEqual(wheldonFrame(direction, 0, ghost), idle, 'walking starts from the idle pose');
      assert.deepEqual(wheldonFrame(direction, 2, ghost), idle, 'opposite steps pass through the neutral pose');
      assert.notDeepEqual(wheldonFrame(direction, 1, ghost), wheldonFrame(direction, 3, ghost), 'steps alternate');
      for (let tick = 0; tick < 24; tick += 1) {
        assert.deepEqual(wheldonFrame(direction, tick, ghost), wheldonFrame(direction, tick % 4, ghost), 'Wheldon keeps a steady cycle across default frame wraps');
      }
    }
    for (const [diagonal, cardinal] of [['upLeft', 'left'], ['downLeft', 'left'], ['upRight', 'right'], ['downRight', 'right']]) {
      assert.deepEqual(wheldonFrame(diagonal, 3, ghost), wheldonFrame(cardinal, 3, ghost));
    }
  }
  assert.equal(wheldonFrame('down', 1).sourceY + wheldonFrame('down', 1).sourceHeight, 372, 'front shoes are not clipped at the old grid boundary');
  assert.equal(wheldonFrame('up', 3).sourceX, 707, 'rightmost pose is centered within its own crop');
  for (const [direction, baseline] of [['down', 368], ['left', 678], ['right', 1000], ['up', 1348]]) {
    const idle = wheldon.getWheldonPlayerSpriteFrame(direction, 0, true);
    assert.equal(idle.sourceY + idle.sourceHeight, baseline, 'ghost crops use their own measured tail baseline');
    assert.equal(idle.width, 30);
    assert.equal(idle.height, 46);
    assert.notDeepEqual(idle, wheldon.getWheldonPlayerSpriteFrame(direction, 0), 'ghost Wheldon uses separate artwork coordinates');
  }

  const ghostSprite = await loadModule('ghost-sprite', 'js/core/ghost-sprite.ts');
  const ghostSource = await loadModule('ghost-source', 'js/generated/core/ghost-sprite.generated.ts');
  assert.ok(ghostSource.GHOST_SPRITE_SOURCE.startsWith('data:image/png;base64,'), 'inline ghost images allow canvas pixel reads under file://');
  assert.deepEqual(Buffer.from(ghostSource.GHOST_SPRITE_SOURCE.split(',')[1], 'base64'), await readFile('char/player/ghost_sprite.png'), 'the inline ghost contains the original artwork');
  const assetsSource = await readFile('js/core/assets.ts', 'utf8');
  assert.match(assetsSource, /ghostSpriteSheet: GHOST_SPRITE_SOURCE/, 'the game loads the origin-clean inline ghost');
  assert.equal(ghostSprite.getGhostSpriteFrame('left', 8, 1).sourceX, 181, 'late frames use ghost spacing rather than the normal 23px grid');
  assert.equal(ghostSprite.getGhostSpriteFrame('up', 4, 1).sourceY, 139, 'back-facing poses use their measured row');
  assert.equal(ghostSprite.getGhostSpriteFrame('downLeft', 2, 1).sourceY, 245, 'diagonal poses use their own row');
  for (const direction of ['down', 'downRight', 'right', 'upRight', 'up', 'upLeft', 'left', 'downLeft']) {
    for (let frame = 0; frame < 9; frame++) {
      const crop = ghostSprite.getGhostSpriteFrame(direction, frame, 1);
      assert.ok(crop.sourceX >= 0 && crop.sourceX + crop.sourceWidth <= 209);
      assert.ok(crop.sourceY >= 0 && crop.sourceY + crop.sourceHeight <= 326);
      assert.equal(crop.width, crop.sourceWidth, 'ghost poses retain their pixel proportions');
      assert.equal(crop.height, crop.sourceHeight);
      assert.equal(crop.baselineOffset, -2, 'all ghost tails share the same ground anchor');
    }
  }
  const ghostPixels = new Uint8ClampedArray(5 * 5 * 4).fill(255);
  for (let y = 1; y < 4; y++) for (let x = 1; x < 4; x++) {
    if (x === 2 && y === 2) continue;
    for (let channel = 0; channel < 3; channel++) ghostPixels[(y * 5 + x) * 4 + channel] = 100;
  }
  const createElementBeforeGhost = document.createElement;
  let transparentGhostPixels;
  document.createElement = () => ({ getContext: () => ({
    drawImage() {},
    getImageData: () => ({ data: ghostPixels }),
    putImageData: (pixels) => { transparentGhostPixels = pixels.data; },
  }) });
  try {
    ghostSprite.getGhostSpriteSheet({ complete: true, naturalWidth: 5, naturalHeight: 5 });
    assert.equal(transparentGhostPixels[3], 0, 'the ghost background becomes transparent');
    assert.equal(transparentGhostPixels[(2 * 5 + 2) * 4 + 3], 255, 'enclosed white sprite highlights stay opaque');
    assert.equal(transparentGhostPixels[(1 * 5 + 1) * 4 + 3], 255, 'colored sprite pixels stay intact');
  } finally { document.createElement = createElementBeforeGhost; }
});
