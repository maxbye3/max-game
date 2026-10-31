import assert from 'node:assert/strict';
import { legacyProjects, redirectLegacyProject } from '../../legacy-projects.mjs';

assert.equal(new Set(legacyProjects).size, legacyProjects.length);
for (const project of legacyProjects) {
  for (const suffix of ['', '/', '/nested/page.html']) {
    const pathname = `/${project}${suffix}`;
    let target;
    redirectLegacyProject({ pathname, search: '?name=a%26b', hash: '#chapter-2', replace: url => { target = url; } });
    assert.equal(target, `https://maxbye3.github.io${pathname}?name=a%26b#chapter-2`);
  }
}
for (const pathname of ['/', '/internal/', '/stealth-game/', '/zen-garden/', '/japanese/gettysburg/', '/mrMoonhead/', '/africa-other/', '//evil.example/']) {
  redirectLegacyProject({ pathname, search: '', hash: '', replace: () => assert.fail(`Unexpected redirect: ${pathname}`) });
}
