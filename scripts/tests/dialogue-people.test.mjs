import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, values }) => {
  const progress = await loadModule('people', 'js/core/people-spoken-to.ts', "export { beginDialogueAudio } from './js/core/dialogue-audio.ts';");
  assert.equal(progress.getPeopleSpokenCount(), 0);
  for (const name of ['Tim', 'tim', ' TIM ']) progress.beginDialogueAudio(name);
  assert.equal(progress.getPeopleSpokenCount(), 1, 'revisiting the same person in another room counts once');
  for (const name of ['alexS', 'Alex S', 'marinaD', 'Marina D', 'Marina', 'Maddy', 'maddy']) progress.recordPersonSpokenTo(name);
  assert.equal(progress.getPeopleSpokenCount(), 5, 'aliases share a person while Marina and Marina D remain distinct');
  for (const name of [undefined, 'Minnie', 'diary', 'THE GIRLS', 'cinema-audience', 'cinema-audience-1']) progress.recordPersonSpokenTo(name);
  assert.equal(progress.getPeopleSpokenCount(), 5, 'objects, pets and the seat reserved for Tim add no phantom people');
  const restored = await loadModule('restored-people', 'js/core/people-spoken-to.ts');
  assert.equal(restored.getPeopleSpokenCount(), 5, 'progress survives navigation and reloads');
  values.set('max-game:people-spoken-to', '["tim","tim",null,"unknown"]');
  assert.equal(restored.getPeopleSpokenCount(), 1, 'duplicate and invalid saved entries do not inflate the total');
  values.set('max-game:people-spoken-to', '{broken');
  assert.equal(restored.getPeopleSpokenCount(), 0);
  restored.recordPersonSpokenTo('Noel');
  assert.equal(restored.getPeopleSpokenCount(), 1, 'a damaged save remains writable');
  values.clear();
  const characters = Object.keys(JSON.parse(await readFile('char/manifest.json', 'utf8')).characters).filter(id => id !== 'siblings');
  for (const id of [...characters, 'marina', 'charity-cook', 'charity-computer', 'charity-teacher', ...[0, 2, 3, 4, 5].map(index => `cinema-audience-${index}`)]) restored.recordPersonSpokenTo(id);
  assert.equal(restored.getPeopleSpokenCount(), characters.length + 9, 'all manifest and interior people count, including additions beyond the goal');
  assert.ok(restored.getPeopleSpokenCount() >= progress.PEOPLE_TO_MEET);
  assert.equal(progress.PEOPLE_TO_MEET, 42, 'every person can fill the requested 42-person goal');
});

await withGameTest(async ({ loadModule }) => {
  const npcs = await loadModule('world-people', 'js/overworld/npcs.ts', "export { getPeopleSpokenCount } from './js/core/people-spoken-to.ts';");
  for (const npc of [npcs.MADDY, npcs.ADAM, npcs.MADDY]) {
    npcs.updateNpcInteractions(-100, -100);
    npcs.updateNpcInteractions(npc.x, npc.y);
  }
  assert.equal(npcs.getPeopleSpokenCount(), 2, 'voiced and silent overworld conversations both count once');
});

await withGameTest(async ({ loadModule, element, values }) => {
  const { CharityDialogueController, CinemaAudienceController, getPeopleSpokenCount } = await loadModule('interior-people', 'js/interiors/charity-dialogue.ts', "export { CinemaAudienceController } from './js/interiors/cinema-audience.ts'; export { getPeopleSpokenCount } from './js/core/people-spoken-to.ts';");
  const charity = new CharityDialogueController({ dialogue: element('#dialogue'), speaker: element('#speaker'), line: element('#line'), profile: element('#profile'), progress: element('#progress'), next: element('#next') }, () => {}, () => {});
  for (const kind of ['charity-cook', 'charity-teacher', 'charity-computer', 'charity-cook']) charity.start(kind);
  assert.equal(getPeopleSpokenCount(), 3);
  values.set('max-game:tim-at-cinema', 'true');
  const cinema = new CinemaAudienceController({ openDialogue() {}, closeDialogue() {} });
  for (let visit = 0; visit < 2; visit++) for (const [x, y] of [[153, 373], [207, 375], [262, 373], [153, 440], [207, 441], [262, 440]]) {
    cinema.update(-100, -100, false);
    cinema.update(x, y, false);
  }
  assert.equal(getPeopleSpokenCount(), 9, 'the five audience members and Tim are distinct without repeat visits inflating the count');
});
