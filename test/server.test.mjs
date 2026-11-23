// Server rules, run against a local copy of the database (never the live one).
// PGURL="host=/tmp/pgx port=5499 user=postgres dbname=t" node --test test/server.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { NODES, levelFromXp, HEROES } from '../js/catalog.js';

const URL = process.env.PGURL;
const skip = !URL && 'set PGURL to a local test database';

function psql(sql) {
  return execFileSync('psql', [URL, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], {stdio: ['ignore', 'pipe', 'pipe']}).toString().trim();
}
function as(user, sql) {
  const pre = `select set_config('request.jwt.claim.sub', '${user.uid}', false), set_config('request.jwt.claims', '${JSON.stringify({email: user.email, sub: user.uid})}', false) \\g /dev/null\n`;
  const out = execFileSync('psql', [URL, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1'], {input: pre + sql + '\n', stdio: ['pipe', 'pipe', 'pipe']}).toString().trim();
  return out;
}
function asJson(user, sql) { const o = as(user, sql); return JSON.parse(o.split('\n').pop()); }
function fails(user, sql, re) {
  try { as(user, sql); } catch (e) { assert.match(String(e.stderr), re); return; }
  assert.fail('expected an error matching ' + re);
}
function newPlayer(opts = {}) {
  const uid = randomUUID(), email = `t${uid.slice(0, 8)}@example.com`;
  psql(`insert into auth.users(id, email) values ('${uid}', '${email}'); insert into den_allow(email, is_admin) values ('${email}', ${opts.admin ? 'true' : 'false'})`);
  const u = {uid, email};
  as(u, 'select os_state() \\g /dev/null');
  return u;
}
const P = (u, col) => psql(`select ${col} from os_player where uid = '${u.uid}'`);
const bag = (u, id) => Number(psql(`select coalesce((select qty from os_bag where uid = '${u.uid}' and item_id = '${id}'), 0)`));

test('every skill spot on the server matches the game list', {skip}, () => {
  for (const [sk, list] of Object.entries(NODES)) for (const n of list) {
    const spec = JSON.parse(psql(`select os_node('${sk}', '${n.id}')`));
    assert.equal(spec.sec, n.sec, sk + ':' + n.id); assert.equal(spec.xp, n.xp); assert.equal(spec.item, n.item); assert.equal(spec.qty, n.qty || 1);
    assert.deepEqual(spec.use || null, n.use || null);
    assert.equal(Number(psql(`select os_node_lv('${sk}', '${n.id}')`)), n.lv);
  }
});

test('skill levels from XP match the browser', {skip}, () => {
  const xs = [0, 59, 60, 61, 500, 4795, 25000, 99999, 1e6, 2e7];
  const got = psql(`select string_agg(os_skill_level(x)::text, ',' order by o) from unnest(array[${xs.join(',')}]::int[]) with ordinality t(x, o)`).split(',').map(Number);
  assert.deepEqual(got, xs.map(x => levelFromXp(x).level));
});

test('short checks never lose work: the part of a swing carries over', {skip}, () => {
  const u = newPlayer();
  as(u, `select os_act('skill', '{"skill":"mining","node":"copper"}') \\g /dev/null`);
  psql(`update os_player set last_tick = now() - interval '3 seconds' where uid = '${u.uid}'`);
  as(u, 'select os_state() \\g /dev/null');
  assert.equal(bag(u, 'copper_ore'), 1);
  const lag = Number(psql(`select extract(epoch from now() - last_tick) from os_player where uid = '${u.uid}'`));
  assert.ok(lag > 0.8 && lag < 1.3, 'about one second carried, got ' + lag);
  psql(`update os_player set last_tick = last_tick - interval '1.2 seconds' where uid = '${u.uid}'`);
  as(u, 'select os_state() \\g /dev/null');
  assert.equal(bag(u, 'copper_ore'), 2, 'the carried second plus 1.2 more makes a second ore');
  assert.equal(Number(psql(`select (skill->'mining'->>'xp')::int from os_player where uid = '${u.uid}'`)), 10);
});

test('cooking spends fish and stops when the fish run out', {skip}, () => {
  const u = newPlayer();
  psql(`select os_give('${u.uid}', 'raw_eel', 2)`);
  const before = bag(u, 'eel_stew');
  as(u, `select os_act('skill', '{"skill":"cooking","node":"stew"}') \\g /dev/null`);
  psql(`update os_player set last_tick = now() - interval '60 seconds' where uid = '${u.uid}'`);
  as(u, 'select os_state() \\g /dev/null');
  assert.equal(bag(u, 'raw_eel'), 0); assert.equal(bag(u, 'eel_stew'), before + 2);
});

test('locked spots stay locked', {skip}, () => {
  const u = newPlayer();
  fails(u, `select os_act('skill', '{"skill":"mining","node":"void"}')`, /level is too low/);
  fails(u, `select os_act('skill', '{"skill":"mining","node":"nope"}')`, /cannot work there/);
});

test('time away goes to the welcome pack, then lands in the bank', {skip}, () => {
  const u = newPlayer();
  as(u, `select os_act('skill', '{"skill":"woodcutting","node":"ash"}') \\g /dev/null`);
  psql(`update os_player set last_tick = now() - interval '20 minutes' where uid = '${u.uid}'`);
  const s = asJson(u, 'select os_state()');
  assert.ok(s.welcome && s.welcome.lines.length, 'welcome lines');
  assert.equal(bag(u, 'ash_log'), 0);
  as(u, `select os_act('collect', '{}') \\g /dev/null`);
  assert.equal(bag(u, 'ash_log'), Math.floor(1200 / 2.2));
  assert.ok(Number(psql(`select (skill->'woodcutting'->>'xp')::int from os_player where uid = '${u.uid}'`)) >= 545 * 6);
  assert.equal(psql(`select pending is null from os_player where uid = '${u.uid}'`), 't');
});

test('Vigor and Daring refill every step that passed', {skip}, () => {
  const u = newPlayer();
  psql(`update os_player set vigor = 50, vigor_at = now() - interval '16 minutes', daring = 3, daring_at = now() - interval '9 minutes' where uid = '${u.uid}'`);
  as(u, 'select os_state() \\g /dev/null');
  assert.equal(Number(P(u, 'vigor')), 65); assert.equal(Number(P(u, 'daring')), 5);
  const left = Number(P(u, 'extract(epoch from now() - vigor_at)'));
  assert.ok(left > 50 && left < 70, 'the minute left over is kept, got ' + left);
  psql(`update os_player set vigor = 98, vigor_at = now() - interval '2 hours' where uid = '${u.uid}'`);
  as(u, 'select os_state() \\g /dev/null');
  assert.equal(Number(P(u, 'vigor')), 100);
});

test('hustles: Daring, the Stocks, bail and payouts', {skip}, () => {
  const u = newPlayer();
  psql(`update os_player set daring = 25, gold = 0 where uid = '${u.uid}'`);
  let won = 0;
  for (let i = 0; i < 10; i++) { as(u, `select os_act('hustle', '{"job":"pockets"}') \\g /dev/null`); }
  const g = Number(P(u, 'gold')); assert.equal(Number(P(u, 'daring')), 5);
  const wins = Number(psql(`select count(*) from os_hustle_log where uid = '${u.uid}' and result = 'Won'`));
  assert.ok(g >= wins * 12 && g <= wins * 40 * 2, 'pockets pay 12 to 40, gear can add more');
  fails(u, `select os_act('hustle', '{"job":"smuggle"}')`, /Not enough Daring/);
  psql(`update os_player set stocks_until = now() + interval '5 minutes', gold = 1000, daring = 25 where uid = '${u.uid}'`);
  fails(u, `select os_act('hustle', '{"job":"pockets"}')`, /Stocks/);
  as(u, `select os_act('bail', '{}') \\g /dev/null`);
  assert.equal(Number(P(u, 'gold')), 100); assert.equal(P(u, 'stocks_until is null'), 't');
  fails(u, `select os_act('bail', '{}')`, /Bail is not waiting/);
});

test('a failed carriage job sends the lead hero to the Infirmary', {skip}, () => {
  const u = newPlayer();
  for (let i = 0; i < 40; i++) {
    psql(`update os_player set daring = 25 where uid = '${u.uid}'`);
    as(u, `select os_act('hustle', '{"job":"duke"}') \\g /dev/null`);
    if (Number(psql(`select count(*) from os_hustle_log where uid = '${u.uid}' and result = 'Caught'`))) break;
  }
  assert.equal(psql(`select hero_id from os_infirmary where uid = '${u.uid}'`), 'office_worker');
  psql(`update os_player set vigor = 100 where uid = '${u.uid}'`);
  fails(u, `select os_start_delve(1, 1)`, /resting/);
});

test('one road at a time, and the trip ends in the new city', {skip}, () => {
  const u = newPlayer();
  as(u, `select os_act('travel', '{"dest":"sable"}') \\g /dev/null`);
  fails(u, `select os_act('travel', '{"dest":"rome"}')`, /already on the road/);
  psql(`update os_player set travel_until = now() - interval '1 second' where uid = '${u.uid}'`);
  as(u, 'select os_state() \\g /dev/null');
  assert.equal(P(u, 'city'), 'sable');
  fails(u, `select os_act('travel', '{"dest":"sable"}')`, /already there/);
  fails(u, `select os_act('travel', '{"dest":"mars"}')`, /No such road/);
});

test('a delve costs Vigor, waits for its time, and pays for what it cleared', {skip}, () => {
  const u = newPlayer();
  psql(`update os_player set vigor = 100 where uid = '${u.uid}'`);
  fails(u, 'select os_start_delve(2, 15)', /floor locked/);
  fails(u, 'select os_start_delve(1, 7)', /bad length/);
  psql(`select os_give('${u.uid}', 'potion_pink', 3)`);
  as(u, `select os_equip('office_worker', 'belt1', 'potion_pink') \\g /dev/null`);
  as(u, 'select os_start_delve(1, 15)');
  assert.equal(Number(P(u, 'vigor')), 88);
  fails(u, 'select os_start_delve(1, 15)', /already delving/);
  fails(u, 'select os_claim()', /not done/);
  const fight = JSON.parse(psql(`select fight from os_delve where uid = '${u.uid}'`));
  assert.equal(fight.rooms, 3);
  psql(`update os_delve set ends_at = now() - interval '1 second' where uid = '${u.uid}'`);
  const gold0 = Number(P(u, 'gold'));
  const r = asJson(u, 'select os_claim()');
  assert.equal(r.rooms, 3); assert.equal(r.cleared, fight.cleared); assert.equal(r.result, fight.result);
  const finds = Object.values(r.loot).reduce((a, b) => a + b, 0);
  if (fight.cleared > 0) assert.ok(finds >= 1, 'something found');
  assert.equal(Number(P(u, 'gold')), gold0 + r.gold);
  assert.equal(bag(u, 'potion_pink'), 3 - (fight.used.potion_pink || 0), 'drunk potions leave the bank');
  for (const id of fight.downed) assert.equal(psql(`select count(*) from os_infirmary where uid = '${u.uid}' and hero_id = '${id}'`), '1');
  if (fight.result === 'won') assert.equal(Number(P(u, 'deepest')), 2);
  fails(u, 'select os_claim()', /nothing to claim/);
});

test('a choice needs a delve, and stew comes out of the bank once', {skip}, () => {
  const u = newPlayer();
  fails(u, `select os_act('choice', '{"choice":"kick"}')`, /not on a delve/);
  as(u, 'select os_start_delve(1, 1) \\g /dev/null');
  const s0 = bag(u, 'eel_stew');
  as(u, `select os_act('choice', '{"choice":"eat"}') \\g /dev/null`);
  as(u, `select os_act('choice', '{"choice":"eat"}') \\g /dev/null`);
  assert.equal(bag(u, 'eel_stew'), s0 - 1);
});

test('selling pays in copper, less the market fee', {skip}, () => {
  const u = newPlayer();
  psql(`update os_player set gold = 0, copper = 0 where uid = '${u.uid}'`);
  const sc = Number(psql(`select sell_copper from os_item_def where id = 'stained_mug'`));
  const v = Number(as(u, `select os_sell('stained_mug', 5)`).split('\n').pop());
  assert.equal(v, Math.max(1, sc - Math.round(sc * 0.05)), 'only the one owned is sold');
  const tot = Number(P(u, 'gold')) * 10000 + Number(P(u, 'copper'));
  assert.equal(tot, v);
  fails(u, `select os_sell('stained_mug', 1)`, /nothing to sell/);
});

test('packs cost gold and give a card; copies level a card up to 10', {skip}, () => {
  const u = newPlayer();
  psql(`update os_player set gold = 1300 where uid = '${u.uid}'`);
  const n0 = Number(psql(`select count(*) + coalesce(sum(dupes), 0) from os_hero where uid = '${u.uid}'`));
  as(u, `select os_act('pack', '{}') \\g /dev/null`);
  assert.equal(Number(P(u, 'gold')), 50);
  assert.equal(Number(psql(`select count(*) + coalesce(sum(dupes), 0) from os_hero where uid = '${u.uid}'`)), n0 + 1);
  fails(u, `select os_act('pack', '{}')`, /1,250 gold/);
  psql(`update os_hero set dupes = 20, level = 9 where uid = '${u.uid}' and hero_id = 'office_worker'`);
  as(u, `select os_act('card', '{"op":"level","hero":"office_worker"}') \\g /dev/null`);
  as(u, `select os_act('card', '{"op":"level","hero":"office_worker"}') \\g /dev/null`);
  assert.equal(psql(`select level || '/' || dupes from os_hero where uid = '${u.uid}' and hero_id = 'office_worker'`), '10/19');
});

test('forging takes bars and wood and gives the sword', {skip}, () => {
  const u = newPlayer();
  fails(u, `select os_act('forge', '{}')`, /Not enough bars/);
  psql(`select os_give('${u.uid}', 'moonsilver_bar', 4), os_give('${u.uid}', 'ash_log', 2)`);
  as(u, `select os_act('forge', '{}') \\g /dev/null`);
  assert.equal(bag(u, 'moonsilver_gladius'), 1); assert.equal(bag(u, 'moonsilver_bar'), 0);
});

test('Collections lists what this player has found, and only theirs', {skip}, () => {
  const a = newPlayer(), b = newPlayer();
  psql(`select os_give('${a.uid}', 'galea_helmet', 1)`);
  const ca = asJson(a, 'select os_collection()'), cb = asJson(b, 'select os_collection()');
  assert.ok(ca.items.includes('galea_helmet')); assert.ok(!cb.items.includes('galea_helmet'));
  assert.ok(ca.heroes.includes('office_worker'));
});

test('the admin check is done on the server', {skip}, () => {
  const admin = newPlayer({admin: true}), plain = newPlayer();
  assert.equal(as(admin, 'select os_is_admin()').split('\n').pop(), 't');
  assert.equal(as(plain, 'select os_is_admin()').split('\n').pop(), 'f');
  fails(plain, `select os_admin('dash', '{}')`, /not allowed/);
});

test('signed-out callers get nothing', {skip}, () => {
  const nobody = {uid: '', email: ''};
  for (const sql of ['select os_state()', 'select os_claim()', `select os_act('pack', '{}')`, 'select os_collection()', `select os_equip('legionary', 'head', 'galea_helmet')`]) fails(nobody, sql, /not allowed/);
});
