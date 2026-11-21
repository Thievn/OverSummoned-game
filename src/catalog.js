import cards from '../public/assets/oversummoned/cards.json';
import items from '../public/assets/oversummoned/items.json';
import loadouts from './loadouts.js';

export const cardList = cards;
export const itemList = items;

const itemsById = Object.fromEntries(items.map((item) => [item.id, item]));

export function cardById(id) {
  return cards.find((card) => card.id === id) || null;
}

export function sheetSlots(cardId) {
  const loadout = loadouts[cardId];
  const slots = {};
  for (const [slot, id] of Object.entries(loadout)) {
    if (slot === 'belt') {
      slots.belt = id.map((itemId) => (itemId ? itemsById[itemId] : null));
    } else {
      slots[slot] = id ? itemsById[id] : null;
    }
  }
  return slots;
}

export function equippedItems(cardId) {
  const slots = sheetSlots(cardId);
  return Object.entries(slots).flatMap(([slot, value]) => {
    if (slot === 'belt') return value.filter(Boolean);
    return value ? [value] : [];
  });
}
