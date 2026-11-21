import { useEffect, useRef } from 'react';
import art from 'virtual:art';
import { ASSET } from '../data.js';
import { spriteBox } from '../ground.js';
import { useScene } from './Scene.jsx';

export function Sprite({
  characterId,
  anim = 'idle',
  scale = 2,
  feetX = '50%',
  zIndex = 4,
  ground,
  hurt = false,
  onDone,
}) {
  const ref = useRef(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const { metrics } = useScene();
  const ready = Boolean(ground || metrics);
  const character = art.characters[characterId];
  const clip = character.animations[anim] || character.animations.idle;
  const placed = spriteBox({
    ground: 0,
    frameWidth: clip.frame_width,
    frameHeight: clip.frame_height,
    scale,
    feetAnchorX: character.feet_anchor_x,
    feetOffset: character.feet_offset_from_bottom_px,
  });

  useEffect(() => {
    if (!ready) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let timer = 0;
    let dead = false;
    const draw = () => {
      el.style.backgroundPosition = `${-frame * placed.width}px 0px`;
    };
    draw();
    if (reduce) {
      if (!clip.loop) onDoneRef.current?.();
      return undefined;
    }
    const ms = 1000 / clip.fps;
    const step = () => {
      if (dead) return;
      frame += 1;
      if (frame >= clip.frame_count) {
        if (clip.loop) {
          frame = 0;
          draw();
          timer = window.setTimeout(step, ms);
        } else {
          frame = clip.frame_count - 1;
          draw();
          onDoneRef.current?.();
        }
        return;
      }
      draw();
      timer = window.setTimeout(step, ms);
    };
    timer = window.setTimeout(step, ms);
    return () => {
      dead = true;
      window.clearTimeout(timer);
    };
  }, [ready, characterId, anim, placed.width, clip.frame_count, clip.fps, clip.loop]);

  if (!ready) return null;

  const groundExpr = ground || 'var(--ground-top)';
  const top = `calc(${groundExpr} - ${placed.height}px + ${character.feet_offset_from_bottom_px * scale}px)`;

  return (
    <>
      <div
        className="feet-shadow"
        aria-hidden="true"
        style={{
          left: feetX,
          top: groundExpr,
          width: 22 * scale,
          height: 7 * scale,
          zIndex: zIndex - 1,
        }}
      />
      <div
        ref={ref}
        className={hurt ? 'sprite is-hurt' : 'sprite'}
        role="img"
        aria-label={character.title}
        data-character={characterId}
        data-anim={anim}
        style={{
          width: placed.width,
          height: placed.height,
          zIndex,
          left: feetX,
          top,
          transform: `translateX(${-placed.anchor}px)`,
          backgroundImage: `url("${ASSET}${clip.sheet}")`,
          backgroundSize: `${placed.width * clip.frame_count}px ${placed.height}px`,
        }}
      />
    </>
  );
}
