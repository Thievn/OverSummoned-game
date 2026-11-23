// The market: fair prices, the shop floor, the Trading Hall and the city traders.
// Runs against a local copy of the database (never the live one).
// PGURL="host=/workspace/os-testdb/sock port=5499 user=postgres dbname=t" node --test test/market.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { ITEMS, NODES } from '../js/catalog.js';
import { fairCopper, sellCopper, traderBuys, traderSells, hallDeposit, hallBand, hallCut, TRADER_CAP } from '../js/engine.js';
import { fasterMult } from '../js/fight.js';

const URL = process.env.PGURL;
const skip = !URL && 'set PGURL to a local test database';
const psql = sql => execFileSync('psql', [URL, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-c', sql], {stdio: ['ignore', 'pipe', 'pipe']}).toString().trim();
function as(user, sql, ip) {
  const pre = `select set_config('request.jwt.claim.sub', '${user.uid}', false), set_config('request.jwt.claims', '${JSON.stringify({email: user.email, sub: user.uid})}', false), set_config('request.headers', '${JSON.stringify(ip ? {'x-forwarded-for': ip} : {})}', false) \\g /dev/null\n`;
  return execFileSync('psql', [URL, '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1'], {input: pre + sql + '\n', stdio: ['pipe', 'pipe', 'pipe']}).toString().trim();
}
function fails(user, sql, re, ip) {
  try { as(user, sql, ip); } catch (e) { assert.match(String(e.stderr), re); return; }
  assert.fail('expected an error matching ' + re);
}
function player({ready = true} = {}) {
  const uid = randomUUID(), email = `m${uid.slice(0, 8)}@example.com`;
  psql(`insert into auth.users(id, email) values ('${uid}', '${email}'); insert into den_allow(email, is_admin) values ('${email}', false)`);
  const u = {uid, email};
  as(u, 'select os_state() \\g /dev/null');
  psql(`update os_player set gold = 1000, copper = 0 ${ready ? `, created_at = now() - interval '4 days', skill = '{"mining":{"xp":50000}}'` : ''} where uid = '${uid}'`);
  return u;
}
const purse = u => Number(psql(`select gold::bigint * 10000 + copper from os_player where uid = '${u.uid}'`));
const bag = (u, id) => Number(psql(`select coalesce((select qty from os_bag where uid = '${u.uid}' and item_id = '${id}'), 0)`));
const give = (u, id, q) => psql(`insert into os_bag(uid, item_id, qty) values ('${u.uid}', '${id}', ${q}) on conflict (uid, item_id) do update set qty = excluded.qty`);
const fair = id => Number(psql(`select fair from os_fair where item_id = '${id}'`));
const hall = (u, op, p, ip) => as(u, `select os_hall_act('${op}', '${JSON.stringify(p)}') \\g /dev/null`, ip);
const lastHall = u => JSON.parse(psql(`select row_to_json(h) from os_hall h where seller = '${u.uid}' order by id desc limit 1`));

test('fair prices on the server match the game list, and the shop floor pays half', {skip}, () => {
  for (const id of ['copper_ore', 'ash_log', 'ironbark_log', 'moonwood_log', 'emberroot_log', 'voidtrunk_log', 'potion_pink', 'moonsilver_bar', 'eel_stew', 'gem_violet']) {
    assert.equal(fair(id), fairCopper(null, id), id);
    assert.equal(Number(psql(`select os_shop_unit('${id}')`)), sellCopper(id), id + ' shop');
  }
  assert.equal(fair('ash_log'), 1800); assert.equal(fair('potion_pink'), 8000); assert.equal(fair('moonsilver_bar'), 30000); assert.equal(fair('eel_stew'), 5000);
  assert.equal(psql(`select count(*) from os_fair where item_id in ('card_shard', 'summon_sigil')`), '0');
});

test('each tree drops its own wood', {skip}, () => {
  const want = {ash: 'ash_log', ironbark: 'ironbark_log', moonwood: 'moonwood_log', emberroot: 'emberroot_log', voidtrunk: 'voidtrunk_log'};
  for (const [n, item] of Object.entries(want)) {
    assert.equal(JSON.parse(psql(`select os_node('woodcutting', '${n}')`)).item, item);
    assert.equal(NODES.woodcutting.find(x => x.id === n).item, item);
    assert.ok(ITEMS[item], item + ' is in the game list');
  }
});

test('heroes and gear speed a skill up by at most 30%', {skip}, () => {
  assert.equal(fasterMult(60), 0.7); assert.equal(fasterMult(10), 0.9);
  assert.equal(psql(`select prosrc like '%least(30,%' from pg_proc where proname = 'os_skill_mult'`), 't');
});

test('new players trade with the traders and the shop, but not other players yet', {skip}, () => {
  const u = player({ready: false});
  give(u, 'copper_ore', 10);
  fails(u, `select os_hall_act('list', '{"item":"copper_ore","qty":5,"unit":1700,"hours":8}')`, /3 days after you arrive/);
  psql(`update os_player set created_at = now() - interval '4 days' where uid = '${u.uid}'`);
  fails(u, `select os_hall_act('list', '{"item":"copper_ore","qty":5,"unit":1700,"hours":8}')`, /Lv 10/);
  as(u, `select os_trader_act('sell', '{"item":"copper_ore","qty":10}') \\g /dev/null`);
  assert.equal(bag(u, 'copper_ore'), 0);
});

test('listing takes a deposit, keeps prices in range, and a sale pays the seller less 5% with the deposit back', {skip}, () => {
  const s = player(), b = player();
  give(s, 'moonsilver_bar', 10);
  const f = fair('moonsilver_bar');
  fails(s, `select os_hall_act('list', '{"item":"moonsilver_bar","qty":4,"unit":${Math.ceil(f / 2) - 1},"hours":8}')`, /between half and four times/);
  fails(s, `select os_hall_act('list', '{"item":"moonsilver_bar","qty":4,"unit":${f * 4 + 1},"hours":8}')`, /between half and four times/);
  fails(s, `select os_hall_act('list', '{"item":"moonsilver_bar","qty":4,"unit":${f},"hours":5}')`, /2, 8 or 24/);
  fails(s, `select os_hall_act('list', '{"item":"card_shard","qty":1,"unit":100,"hours":8}')`, /does not take that/);
  const p0 = purse(s), unit = 33333;
  hall(s, 'list', {item: 'moonsilver_bar', qty: 4, unit, hours: 24});
  const dep = hallDeposit(unit, 4, 24);
  assert.equal(purse(s), p0 - dep, 'deposit taken'); assert.equal(bag(s, 'moonsilver_bar'), 6);
  const h = lastHall(s);
  assert.equal(Number(h.deposit), dep);
  fails(s, `select os_hall_act('buy', '{"id":${h.id}}')`, /your own listing/);
  const b0 = purse(b);
  hall(b, 'buy', {id: h.id, qty: 1});
  assert.equal(purse(b), b0 - unit); assert.equal(bag(b, 'moonsilver_bar'), 1);
  const back1 = Math.floor(dep * 1 / 4);
  assert.equal(purse(s), p0 - dep + unit - hallCut(unit) + back1);
  hall(b, 'buy', {id: h.id});
  assert.equal(bag(b, 'moonsilver_bar'), 4);
  assert.equal(purse(s), p0 + 4 * unit - hallCut(unit) - hallCut(3 * unit), 'the whole deposit came back');
  assert.equal(lastHall(s).status, 'sold');
  const log = psql(`select string_agg(source || ':' || qty || ':' || (seller = '${s.uid}') || ':' || (buyer = '${b.uid}'), ',' order by id) from os_trade where item_id = 'moonsilver_bar' and buyer = '${b.uid}'`);
  assert.equal(log, 'hall:1:true:true,hall:3:true:true', 'both sales are in the sale log');
});

test('taking a listing down or letting it run out brings the goods home, and the deposit stays with the Hall', {skip}, () => {
  const s = player();
  give(s, 'iron_bar', 10);
  const p0 = purse(s);
  hall(s, 'list', {item: 'iron_bar', qty: 5, unit: 9000, hours: 2});
  hall(s, 'cancel', {id: lastHall(s).id});
  assert.equal(bag(s, 'iron_bar'), 10); assert.equal(purse(s), p0 - hallDeposit(9000, 5, 2));
  hall(s, 'list', {item: 'iron_bar', qty: 3, unit: 9000, hours: 2});
  psql(`update os_hall set expires_at = now() - interval '1 minute' where id = ${lastHall(s).id}`);
  as(s, 'select os_state() \\g /dev/null');
  assert.equal(bag(s, 'iron_bar'), 10); assert.equal(lastHall(s).status, 'expired');
});

test('two accounts on one connection, and repeat sales between the same two players, are marked', {skip}, () => {
  const s = player(), b = player();
  give(s, 'raw_eel', 100);
  hall(s, 'list', {item: 'raw_eel', qty: 10, unit: 1800, hours: 8}, '9.9.9.9');
  hall(b, 'buy', {id: lastHall(s).id, qty: 1}, '9.9.9.9');
  assert.equal(psql(`select flag from os_trade where buyer = '${b.uid}' order by id desc limit 1`), 'same_device');
  hall(b, 'buy', {id: lastHall(s).id, qty: 1}, '7.7.7.7');
  assert.equal(psql(`select flag from os_trade where buyer = '${b.uid}' order by id desc limit 1`), '', 'a second sale is fine');
  hall(b, 'buy', {id: lastHall(s).id, qty: 1}, '7.7.7.7');
  assert.equal(psql(`select flag from os_trade where buyer = '${b.uid}' order by id desc limit 1`), 'repeat', 'the third in a day is marked');
  assert.equal(psql(`select count(*) from os_trade where buyer = '${b.uid}' and source = 'hall'`), '3');
});

test('traders pay 85% up to a daily amount and sell at 125%', {skip}, () => {
  const u = player();
  psql(`update os_player set gold = 100000 where uid = '${u.uid}'`);
  const cap = Number(psql(`select os_trader_left('${u.uid}', 'gem_violet')`));
  assert.ok(cap > 0 && cap <= TRADER_CAP.gem_violet);
  give(u, 'gem_violet', cap + 5);
  const p0 = purse(u);
  as(u, `select os_trader_act('sell', '{"item":"gem_violet","qty":${cap + 5}}') \\g /dev/null`);
  assert.equal(bag(u, 'gem_violet'), 5, 'they stop at the daily amount');
  assert.equal(purse(u), p0 + cap * traderBuys(null, 'gem_violet'));
  fails(u, `select os_trader_act('sell', '{"item":"gem_violet","qty":1}')`, /all they want from you today/);
  as(u, `select os_sell('gem_violet', 5) \\g /dev/null`);
  assert.equal(bag(u, 'gem_violet'), 0, 'the shop floor still buys');
  const p1 = purse(u);
  as(u, `select os_trader_act('buy', '{"item":"ember_ore","qty":3}') \\g /dev/null`);
  assert.equal(purse(u), p1 - 3 * traderSells(null, 'ember_ore')); assert.equal(bag(u, 'ember_ore'), 3);
  fails(u, `select os_trader_act('buy', '{"item":"duelling_rapier","qty":1}')`, /do not deal in that/);
  assert.equal(psql(`select count(*) from os_listing where kind = 'item' and seller is null`), '0', 'the old stall is gone');
});

test('the fair price follows real sales from different players, at most 10% a day', {skip}, () => {
  const item = 'void_ore';
  psql(`update os_fair set fair = anchor, day_fair = anchor where item_id = '${item}'`);
  const f0 = fair(item);
  const sellers = [player(), player(), player()], buyers = [player(), player(), player()];
  sellers.forEach((s, k) => { give(s, item, 5); hall(s, 'list', {item, qty: 5, unit: f0 * 3, hours: 8}, '1.1.1.' + k); });
  buyers.forEach((b, k) => { psql(`update os_player set gold = 100000 where uid = '${b.uid}'`); hall(b, 'buy', {id: lastHall(sellers[k]).id, qty: 1}, '2.2.2.' + k); });
  const f1 = fair(item);
  assert.ok(f1 > f0, 'the price rose');
  assert.equal(f1, Math.round(f0 * 1.1), 'but only 10% in a day');
  const h = JSON.parse(as(buyers[0], `select os_price_history('${item}')`).split('\n').pop());
  assert.equal(h.days.length, 7); assert.ok(h.sold >= 3); assert.equal(h.fair, f1); assert.ok(Number(h.low) <= f0 * 3);
  psql(`update os_fair set fair = anchor, day_fair = anchor where item_id = '${item}'`);
});

test('marked sales do not move the price', {skip}, () => {
  const item = 'iron_ore', f0 = fair(item);
  const sellers = [player(), player(), player()], buyers = [player(), player(), player()];
  sellers.forEach((s, k) => { give(s, item, 5); hall(s, 'list', {item, qty: 5, unit: f0 * 3, hours: 8}, '3.3.3.' + k); });
  buyers.forEach((b, k) => hall(b, 'buy', {id: lastHall(sellers[k]).id, qty: 1}, '3.3.3.' + k));
  assert.equal(fair(item), f0);
});

test('the browser and the server agree on market math', {skip}, () => {
  for (const [u, q, h] of [[1700, 3, 2], [33333, 4, 24], [9, 1, 8], [600000, 7, 8]]) {
    const pct = {2: 0.01, 8: 0.02, 24: 0.03}[h];
    assert.equal(Number(psql(`select greatest(1, ceil(${u}::bigint * ${q} * ${pct}))::bigint`)), hallDeposit(u, q, h));
  }
  for (const id of ['copper_ore', 'moonsilver_bar', 'gem_violet']) {
    const f = fair(id);
    const st = {fair: {[id]: f}};
    assert.equal(Number(psql(`select greatest(1, floor(${f} * 0.85))::bigint`)), traderBuys(st, id));
    assert.equal(Number(psql(`select ceil(${f} * 1.25)::bigint`)), traderSells(st, id));
    const [lo, hi] = hallBand(st, id); assert.equal(lo, Math.ceil(f / 2)); assert.equal(hi, f * 4);
  }
});

test('selling or crafting away the last of something empties the slot cleanly', {skip}, () => {
  const u = player();
  give(u, 'eel_stew', 3);
  as(u, `select os_trader_act('sell', '{"item":"eel_stew","qty":3}') \\g /dev/null`);
  assert.equal(bag(u, 'eel_stew'), 0);
  give(u, 'raw_eel', 2); give(u, 'ash_log', 2);
  as(u, `select os_act('skill', '{"skill":"alchemy","node":"draught"}') \\g /dev/null`);
  psql(`update os_player set last_tick = now() - interval '60 seconds' where uid = '${u.uid}'`);
  as(u, 'select os_state() \\g /dev/null');
  assert.equal(bag(u, 'raw_eel'), 0); assert.equal(bag(u, 'potion_pink'), 2);
  give(u, 'iron_bar', 4);
  hall(u, 'list', {item: 'iron_bar', qty: 4, unit: 9000, hours: 2});
  assert.equal(bag(u, 'iron_bar'), 0);
});
