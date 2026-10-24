import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const original = 'video/film.mp4';
const recipe = 'cinema-height168-crf24-v1';
const bytes = await readFile(original);
const sourceHash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
const manifestPath = 'scripts/cinema-film.manifest.json';
if (process.argv.includes('--prepare')) {
  const version = createHash('sha256').update(bytes).update(recipe).digest('hex').slice(0, 12);
  const output = `video/film-cinema.${version}.mp4`;
  const result = spawnSync(process.env.FFMPEG_PATH ?? 'ffmpeg', ['-y', '-loglevel', 'error', '-i', original, '-vf', 'scale=-2:168:flags=lanczos', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output], { encoding: 'utf8' });
  if (result.error || result.status !== 0) throw new Error(`Cannot prepare cinema film: ${result.error ?? result.stderr}`);
  await writeFile(manifestPath, JSON.stringify({ sourceHash, recipe, output }, null, 2) + '\n');
}
const prepared = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => 'null'));
const valid = prepared?.sourceHash === sourceHash && prepared.recipe === recipe && (await stat(prepared.output).catch(() => null))?.size > 0;
const source = valid ? prepared.output : original;
await mkdir('js/generated/interiors', { recursive: true });
await writeFile('js/generated/interiors/cinema-film.generated.ts', `// Generated from the original film and its small projection copy.\nexport const CINEMA_FILM_SOURCE = ${JSON.stringify(source)};\n`);
