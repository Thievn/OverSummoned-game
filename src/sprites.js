import info from '../public/assets/oversummoned/sprites/sprites.json';

export const ROWS = {
  hero: ['idle', 'attack', 'hit', 'skill'],
  enemy: ['idle', 'attack', 'hit', 'death'],
};

// Each sheet has its own frame size. ax/ay is the feet point (body center, sole line)
// inside a frame, so every character can be stood on the same floor at the same pixel scale.
export function spriteInfo(id) {
  const entry = info[id];
  const rows = ROWS[entry.kind];
  const cols = Math.max(...Object.values(entry.frames));
  return { ...entry, rows, cols };
}

export const sheetUrl = (id) => `/assets/oversummoned/sprites/${id}.png?v=4`;
export const pixelPortrait = (id) => `/assets/oversummoned/pixel/${id}.png`;
