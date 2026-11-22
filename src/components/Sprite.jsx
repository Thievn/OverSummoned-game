import { sheetUrl, spriteInfo } from '../sprites.js';

// One sprite-sheet animation, placed by its feet. (x, y) is where the feet touch the floor.
export default function Sprite({ id, tick = 0, anim = 'idle', scale = 3, loop = true, hold = false, ms = 100, onEnd, className = '', x, y, style }) {
  const info = spriteInfo(id);
  const row = Math.max(0, info.rows.indexOf(anim));
  const n = info.frames[info.rows[row]];
  const w = info.w * scale;
  const h = info.h * scale;
  const css = {
    '--n': n,
    '--px': `${w}px`,
    width: w,
    height: h,
    backgroundImage: `url(${sheetUrl(id)})`,
    backgroundSize: `${info.cols * w}px ${info.rows.length * h}px`,
    backgroundPositionY: `${-row * h}px`,
    ...style,
  };
  if (x !== undefined) {
    css.position = 'absolute';
    css.left = x - info.ax * scale;
    css.top = y - info.ay * scale;
  }
  if (hold) {
    css.backgroundPositionX = `${-(n - 1) * w}px`;
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
