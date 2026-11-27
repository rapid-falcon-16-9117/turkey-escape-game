// Gobble Dash — the entry program (Node 22, standard library only).
// It hands the game in: copies this repository's game/ and screenshots/
// beside this file to /output and writes /output/dossier.json, the summary
// the judge reads, with the vendored make.fun library.
//
// Gobble Dash is an original 2D canvas escape game: Gobble the turkey runs
// 1000m from the farmyard through the barn to the kitchen, chased by Farmer
// Bramble, jumping fences and pumpkins, sliding under swinging carving knives
// and the oven, grabbing corn and golden feathers, and hiding in haystacks.
// Title screen, HUD (score, distance, lives, dash), caught/escaped end
// screens with restart — all of it static files, no network request.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse — more than 4
// screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of
// game files in all, or a path under game/ over 1000 bytes. game/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json.
const SCREENSHOT_LIMITS = { max: 4, max_bytes: 262144 };
const GAME_LIMITS = { max_files: 993, max_bytes: 50331648, path_max_bytes: 1000 };
const DOSSIER_TEXT_MAX_BYTES = 163840;

function fail(message) {
  throw new Error(`Gobble Dash hand-in failed: ${message}`);
}

function countGameEntries(dir, seen = { files: 0, bytes: 0 }) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isSymbolicLink()) fail(`game/ holds a symlink: ${path}`);
    if (Buffer.byteLength(path, 'utf8') > GAME_LIMITS.path_max_bytes) fail(`game/ path over 1000 bytes: ${path}`);
    if (entry.isDirectory()) {
      countGameEntries(path, seen);
    } else if (entry.isFile()) {
      seen.files += 1;
      seen.bytes += statSync(path).size;
    }
  }
  return seen;
}

function readImageDimensions(path) {
  // Reads width/height from a PNG IHDR or a JPEG SOF marker, no dependencies.
  const bytes = readFileSync(path);
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

function checkScreenshots(dir) {
  if (!existsSync(dir)) fail('screenshots/ is missing');
  const names = readdirSync(dir).filter((name) => !name.startsWith('.'));
  if (names.length < 3 || names.length > SCREENSHOT_LIMITS.max) {
    fail(`screenshots/ holds ${names.length} images, need 3 or 4`);
  }
  for (const name of names) {
    const path = join(dir, name);
    const size = statSync(path).size;
    if (size > SCREENSHOT_LIMITS.max_bytes) fail(`screenshot over 256 KiB: ${name}`);
    if (!/^[A-Za-z0-9._-]+$/.test(name)) fail(`screenshot name not allowed: ${name}`);
    const dimensions = readImageDimensions(path);
    if (!dimensions) fail(`screenshot is not a whole PNG or JPEG: ${name}`);
    const longSide = Math.max(dimensions.width, dimensions.height);
    const shortSide = Math.min(dimensions.width, dimensions.height);
    if (longSide > 1280) fail(`screenshot long side over 1280px: ${name} (${dimensions.width}x${dimensions.height})`);
    if (shortSide < 480) fail(`screenshot short side under 480px: ${name} (${dimensions.width}x${dimensions.height})`);
  }
  return names;
}

mkdirSync(out, { recursive: true });

const gameTotals = countGameEntries(join(here, 'game'));
if (gameTotals.files > GAME_LIMITS.max_files) fail(`game/ holds ${gameTotals.files} files, cap is 993`);
if (gameTotals.bytes > GAME_LIMITS.max_bytes) fail(`game/ is ${gameTotals.bytes} bytes, cap is 48 MiB`);
const screenshotNames = checkScreenshots(join(here, 'screenshots'));

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: SCREENSHOT_LIMITS,
    game_max_files: GAME_LIMITS.max_files,
    game_max_bytes: GAME_LIMITS.max_bytes,
    game_path_max_bytes: GAME_LIMITS.path_max_bytes,
  }),
);

console.log(
  `Gobble Dash handed in: ${gameTotals.files} game files (${gameTotals.bytes} bytes), `
  + `${screenshotNames.length} screenshots (${screenshotNames.join(', ')}), dossier written to ${join(out, 'dossier.json')}.`,
);
