import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const filters = args.filter(arg => !arg.startsWith('--'));
const suites = (await readdir('scripts/tests')).filter(name => name.endsWith('.test.mjs') && (!filters.length || filters.some(filter => name.includes(filter)))).sort();
const commands = suites.map(name => [name, `scripts/tests/${name}`]);
if (!filters.length || filters.includes('content')) commands.push(['content-refresh', 'scripts/test-content-refresh.mjs']);
if (!filters.length || filters.includes('assets')) commands.push(['assets', 'scripts/check-web-performance.mjs']);
if (!commands.length) throw new Error(`No test suites match: ${filters.join(', ')}`);
if (!args.includes('--prepared')) {
  const generated = spawnSync(process.execPath, ['scripts/generate-source.mjs'], { stdio: 'inherit' });
  if (generated.status !== 0) process.exit(generated.status ?? 1);
}
let failed = 0;
for (const [name, path] of commands) {
  const result = spawnSync(process.execPath, [path], { encoding: 'utf8' });
  if (result.status === 0) {
    if (args.includes('--verbose')) console.log(`PASS ${name}`);
  } else {
    failed++;
    console.error(`FAIL ${name}\n${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`);
  }
}
console.log(`${commands.length - failed}/${commands.length} suites passed.`);
if (failed) process.exitCode = 1;
