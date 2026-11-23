// Where card art comes from. Shared cards use the files on the site. A card that belongs to one
// account brings its own art from the server (os_owner_art), and only that account ever gets it.
const OWN = {};
const ICONS = {};

function toUrl(data) {
  if (typeof data !== 'string' || !data.startsWith('data:')) return null;
  try {
    const [head, b64] = data.split(',');
    const mime = (head.match(/^data:([^;]+)/) || [])[1] || 'image/png';
    const bin = atob(b64); const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([buf], {type: mime}));
  } catch (e) { return null; }
}

export function registerArt(id, a) {
  if (!a || !id) return;
  const o = OWN[id] = {sideMeta: a.sideMeta || null, frontMeta: a.frontMeta || null, front: {}};
  o.portrait = toUrl(a.portrait); o.back = toUrl(a.back); o.side = toUrl(a.side);
  for (const [k, v] of Object.entries(a.front || {})) o.front[k] = toUrl(v);
  for (const [k, v] of Object.entries(a.icons || {})) ICONS[k] = toUrl(v);
}

export const hasArt = (id) => !!OWN[id];
export const portraitSrc = (id) => (OWN[id] && OWN[id].portrait) || `/assets/portrait/${id}.png`;
export const backSrc = (id, gif) => (OWN[id] && OWN[id].back) || `/card_backs/${gif || id}.gif`;
export const sideSrc = (id) => (OWN[id] && OWN[id].side) || `/assets/sprites/${id}.png`;
export const sideMeta = (id) => (OWN[id] && OWN[id].sideMeta) || null;
export const frontSrc = (id, anim) => (OWN[id] && OWN[id].front[anim]) || `/assets/front/${id}_${anim}.png`;
export const frontMeta = (id) => (OWN[id] && OWN[id].frontMeta) || null;
// Item icons: own art first, then the site's files.
export function iconFor(id, icon) {
  if (ICONS[id]) return ICONS[id];
  if (!icon || String(icon).startsWith('own/')) return '/assets/gen/chest.png';
  return '/assets/' + icon + '.png';
}
