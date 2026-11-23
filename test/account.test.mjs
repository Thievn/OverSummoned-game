// Account area on the server: name checks, name change rules, profile pictures and settings.
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
const j = (u, sql) => JSON.parse(as(u, sql).split('\n').pop());
function fails(u, sql, re) { try { as(u, sql); } catch (e) { assert.match(String(e.stderr), re); return; } assert.fail('expected ' + re); }
function player() {
  const uid = randomUUID(), email = `a${uid.slice(0, 8)}@example.com`;
  psql(`insert into auth.users(id, email) values ('${uid}', '${email}'); insert into den_allow(email, is_admin) values ('${email}', false)`);
  const u = {uid, email}; as(u, 'select os_state() \\g /dev/null'); return u;
}
const tag = () => 'N' + randomUUID().slice(0, 6);

test('name check explains every outcome', {skip}, () => {
  const a = player(), b = player();
  const bName = psql(`select name from os_player where uid = '${b.uid}'`);
  const why = (n) => j(a, `select os_name_check('${n}')`);
  assert.equal(why('ab').why, 'short');
  assert.equal(why('x'.repeat(17)).why, 'long');
  assert.equal(why('bad!name').why, 'chars');
  assert.equal(why('two  spaces').why, 'chars');
  assert.equal(why(bName.toUpperCase()).why, 'taken');
  assert.equal(why('Admin').why, 'taken');
  assert.equal(why(tag()).ok, true);
  psql(`insert into blocked_terms(term) values ('meanword') on conflict do nothing`);
  assert.equal(why('xmeanwordx').why, 'blocked');
});

test('a name change sticks, blocks duplicates and waits a week before the next one', {skip}, () => {
  const a = player(), b = player();
  const n = tag();
  const st = j(a, `select os_set_name('${n}')`);
  assert.equal(st.player.name, n);
  fails(b, `select os_set_name('${n.toLowerCase()}')`, /taken/);
  fails(a, `select os_set_name('${tag()}')`, /again on/);
  psql(`update os_player set name_changed_at = now() - interval '8 days' where uid = '${a.uid}'`);
  const n2 = tag(); assert.equal(j(a, `select os_set_name('${n2}')`).player.name, n2);
});

test('profile pictures only come from cards you own', {skip}, () => {
  const a = player();
  const st = j(a, `select os_set_avatar('office_worker')`);
  assert.equal(st.player.avatar, 'office_worker');
  fails(a, `select os_set_avatar('will_slapton')`, /Collect that card first/);
  fails(a, `select os_set_avatar('poppy_rose')`, /Collect that card first/);
  assert.equal(j(a, `select os_set_avatar('')`).player.avatar, null);
});

test('settings keep only known keys and values', {skip}, () => {
  const a = player();
  const s = j(a, `select os_save_settings('{"motion":"reduced","updates":false,"install":true,"evil":"x","motion2":1}'::jsonb)`);
  assert.deepEqual(s, {motion: 'reduced', updates: false, install: true});
  assert.deepEqual(j(a, `select os_save_settings('{"motion":"wild"}'::jsonb)`), s);
});

test('every shared hero has a profile picture file', () => {
  for (const id of ['delivery_rider', 'engineer', 'gangster', 'hunter', 'legionary', 'office_worker', 'paramedic', 'plague_doctor', 'will_slapton'])
    assert.ok(existsSync(R + 'assets/avatar/' + id + '.png'), id);
  assert.ok(!existsSync(R + 'assets/avatar/poppy_rose.png'));
});
