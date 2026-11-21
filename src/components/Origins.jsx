import { useEffect, useRef, useState } from 'react';
import art from 'virtual:art';
import { ORIGINS } from '../data.js';
import { readOrigin, writeOrigin } from '../originStore.js';
import { Sprite } from './Sprite.jsx';

function OriginCard({ origin, selected, onPick }) {
  const [anim, setAnim] = useState('idle');
  const busy = useRef(false);
  const character = art.characters[origin.id];

  const play = () => {
    if (busy.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    busy.current = true;
    setAnim('attack');
  };

  return (
    <article className={selected ? 'origin-card is-selected' : 'origin-card'}>
      <button
        type="button"
        className="origin-hit"
        aria-pressed={selected}
        onMouseEnter={play}
        onClick={() => {
          onPick(origin.id);
          play();
        }}
      >
        <div className="origin-stage">
          <div className="origin-floor" aria-hidden="true" />
          <Sprite
            characterId={origin.id}
            anim={anim}
            scale={2}
            feetX="54%"
            ground="278px"
            zIndex={2}
            onDone={() => {
              busy.current = false;
              setAnim('idle');
            }}
          />
          {selected ? <span className="mini-seal">Filed</span> : null}
        </div>
        <div className="origin-copy">
          <h3>{character.title}</h3>
          <p>{origin.bio}</p>
          <p className="know">
            <span>Know-How</span>
            {character.know_how}. {origin.detail}
          </p>
        </div>
      </button>
    </article>
  );
}

export function Origins() {
  const [picked, setPicked] = useState('');

  useEffect(() => {
    const sync = () => setPicked(readOrigin());
    sync();
    window.addEventListener('oversummoned-origin', sync);
    return () => window.removeEventListener('oversummoned-origin', sync);
  }, []);

  return (
    <section id="origins" className="band" aria-labelledby="origins-title">
      <div className="band-inner">
        <p className="index">02</p>
        <h2 id="origins-title">Pick your Origin</h2>
        <p className="deck">
          You were someone before the circle. That someone still has opinions, and the dungeon has to live with them.
          Pick one. It is filed with your name, which the clerk will spell wrong.
        </p>
        <div className="origin-grid">
          {ORIGINS.map((origin) => (
            <OriginCard
              key={origin.id}
              origin={origin}
              selected={picked === origin.id}
              onPick={(id) => {
                writeOrigin(id);
                setPicked(id);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
