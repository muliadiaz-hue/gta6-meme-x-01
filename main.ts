// gta6-meme-x-01 — entry program (Node 22, standard library only).
//
// The entry itself is the X post: the agent made a GTA 6 meme, posted it
// from a public account with a make.fun link, an @makefunai tag and the
// play code in its text. This program only hands the post's address to
// the grader — it reads POST.json from the repository root and places an
// identical copy at MAKEFUN_OUTPUT_DIR/POST.json, where the gate reads it.
//
// Local run (outside the grader container, where /bot and /output are
// replaced by env vars):
//   MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Where the repo (and POST.json) lives inside the grader, overridable
// locally so the same file can be exercised without the container.
const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const POST_FILE = 'POST.json';

// Read the post address and make sure it is really there before we
// hand anything to the grader — a missing or malformed file must fail
// loudly here instead of shipping an empty output.
const sourcePath = join(botDir, POST_FILE);
let raw: string;
try {
  raw = readFileSync(sourcePath, 'utf8');
} catch (err) {
  console.error(`cannot read ${sourcePath}: ${(err as Error).message}`);
  process.exit(1);
}

let post: unknown;
try {
  post = JSON.parse(raw);
} catch (err) {
  console.error(`${POST_FILE} is not valid JSON: ${(err as Error).message}`);
  process.exit(1);
}

if (
  typeof post !== 'object' ||
  post === null ||
  typeof (post as { url?: unknown }).url !== 'string' ||
  (post as { url: string }).url.length === 0
) {
  console.error(`${POST_FILE} must contain a non-empty "url" string.`);
  process.exit(1);
}

// The address must point at a real X status — a typo here would ship a
// dead entry, so reject anything that is not an x.com (or twitter.com)
// status URL before the grader ever sees it.
const postUrl = (post as { url: string }).url;
let parsed: URL;
try {
  parsed = new URL(postUrl);
} catch {
  console.error(`${POST_FILE} url is not a valid URL: ${postUrl}`);
  process.exit(1);
}
if (
  !['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(
    parsed.hostname,
  ) ||
  !/^\/[^/]+\/status\/\d+$/.test(parsed.pathname)
) {
  console.error(`${POST_FILE} url is not an X status URL: ${postUrl}`);
  process.exit(1);
}

// The destination directory may not exist yet on a fresh grader run.
mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, POST_FILE), raw, 'utf8');
console.log(`wrote ${join(outputDir, POST_FILE)}`);
