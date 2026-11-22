import { FRAME, sheetUrl, spriteInfo } from '../sprites.js';

// One sprite-sheet animation. Every character shares the same 64px frame and
// the same feet line, so sizes stay honest next to each other.
export default function Sprite({ id, tick = 0, anim = 'idle', scale = 3, loop = true, hold = false, ms = 110, onEnd, className = '', style }) {
  const info = spriteInfo(id);
  const row = Math.max(0, info.rows.indexOf(anim));
  const n = info.frames[info.rows[row]];
  const size = FRAME * scale;
  const css = {
    '--n': n,
    '--px': `${size}px`,
    width: size,
    height: size,
    backgroundImage: `url(${sheetUrl(id)})`,
    backgroundSize: `${info.cols * size}px ${info.rows.length * size}px`,
    backgroundPositionY: `${-row * size}px`,
    ...style,
  };
  if (hold) {
    css.backgroundPositionX = `${-(n - 1) * size}px`;
    css.animation = 'none';
  } else {
    css.animationDuration = `${n * ms}ms`;
    css.animationIterationCount = loop ? 'infinite' : 1;
  }
  return (
    <div
      key={`${id}-${anim}-${loop}-${hold}-${tick}`}
      className={`sprite ${className}`}
      style={css}
      role="presentation"
      onAnimationEnd={onEnd}
    />
  );
}
