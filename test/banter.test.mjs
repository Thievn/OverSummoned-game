// City banner chats: only pairs the player has collected, never owner-only heroes, stored ahead of time.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
const URL = process.env.PGURL;
const skip = !URL && 'set PGURL to a local test database';
const R = new globalThis.URL('..', import.meta.url).pathname;
const psql = (sql) => execFileSync('psql', [URL, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], {stdio: ['ignore', 'pipe', 'pipe']}).toString().trim();
function as(u, sql) {
  const pre = `select set_config('request.jwt.claim.sub', '${u.uid}', false), set_config('request.jwt.claims', '${JSON.stringify({email: u.email, sub: u.uid})}', false) \\g /dev/null\n`;
  return execFileSync('psql', [URL, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1'], {input: pre + sql + '\n', stdio: ['pipe', 'pipe', 'pipe']}).toString().trim();
}
function player() {
  const uid = randomUUID(), email = `b${uid.slice(0, 8)}@example.com`;
  psql(`insert into auth.users(id, email) values ('${uid}', '${email}'); insert into den_allow(email, is_admin) values ('${email}', false)`);
  const u = {uid, email}; as(u, 'select os_state() \\g /dev/null'); return u;
}

test('chats only use heroes the player has', {skip}, () => {
  const u = player();
  const owned = new Set(psql(`select hero_id from os_hero where uid = '${u.uid}'`).split('\n').filter(Boolean));
  let rows = JSON.parse(as(u, 'select os_banter()').split('\n').pop());
  for (const r of rows) assert.ok(owned.has(r.a) && owned.has(r.b), `${r.a}/${r.b}`);
  psql(`insert into os_hero(uid, hero_id, level, dupes) values ('${u.uid}', 'gangster', 1, 0), ('${u.uid}', 'paramedic', 1, 0) on conflict do nothing`);
  rows = JSON.parse(as(u, 'select os_banter()').split('\n').pop());
  assert.ok(rows.length > 0, 'a starter squad plus two more has something to say');
  for (const r of rows) { assert.ok(r.lines.length >= 2 && r.lines.length <= 4); for (const l of r.lines) assert.ok([r.a, r.b].includes(l.who) && l.text.length <= 60); }
});

test('the table is closed to direct reads and the function needs a signed-in player', {skip}, () => {
  assert.equal(psql(`select has_table_privilege('authenticated', 'public.os_banter', 'select')`), 'f');
  assert.equal(psql(`select has_function_privilege('anon', 'public.os_banter()', 'execute')`), 'f');
});

test('the written chats stay in the game and leave out owner-only heroes', () => {
  const sql = readFileSync(R + 'supabase/migrations/20261128090000_os_banter.sql', 'utf8');
  assert.ok(!/poppy/i.test(sql));
  assert.ok(!/\b(app|server|download|internet|computer|money|price|admin)\b/i.test(sql.split('insert into public.os_banter')[1]));
  for (const f of ['aldermere', 'office_worker', 'delivery_rider', 'legionary', 'engineer', 'gangster', 'paramedic', 'plague_doctor', 'hunter', 'will_slapton']) assert.ok(existsSync(R + `assets/city/${f}.png`), f);
  for (const h of ['office_worker', 'delivery_rider', 'paramedic', 'hunter', 'legionary', 'engineer', 'plague_doctor', 'gangster', 'will_slapton']) assert.ok(existsSync(R + `assets/walk/${h}.png`), h);
});
