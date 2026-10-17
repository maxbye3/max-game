import { spawnSync } from 'node:child_process';

// Invoke underlying checks directly: generation runs once, without nested npm lifecycle hooks.
const commands = [
  ['scripts/generate-source.mjs'],
  ['node_modules/typescript/bin/tsc', '--noEmit'],
  ['scripts/check-dialogues.mjs'],
  ['scripts/run-tests.mjs', '--prepared'],
  ['scripts/bundle.mjs'],
];
if (process.argv.includes('--site')) commands.push(['scripts/package-site.mjs']);
for (const args of commands) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
