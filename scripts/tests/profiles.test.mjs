import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { withGameTest } from './helpers.mjs';

await withGameTest(async ({ loadModule, element }) => {
  const { PROFILE_IMAGE_SOURCES } = await loadModule('profiles', 'js/generated/core/profile-images.generated.ts');
  const manifest = JSON.parse(await readFile('char/manifest.json', 'utf8'));
  let present = 0, absent = 0;
  for (const [id, character] of Object.entries(manifest.characters)) {
    const root = `char/${character.directory}/`;
    const files = (await readdir(root)).filter(name => /^profile\.(png|jpe?g)$/.test(name));
    const portrait = PROFILE_IMAGE_SOURCES[id];
    if (files.length) {
      assert.ok(portrait?.startsWith(root), `${id} uses its own root folder`);
      assert.ok(files.includes(portrait.slice(root.length)), `${id} uses an actual root profile`);
      present++;
    } else {
      assert.equal(portrait, undefined, `${id} intentionally has no portrait`);
      absent++;
    }
  }
  const { setSiblingProfileImage, setProfileImage } = await loadModule('profile-images', 'js/core/profile-images.ts');
  const image = element('portrait');
  for (const speaker of ['Maddy', 'Marina']) {
    setSiblingProfileImage(image, speaker, '../');
    assert.equal(image.src, `../char/siblings/${speaker.toLowerCase()}.jpg`);
    assert.equal(image.hidden, false);
  }
  setProfileImage(image, 'Marina D', '../');
  assert.equal(image.src, '../char/marina-d/profile.png', 'Marina D keeps her own portrait');
  setProfileImage(image, 'Rei', '../');
  assert.equal(image.hidden, true, 'characters without root profiles remain portrait-free');
  assert.equal(image.src, '');
  assert.ok(present > 0 && absent > 0, 'both intentional portrait cases are covered');
  for (const source of Object.values(PROFILE_IMAGE_SOURCES)) assert.match(source, /^char\/[^/]+\/profile\.(png|jpe?g)$/);
});
