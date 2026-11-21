import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const BANNED = [
  'embark',
  'tapestry',
  'delve',
  'realm of',
  'unleash',
  'journey awaits',
  'in a world where',
  'epic adventure',
  'immerse',
  '\u2014',
  '\u2013',
];

async function files(dir) {
  const found = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await files(full)));
    else if (/\.(jsx|js|css|html)$/.test(entry.name)) found.push(full);
  }
  return found;
}

test('page copy stays in a human voice', async () => {
  const paths = [await files('src'), await files('api'), ['index.html']].flat();
  const hits = [];
  for (const file of paths) {
    const text = (await readFile(file, 'utf8')).toLowerCase();
    for (const phrase of BANNED) {
      if (text.includes(phrase)) hits.push(`${file}: ${phrase}`);
    }
  }
  assert.deepEqual(hits, []);
});
