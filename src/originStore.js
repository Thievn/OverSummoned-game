const KEY = 'oversummoned-origin';

export const ORIGIN_IDS = [
  'hunter',
  'legionary',
  'engineer',
  'gangster',
  'paramedic',
  'office_worker',
];

export function readOrigin() {
  try {
    const value = localStorage.getItem(KEY) || '';
    return ORIGIN_IDS.includes(value) ? value : '';
  } catch {
    return '';
  }
}

export function writeOrigin(id) {
  const value = ORIGIN_IDS.includes(id) ? id : '';
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
    /* private mode can refuse storage; the in-memory listeners still update */
  }
  window.dispatchEvent(new CustomEvent('oversummoned-origin', { detail: value }));
  return value;
}
