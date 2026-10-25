import assert from 'node:assert/strict';
import { withGameTest } from './helpers.mjs';

const exports = "export * from './js/core/character-unlocks.ts'; export { setWheldonPlayerSpriteEnabled } from './js/core/player-sprite-test.ts';";
for (const [body, wheldon, expected] of [
  ['player', false, ['player']],
  ['ghost', false, ['player', 'ghost-player']],
  ['alex-s', false, ['player', 'wheldon']],
  ['ghost', true, ['player', 'ghost-wheldon']],
  ['alex-w', false, ['player', 'wheldon']],
]) await withGameTest(async ({ loadModule, values }) => {
  values.set('max-game:player-body', body);
  values.set('max-game:wheldon-player-sprite', String(wheldon));
  window.performance = { getEntriesByType: () => [{ type: 'reload' }] };
  window.history = { replaceState() {} };
  const state = await loadModule('reload-unlocks', 'js/core/player-body.ts', exports);
  assert.equal(state.getPlayerBody(), 'player', 'refresh still restores the starting player');
  assert.deepEqual(state.getUnlockedCharacters(), expected, 'only the form actually reached survives as an unlock');
});

await withGameTest(async ({ loadModule }) => {
  const state = await loadModule('body-unlocks', 'js/core/player-body.ts', exports);
  state.setPlayerBody('ghost');
  assert.deepEqual(state.getUnlockedCharacters(), ['player', 'ghost-player']);
  state.setPlayerBody('alex-s');
  assert.deepEqual(state.getUnlockedCharacters(), ['player', 'wheldon', 'ghost-player'], 'possession does not unlock Wheldon’s ghost');
  state.setWheldonPlayerSpriteEnabled(true); state.setPlayerBody('ghost');
  assert.deepEqual(state.getUnlockedCharacters(), ['player', 'wheldon', 'ghost-player', 'ghost-wheldon']);
  const restored = await loadModule('saved-unlocks', 'js/core/character-unlocks.ts');
  assert.deepEqual(restored.getUnlockedCharacters(), state.getUnlockedCharacters());
  restored.resetCharacterUnlocks();
  assert.deepEqual(restored.getUnlockedCharacters(), ['player']);
});

await withGameTest(async ({ loadModule }) => {
  const state = await loadModule('seal-unlock', 'js/core/cave-transformation.ts', "export * from './js/core/character-unlocks.ts';");
  assert.deepEqual(state.getUnlockedCharacters(), ['player']);
  state.completeCaveTransformation();
  state.resetCaveTransformation(new URL('http://localhost/?seal=1&transformed=1'));
  assert.deepEqual(state.getUnlockedCharacters(), ['player', 'seal'], 'changing form clears the cave scene without forgetting the earned seal');
});

for (const saved of ['broken', '{}', '["future-form"]']) await withGameTest(async ({ loadModule, values }) => {
  values.set('max-game:unlocked-characters', saved);
  const state = await loadModule('invalid-unlocks', 'js/core/character-unlocks.ts');
  assert.deepEqual(state.getUnlockedCharacters(), ['player']);
});

await withGameTest(async ({ loadModule, element }) => {
  const forms = ['player', 'wheldon', 'ghost-player', 'ghost-wheldon', 'seal'];
  const options = forms.map(form => { const option = element(`#form-${form}`); option.dataset.character = form; return option; });
  const menu = element('#character-menu');
  menu.querySelectorAll = () => options; menu.hidePopover = () => {};
  window.history = { replaceState() {} };
  const state = await loadModule('guarded-picker', 'js/core/character-menu.ts', "export * from './js/core/character-unlocks.ts'; export { getPlayerBody } from './js/core/player-body.ts';");
  state.setupCharacterMenu();
  for (const option of options.slice(1)) option.listeners.get('click')();
  assert.equal(state.getPlayerBody(), 'player', 'locked choices cannot activate even through a synthetic click');
  assert.deepEqual(state.getUnlockedCharacters(), ['player']);
  state.unlockCharacter('ghost-player'); options[2].listeners.get('click')();
  assert.equal(state.getPlayerBody(), 'ghost');
  assert.deepEqual(state.getUnlockedCharacters(), ['player', 'ghost-player']);
});
