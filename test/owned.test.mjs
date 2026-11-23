// Owned cards live only on the server. Nothing the site serves may name them or carry their art.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const ignore = readFileSync(join(ROOT, '.vercelignore'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const hidden = (rel) => rel.startsWith('.') || rel.split('/')[0] === 'node_modules' || ignore.some(p => {
  const q = p.replace(/^\//, '').replace(/\/$/, '');
  if (q.startsWith('!')) return false;
  if (q.startsWith('*.')) return rel.endsWith(q.slice(1)) && !rel.startsWith('js/');
  return rel === q || rel.startsWith(q + '/');
});
function served(dir = '') {
  const out = [];
  for (const n of readdirSync(join(ROOT, dir))) {
    const rel = dir ? dir + '/' + n : n;
    if (hidden(rel)) continue;
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...served(rel)); else out.push(rel);
  }
  return out;
}

test('no served file names or carries an owned card', () => {
  const words = /poppy|bubblegum goth|sweetheart requiem|heartlock|heartbuckle/i;
  const files = served();
  assert.ok(files.includes('index.html') && files.includes('js/play.js'));
  for (const f of files) {
    assert.ok(!words.test(f), 'file name ' + f);
    if (/\.(html|js|json|txt|xml|css|webmanifest|md)$/.test(f)) assert.ok(!words.test(readFileSync(join(ROOT, f), 'utf8')), 'text in ' + f);
  }
});
