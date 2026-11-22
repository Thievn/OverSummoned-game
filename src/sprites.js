import info from '../public/assets/oversummoned/sprites/sprites.json';

export const FRAME = 64;
export const ROWS = {
  hero: ['idle', 'attack', 'hit', 'skill'],
  enemy: ['idle', 'attack', 'hit', 'death'],
};

export function spriteInfo(id) {
  const entry = info[id];
  const rows = ROWS[entry.kind];
  const cols = Math.max(...Object.values(entry.frames));
  return { ...entry, rows, cols };
}

export const sheetUrl = (id) => `/assets/oversummoned/sprites/${id}.png`;
export const pixelPortrait = (id) => `/assets/oversummoned/pixel/${id}.png`;
