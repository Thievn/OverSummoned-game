import { useEffect, useRef, useState } from 'react';
import art from 'virtual:art';
import { BOONS, DOORS, ASSET } from '../data.js';
import { readOrigin } from '../originStore.js';
import {
  enemyIntent,
  ENEMIES,
  knowHowFor,
  resolveTurn,
  startFight,
} from '../combat.js';
import { Scene, useScene } from './Scene.jsx';
import { Sprite } from './Sprite.jsx';

function useScale() {
  const { metrics } = useScene();
  if (!metrics) return 2;
  return metrics.w < 760 ? 2 : 3;
}

function Bars({ fight, enemyName }) {
  const playerPct = Math.max(0, (fight.playerHp / fight.playerMax) * 100);
  const enemyPct = Math.max(0, (fight.enemyHp / fight.enemyMax) * 100);
  return (
    <div className="bars">
      <div>
        <span>You {fight.playerHp}/{fight.playerMax}</span>
        <div className="hp player" aria-hidden="true">
          <span style={{ width: `${playerPct}%` }} />
        </div>
      </div>
      <div>
        <span>
          {enemyName} {fight.enemyHp}/{fight.enemyMax}
        </span>
        <div className="hp enemy" aria-hidden="true">
          <span style={{ width: `${enemyPct}%` }} />
        </div>
      </div>
    </div>
  );
}

function BattleStage({ phase, originId, playerAnim, enemyId, enemyAnim, playerHurt }) {
  const scale = useScale();
  const showEnemy = phase === 'fight' || phase === 'dead';
  const showBoss = phase === 'boss';
  return (
    <>
      <Sprite
        characterId={originId || 'office_worker'}
        anim={playerAnim}
        scale={scale}
        feetX={phase === 'exit' ? '34%' : '28%'}
        zIndex={4}
        hurt={playerHurt}
      />
      {showEnemy ? (
        <Sprite characterId={enemyId} anim={enemyAnim} scale={scale} feetX="74%" zIndex={4} />
      ) : null}
      {showBoss ? (
        <Sprite characterId="boiler_boss" anim="idle" scale={scale === 3 ? 3 : 2} feetX="76%" zIndex={4} />
      ) : null}
    </>
  );
}

export function Descent() {
  const [phase, setPhase] = useState('doors');
  const [originId, setOriginId] = useState('');
  const [enemyId, setEnemyId] = useState('cellar_rat');
  const [fight, setFight] = useState(null);
  const [playerAnim, setPlayerAnim] = useState('idle');
  const [enemyAnim, setEnemyAnim] = useState('idle');
  const [playerHurt, setPlayerHurt] = useState(false);
  const [boon, setBoon] = useState(null);
  const [busy, setBusy] = useState(false);
  const dead = useRef(false);

  useEffect(() => {
    dead.current = false;
    const sync = () => setOriginId(readOrigin());
    sync();
    window.addEventListener('oversummoned-origin', sync);
    return () => {
      dead.current = true;
      window.removeEventListener('oversummoned-origin', sync);
    };
  }, []);

  const bgId =
    phase === 'exit' ? 'bg_exit_shrine' : 'bg_dungeon_corridor';
  const bg = `${ASSET}${art.backgrounds[bgId].file}`;
  const know = knowHowFor(originId || 'office_worker');

  async function play(events) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pause = (ms) => (reduce ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms)));
    for (const event of events) {
      if (dead.current) return;
      if (event === 'player-attack') {
        setPlayerAnim('attack');
        await pause(700);
        if (!dead.current) setPlayerAnim('idle');
      } else if (event === 'enemy-hurt') {
        setEnemyAnim('hurt');
        await pause(520);
        if (!dead.current) setEnemyAnim('idle');
      } else if (event === 'enemy-attack') {
        setEnemyAnim('attack');
        await pause(700);
        if (!dead.current) setEnemyAnim('idle');
      } else if (event === 'player-hurt') {
        setPlayerHurt(true);
        await pause(160);
        if (!dead.current) setPlayerHurt(false);
      } else if (event === 'player-defend' || event === 'enemy-stalled' || event === 'player-know') {
        await pause(280);
      }
    }
  }

  function chooseDoor(door) {
    setEnemyId(door.enemy);
    setFight(startFight(door.enemy));
    setPlayerAnim('idle');
    setEnemyAnim('idle');
    setPhase('fight');
  }

  async function act(action) {
    if (busy || !fight || fight.over) return;
    setBusy(true);
    const { state, events } = resolveTurn(fight, action, originId || 'office_worker');
    if (!events.length) {
      setBusy(false);
      return;
    }
    setFight(state);
    await play(events);
    if (dead.current) return;
    if (state.over === 'win') setPhase('boons');
    else if (state.over === 'dead') setPhase('dead');
    setBusy(false);
  }

  function reset() {
    setPhase('doors');
    setFight(null);
    setBoon(null);
    setPlayerAnim('idle');
    setEnemyAnim('idle');
    setPlayerHurt(false);
    setBusy(false);
  }

  const intent = fight && !fight.over ? enemyIntent(fight) : null;

  return (
    <section id="descent" className="descent-wrap" aria-labelledby="descent-title">
      <Scene className="descent-scene" bg={bg} label="A floor of the Descent">
        <div className="hud">
          <p className="kicker">The Descent · eight to twelve floors · enemy intents are visible</p>
          <h2 id="descent-title">Old Cellars</h2>

          {phase === 'doors' ? (
            <>
              <p className="hud-copy">
                Summoned by mistake. Stuck by design. Three ways forward. None of them were advertised.
              </p>
              <div className="doors">
                {DOORS.map((door) => (
                  <button key={door.id} type="button" className="door" onClick={() => chooseDoor(door)}>
                    <small>{door.kicker}</small>
                    {door.name}
                    <span>{door.text}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {phase === 'fight' && fight ? (
            <>
              <Bars fight={fight} enemyName={ENEMIES[enemyId].name} />
              {intent ? (
                <p className="intent">
                  Intent · {intent.name} · {intent.damage}
                  <span>{intent.line}</span>
                </p>
              ) : null}
              <p className="log" aria-live="polite">{fight.log}</p>
              <div className="actions">
                <button type="button" className="btn" disabled={busy} onClick={() => act('attack')}>
                  Attack <small>4</small>
                </button>
                <button type="button" className="btn" disabled={busy} onClick={() => act('defend')}>
                  Defend <small>-3</small>
                </button>
                <button
                  type="button"
                  className="btn btn-gold"
                  disabled={busy || fight.knowHowUsed}
                  onClick={() => act('know')}
                >
                  {know.name}
                </button>
              </div>
            </>
          ) : null}

          {phase === 'boons' ? (
            <>
              <p className="hud-copy">The room offers three things. Take one. Leave the speech.</p>
              <div className="doors">
                {BOONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="door"
                    onClick={() => {
                      setBoon(item);
                      setPhase('boss');
                    }}
                  >
                    <small>Boon</small>
                    {item.name}
                    <span>{item.text}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {phase === 'boss' ? (
            <>
              <p className="intent">
                Intent · Vent · 8
                <span>Not this floor. The pipes are already practicing.</span>
              </p>
              <p className="hud-copy">
                {boon ? `${boon.name} is yours. ` : ''}
                The Angry Boiler is awake somewhere under the laundry steam. It has not seen you. It will.
              </p>
              <button type="button" className="btn btn-gold" onClick={() => setPhase('exit')}>
                Take the exit while it is still a rumor
              </button>
            </>
          ) : null}

          {phase === 'dead' ? (
            <>
              <p className="hud-copy">
                You die between floors. A Scar writes itself in the margin: Still Clocked In. Perk, a bandage.
                Flaw, you pat a watch you do not own.
              </p>
              <button type="button" className="btn btn-gold" onClick={() => setPhase('exit')}>
                Climb out anyway
              </button>
            </>
          ) : null}

          {phase === 'exit' ? (
            <>
              <p className="hud-copy">
                Daylight stairs, a shrine, and a chest that is not yours yet. The real Descent is longer, meaner, and keeps the Scar.
              </p>
              <div className="actions">
                <a className="btn btn-gold" href="#waitlist">
                  Get in the real line
                </a>
                <button type="button" className="btn" onClick={reset}>
                  Run the floor again
                </button>
              </div>
            </>
          ) : null}
        </div>
        <BattleStage
          phase={phase}
          originId={originId}
          playerAnim={playerAnim}
          enemyId={enemyId}
          enemyAnim={enemyAnim}
          playerHurt={playerHurt}
        />
      </Scene>
    </section>
  );
}
