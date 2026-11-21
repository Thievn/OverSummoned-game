import { useEffect, useState } from 'react';
import art from 'virtual:art';
import { ASSET, CREWS, HEADLINES, JOBS, MARKET } from '../data.js';
import { Scene, useScene } from './Scene.jsx';
import { Sprite } from './Sprite.jsx';

function Pell() {
  const { metrics } = useScene();
  const [anim, setAnim] = useState('idle');
  const scale = metrics && metrics.w >= 760 ? 3 : 2;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const id = window.setInterval(() => setAnim('attack'), 5600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Sprite
      characterId="clerk_pell"
      anim={anim}
      scale={scale}
      feetX="78%"
      zIndex={4}
      onDone={() => setAnim('idle')}
    />
  );
}

export function City() {
  const bg = `${ASSET}${art.backgrounds.bg_aldermere_night.file}`;
  return (
    <section id="city" aria-labelledby="city-title">
      <div className="band-inner city-intro">
        <p className="index">04</p>
        <h2 id="city-title">They asked for a hero. The street got a shift change.</h2>
        <p className="deck">
          Jobs, a market that prices spears by the hour, crews who will split a take and an argument,
          and Mr. Pell, who stamps heroes the way other men stamp invoices. You are an invoice.
        </p>
      </div>
      <div className="city-wrap">
      <Scene className="city-scene" bg={bg} label="Aldermere at night">
        <Pell />
      </Scene>

      <article className="crier">
        <p className="crier-price">1 crown, and you still overpaid</p>
        <h3>The Crier</h3>
        <p className="crier-sub">Aldermere&apos;s only paper. Printed when the ink is not in a form.</p>
        <p className="crier-date">Under the moon, against our wishes</p>
        <ul>
          {HEADLINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </article>

      <article className="dossier">
        <h3>Market</h3>
        <ul className="ledger">
          {MARKET.map((item) => (
            <li key={item.name}>
              <span>
                <strong>{item.name}</strong>
                {item.note}
              </span>
              <em>{item.price}</em>
            </li>
          ))}
        </ul>
      </article>

      <article className="dossier">
        <h3>Crews</h3>
        <ul className="stack">
          {CREWS.map((crew) => (
            <li key={crew.name}>
              <strong>{crew.name}</strong>
              {crew.text}
            </li>
          ))}
        </ul>
      </article>

      <article className="dossier">
        <h3>Jobs</h3>
        <ul className="ledger">
          {JOBS.map((job) => (
            <li key={job.name}>
              <span>
                <strong>{job.name}</strong>
                {job.note}
              </span>
              <em>{job.pay}</em>
            </li>
          ))}
        </ul>
      </article>
      </div>
    </section>
  );
}
