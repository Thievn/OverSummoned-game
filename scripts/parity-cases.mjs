// Shared fight cases for the browser/server parity check.
import { partyFor } from '../js/fight.js';
import { GEAR, EXAMPLE_GEAR } from '../js/gear.js';
export function sqlParty(party) {
  return party.map(p => ({id:p.id, name:p.name, atk:p.total.atk, def:p.total.def, hp:p.total.hp, spd:p.total.spd, crit:p.total.crit, luck:p.total.luck,
    armor:p.armor, lo:p.lo, hi:p.hi, swing:p.swing, fx:p.fx, uses:p.uses, belt:p.belt}));
}
export function usesMap() { const o = {}; for (const [id, it] of Object.entries(GEAR)) if (it.use) o[id] = Object.assign({}, it.use, {name: it.name}); return o; }
export function cases() {
  const out = [];
  const squads = [['office_worker','delivery_rider'], ['will_slapton','legionary','paramedic'], ['gangster','engineer','office_worker'], ['hunter','plague_doctor','paramedic'], ['legionary','will_slapton','office_worker']];
  let n = 0;
  for (const sq of squads) for (const geared of [false, true]) for (const [floor, minutes] of [[1,15],[3,60],[5,240],[10,60],[7,480]]) {
    n++;
    const lv = geared ? 9 : 1 + (n % 3);
    const party = partyFor(sq.map(id => ({id, level:lv})), geared ? EXAMPLE_GEAR : {});
    out.push({party, floor, minutes, seed: 1000 + n * 7919, rules:{heal: 30 + (n % 4) * 10, retreat: (n % 3) * 15}, stock: geared ? {potion_pink:3, eel_stew:2, potion_cyan:1, night_tonic:1} : {}});
  }
  // Rare paths: revives, guard oil, retreat.
  const hard = partyFor([{id:'paramedic', level:1}, {id:'legionary', level:1}, {id:'will_slapton', level:1}], EXAMPLE_GEAR);
  for (let k = 0; k < 8; k++) out.push({party: hard, floor: 9 + k * 2, minutes: 240, seed: 77 + k * 131, rules:{heal: 60, retreat: k % 2 ? 85 : 0}, stock:{potion_cyan: 4, potion_pink: 1}});
  return out;
}
