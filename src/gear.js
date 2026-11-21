const FLAT = /^([+-]\d+)\s+([A-Za-z]+)$/;
const RATE = /^([+-]\d+%)\s+(.+)$/;

export function readItemLines(item) {
  const mods = {};
  const rates = [];
  const notes = [];
  if (!item) return { mods, rates, notes };
  for (const line of [...(item.primary || []), ...(item.secondary || [])]) {
    const flat = String(line).match(FLAT);
    if (flat) {
      mods[flat[2]] = (mods[flat[2]] || 0) + Number(flat[1]);
      continue;
    }
    if (RATE.test(String(line))) rates.push(String(line));
    else notes.push(String(line));
  }
  return { mods, rates, notes };
}

export function combineGear(items) {
  const mods = {};
  const rates = [];
  const notes = [];
  for (const item of items) {
    if (!item) continue;
    const part = readItemLines(item);
    for (const [key, value] of Object.entries(part.mods)) {
      mods[key] = (mods[key] || 0) + value;
    }
    rates.push(...part.rates);
    notes.push(...part.notes);
  }
  const knack = Math.round(((mods.Wits || 0) + (mods.Hands || 0) + (mods.Charm || 0)) / 3);
  return { mods, rates, notes, knack };
}

export function overstatRows(card, gear) {
  return [
    { key: 'guard', label: 'Guard', base: card.guard, gear: gear.mods.Guard || 0 },
    { key: 'might', label: 'Might', base: card.might, gear: gear.mods.Might || 0 },
    { key: 'knack', label: 'Knack', base: card.knack, gear: gear.knack },
  ].map((row) => ({ ...row, total: row.base + row.gear }));
}

export function otherGearLines(gear) {
  const skip = new Set(['Guard', 'Might']);
  const flats = Object.entries(gear.mods)
    .filter(([key]) => !skip.has(key))
    .map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${key}`);
  return [...flats, ...gear.rates, ...gear.notes];
}

export function formatSigned(value) {
  if (value > 0) return `+${value}`;
  if (value === 0) return '+0';
  return String(value);
}
