// Renders the Groove share loop (lib/share-video.ts) to silent H.264 MP4s in public/share/.
// Like scripts/share-card.html, run it on macOS so the wordmark uses Helvetica Neue.
// Needs the Playwright Chromium shell and ffmpeg/ffprobe on PATH; neither ships with the site.
//   node scripts/export-share-video.mjs [landing|backstage|investors ...]
// Frames, versions and hashes are kept in ignored artifacts/share-video/ for review.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { shareVideo, shareVideoFrames, shareVideoPaths, shareVideoTargets } from '../lib/share-video.ts';

const root = new URL('../', import.meta.url);
const work = new URL('artifacts/share-video/', root);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

// Failures throw so the browser is always closed by main's finally.
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.error) throw new Error(`${command} is required: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr}`);
  return result.stdout;
}

// The renderer has no imports, so its stripped source is a complete browser module.
const origin = 'https://share-export.invalid';
const page = `<!doctype html><meta charset="utf-8"><body style="margin:0">
<canvas width="${shareVideo.width}" height="${shareVideo.height}"></canvas>
<script type="module">
import { drawGrooveCard } from '/share-video.js';
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
await document.fonts.load('400 156px "Helvetica Neue"');
window.renderFrame = (target, time) => { drawGrooveCard(ctx, target, time); return canvas.toDataURL('image/png'); };
</script>`;

async function renderFrames(tab, target, pageErrors) {
  const frames = new URL(`${target}/`, work);
  rmSync(frames, { recursive: true, force: true });
  mkdirSync(frames, { recursive: true });
  const hashes = [];
  // Frames 0..179 cover [0, 6) s; frame 180 would repeat frame 0, so the loop is seamless.
  for (let index = 0; index < shareVideoFrames; index++) {
    const url = await tab.evaluate(([name, time]) => window.renderFrame(name, time), [target, index / shareVideo.fps]);
    if (pageErrors.length) throw new Error(`Renderer error: ${pageErrors[0]}`);
    const png = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    writeFileSync(new URL(`frame-${String(index).padStart(4, '0')}.png`, frames), png);
    hashes.push(sha256(png));
  }
  return { frames, hashes };
}

// Encodes into artifacts/ and only replaces public/share/ once ffprobe accepts the file.
function encode(target, frames) {
  const candidate = fileURLToPath(new URL(`${target}.mp4`, work));
  // Single-threaded x264 with bitexact flags keeps the encode reproducible for a given
  // ffmpeg build. BT.709 tagging keeps the near-black and mint stable across players.
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-framerate', String(shareVideo.fps), '-i', join(fileURLToPath(frames), 'frame-%04d.png'),
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-tune', 'animation',
    '-profile:v', 'high', '-level:v', '4.0', '-g', String(shareVideo.fps * 2), '-threads', '1',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:v', '+bitexact',
    candidate]);

  const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', candidate]));
  const [stream, ...extra] = probe.streams;
  const checks = {
    'one video stream, no audio': extra.length === 0 && stream?.codec_type === 'video',
    'codec h264': stream?.codec_name === 'h264',
    'pixel format yuv420p': stream?.pix_fmt === 'yuv420p',
    [`size ${shareVideo.width}x${shareVideo.height}`]: stream?.width === shareVideo.width && stream?.height === shareVideo.height,
    [`${shareVideo.fps} fps`]: stream?.avg_frame_rate === `${shareVideo.fps}/1`,
    [`${shareVideoFrames} frames`]: Number(stream?.nb_read_frames) === shareVideoFrames,
    [`duration ${shareVideo.seconds} s`]: Math.abs(Number(probe.format?.duration) - shareVideo.seconds) < .05,
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  if (failed.length) throw new Error(`${shareVideoPaths[target]} failed: ${failed.join(', ')}`);

  const output = fileURLToPath(new URL(`public${shareVideoPaths[target]}`, root));
  copyFileSync(candidate, output);
  return readFileSync(output);
}

async function main() {
  const requested = process.argv.slice(2);
  const unknown = requested.filter(target => !shareVideoTargets.includes(target));
  if (unknown.length) throw new Error(`Unknown target: ${unknown.join(', ')}`);
  if (process.platform !== 'darwin') throw new Error('Export on macOS so the wordmark renders in Helvetica Neue.');
  const targets = requested.length ? requested : [...shareVideoTargets];
  // Tool checks run before the browser starts, so a missing ffmpeg leaves nothing behind.
  const ffmpeg = run('ffmpeg', ['-hide_banner', '-version']).split('\n')[0];
  run('ffprobe', ['-hide_banner', '-version']);
  const rendererSource = stripTypeScriptTypes(readFileSync(new URL('lib/share-video.ts', root), 'utf8'));
  mkdirSync(work, { recursive: true });

  const browser = await chromium.launch();
  try {
    const manifest = { generatedBy: 'scripts/export-share-video.mjs', chromium: browser.version(), ffmpeg, videos: {} };
    const context = await browser.newContext({ viewport: { width: shareVideo.width, height: shareVideo.height }, deviceScaleFactor: 1 });
    await context.route(`${origin}/**`, route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/share-video.js') return route.fulfill({ contentType: 'text/javascript', body: rendererSource });
      return route.fulfill({ contentType: 'text/html', body: page });
    });
    const tab = await context.newPage();
    const pageErrors = [];
    tab.on('pageerror', error => pageErrors.push(error.message));
    await tab.goto(`${origin}/`);
    await tab.waitForFunction(() => typeof window.renderFrame === 'function', undefined, { timeout: 15_000 });
    if (pageErrors.length) throw new Error(`Renderer error: ${pageErrors[0]}`);

    for (const target of targets) {
      const { frames, hashes } = await renderFrames(tab, target, pageErrors);
      const bytes = encode(target, frames);
      manifest.videos[target] = { path: shareVideoPaths[target], bytes: bytes.length, sha256: sha256(bytes),
        frames: { first: hashes[0], middle: hashes[shareVideoFrames / 2], last: hashes.at(-1) } };
      console.log(`${shareVideoPaths[target]}  ${(bytes.length / 1024).toFixed(0)} KiB  ${manifest.videos[target].sha256}`);
    }
    writeFileSync(new URL('manifest.json', work), `${JSON.stringify(manifest, null, 2)}\n`);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
