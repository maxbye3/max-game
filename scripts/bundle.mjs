import { build, context } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { watch as watchFiles } from 'node:fs';
import { entryPoints } from './lib/entries.mjs';

const watch = process.argv.includes('--watch');
const result = spawnSync(process.execPath, ['scripts/clean-dist.mjs'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
const options = { entryPoints, bundle: true, minify: !watch, outdir: 'dist', entryNames: '[name]-bundle', format: 'iife' };
if (watch) {
  const stamp = () => spawnSync(process.execPath, ['scripts/stamp-web-entrypoints.mjs'], { stdio: 'inherit' });
  const bundler = await context({ ...options, plugins: [{ name: 'stamp-entrypoints', setup(builder) { builder.onEnd(result => { if (!result.errors.length) stamp(); }); } }] });
  await bundler.watch();
  let timer;
  watchFiles('css', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const generated = spawnSync(process.execPath, ['scripts/generate-source.mjs', 'styles'], { stdio: 'inherit' });
      if (generated.status === 0) stamp();
    }, 75);
  });
  console.log('Watching all four game entry points and CSS sources.');
} else {
  await build(options);
  const stamped = spawnSync(process.execPath, ['scripts/stamp-web-entrypoints.mjs'], { stdio: 'inherit' });
  if (stamped.status !== 0) process.exit(stamped.status ?? 1);
  console.log('Bundled all four game entry points.');
}
