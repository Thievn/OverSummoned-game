// Writes test/fight-golden.json from the server's fight (psql to a copy of the database).
// Usage: PGURL=... node scripts/fight-golden.mjs   (local test copy, never the live database)
import { cases, sqlParty, usesMap } from './parity-cases.mjs';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
const q = (o) => `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;
const pick = [0, 7, 13, 21, 37, 52, 56, 57];
const all = cases(); const out = [];
for (const i of pick) {
  const c = all[i];
  const sql = `select os_fight_sim(${q(sqlParty(c.party))}, ${c.floor}, ${c.minutes}, ${c.seed}, ${q(c.rules)}, ${q(c.stock)}, ${q(usesMap())})`;
  const res = JSON.parse(execFileSync('psql', [process.env.PGURL, '-At', '-c', sql], {maxBuffer: 1 << 26}).toString());
  out.push({i, server: res});
}
writeFileSync(new URL('../test/fight-golden.json', import.meta.url), JSON.stringify(out));
console.log('wrote', out.length);
