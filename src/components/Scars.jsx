import { useEffect, useState } from 'react';
import art from 'virtual:art';
import { ASSET, BOUND, SCARS } from '../data.js';
import { readOrigin } from '../originStore.js';
import { Scene, useScene } from './Scene.jsx';
import { Sprite } from './Sprite.jsx';

function Survivor() {
  const { metrics } = useScene();
  const [originId, setOriginId] = useState('hunter');
  useEffect(() => {
    const sync = () => setOriginId(readOrigin() || 'hunter');
    sync();
    window.addEventListener('oversummoned-origin', sync);
    return () => window.removeEventListener('oversummoned-origin', sync);
  }, []);
  const scale = metrics && metrics.w >= 760 ? 3 : 2;
  return <Sprite characterId={originId} anim="idle" scale={scale} feetX="30%" zIndex={4} />;
}

export function Scars() {
  const bg = `${ASSET}${art.backgrounds.bg_exit_shrine.file}`;
  return (
    <section id="scars" className="scars-wrap" aria-labelledby="scars-title">
      <div className="band-inner">
        <p className="index">05</p>
        <h2 id="scars-title">A Scar keeps the receipt.</h2>
        <p className="deck">
          Die in a borrowed helmet and the helmet stays down there. Die in gear that is Bound and it comes out with you, blood included.
          The clerk stamps the blood. It is now in the system.
        </p>
      </div>
      <Scene className="shrine-scene" bg={bg} label="The exit shrine">
        <Survivor />
      </Scene>
      <div className="scar-layout">
        <div>
          <h3>Scars</h3>
          <p className="deck tight">
            You come back marked. One perk. One flaw. No appeals, and Mr. Pell will not hear a speech about it.
          </p>
          <div className="scar-grid">
            {SCARS.map((scar) => (
              <article key={scar.name} className="scar">
                <h3>{scar.name}</h3>
                <p><span>Perk</span> {scar.perk}</p>
                <p><span>Flaw</span> {scar.flaw}</p>
              </article>
            ))}
          </div>
        </div>
        <aside className="bound">
          <h3>Bound, so it follows you</h3>
          <ul className="stack">
            {BOUND.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                {item.note}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
