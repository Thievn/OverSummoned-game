import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Sprite from './Sprite.jsx';
import { cardById, cardList, itemList } from '../catalog.js';
import { fight, foeNames, rooms, sheet } from '../copy.js';
import { pixelPortrait, spriteInfo } from '../sprites.js';

const BG_W = 384;
const FLOOR = 135; // top of the floor ledge in the background art
const HERO_X = [58, 100, 142]; // body centers
const FOE_X = { 1: [290], 2: [258, 314], 3: [236, 284, 334] };
const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
const SLOT_ORDER = ['Main Hand', 'Off Hand', 'Head', 'Chest', 'Feet', 'Trinket'];

function Die({ value, rolling }) {
  return (
    <span className={`die${rolling ? ' rolling' : ''}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={PIPS[value].includes(i) ? 'pip' : undefined} />
      ))}
    </span>
  );
}

function useScale(ref) {
  const [s, setS] = useState(2);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setS(w < BG_W ? Math.max(0.75, w / BG_W) : Math.min(3, Math.floor(w / BG_W)));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [ref]);
  return s;
}

function partyFor(lead) {
  const rest = ['legionary', 'paramedic', 'office_worker', 'hunter'].filter((id) => id !== lead).slice(0, 2);
  return [rest[1], rest[0], lead];
}

const idle = () => ({ anim: 'idle', tick: 0 });

export default function Encounter() {
  const wrapRef = useRef(null);
  const s = useScale(wrapRef);
  const [lead, setLead] = useState('office_worker');
  const [roomIx, setRoomIx] = useState(0);
  const room = rooms[roomIx];
  const [alive, setAlive] = useState(room.foes.map(() => true));
  const [heroAnim, setHeroAnim] = useState([idle(), idle(), idle()]);
  const [foeAnim, setFoeAnim] = useState(room.foes.map(idle));
  const [phase, setPhase] = useState('choose');
  const [dice, setDice] = useState([3, 4]);
  const [log, setLog] = useState([room.intro]);
  const [last, setLast] = useState(null);
  const timers = useRef([]);
  const party = partyFor(lead);
  const hero = cardById(lead);
  const loot = itemList.find((item) => item.id === room.loot);

  const later = (fn, ms) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const play = (setter, index, anim) =>
    setter((list) => list.map((entry, i) => (i === index ? { anim, tick: entry.tick + 1 } : entry)));

  function enterRoom(ix) {
    const next = rooms[ix];
    timers.current.forEach(window.clearTimeout);
    setRoomIx(ix);
    setAlive(next.foes.map(() => true));
    setFoeAnim(next.foes.map(idle));
    setHeroAnim([idle(), idle(), idle()]);
    setLog([next.intro]);
    setLast(null);
    setPhase('choose');
  }

  function choose(move) {
    if (phase !== 'choose') return;
    setPhase('rolling');
    let spins = 0;
    const spin = window.setInterval(() => {
      setDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
      spins += 1;
    }, 70);
    later(() => {
      window.clearInterval(spin);
      const d = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
      const mod = Math.floor(hero[move.stat] / 4);
      const total = d[0] + d[1] + mod;
      const won = total >= move.dc;
      setDice(d);
      setLast({ total, mod, dc: move.dc, won, stat: move.stat });
      setLog((lines) => [won ? move.win : move.lose, ...lines].slice(0, 4));
      if (won) {
        const named = room.foes.findIndex((f, i) => f === move.foe && alive[i]);
        const target = named >= 0 ? named : alive.findIndex(Boolean);
        play(setHeroAnim, 2, 'skill');
        later(() => play(setHeroAnim, 1, 'attack'), 120);
        later(() => play(setFoeAnim, target, 'hit'), 380);
        later(() => {
          play(setFoeAnim, target, 'death');
          const nextAlive = alive.map((v, i) => (i === target ? false : v));
          setAlive(nextAlive);
          later(() => setPhase(nextAlive.some(Boolean) ? 'choose' : 'cleared'), 700);
        }, 720);
      } else {
        alive.forEach((on, i) => on && later(() => play(setFoeAnim, i, 'attack'), i * 140));
        later(() => play(setHeroAnim, 2, 'hit'), 420);
        later(() => play(setHeroAnim, 1, 'hit'), 520);
        later(() => setPhase('choose'), 1100);
      }
    }, 650);
  }

  const backToIdle = useCallback(
    (setter, index) => () =>
      setter((list) => list.map((entry, i) => (i === index && entry.anim !== 'death' ? { anim: 'idle', tick: entry.tick + 1 } : entry))),
    [],
  );

  const px = (v) => `${v * s}px`;

  return (
    <section className="band wrap reveal" id="descent-demo" aria-labelledby="fight-title">
      <div className="section-head">
        <h2 id="fight-title">{fight.title}</h2>
        <p className="lead">{fight.lead}</p>
      </div>
      <div className="fight-shell">
        <div className="fight-stage-wrap" ref={wrapRef}>
          <div
            className="fight-stage"
            style={{ width: px(BG_W), height: px(160), '--s': s }}
          >
            <div className="stage-bg" style={{ backgroundSize: `${px(BG_W)} ${px(160)}` }} />
            <div className="stage-fog" />
            <p className="room-name">{room.name}</p>
            {party.map((id, i) => (
              <div key={`${id}-${i}`} className={`actor hero-actor${i === 2 ? ' lead' : ''}`} style={{ left: px(HERO_X[i]), top: px(FLOOR) }}>
                <span key={heroAnim[i].tick} className={`pose${heroAnim[i].anim === 'attack' || heroAnim[i].anim === 'skill' ? ' lunge-r' : ''}`}>
                  <Sprite id={id} scale={s} x={0} y={0} anim={heroAnim[i].anim} tick={heroAnim[i].tick} loop={heroAnim[i].anim === 'idle'} onEnd={backToIdle(setHeroAnim, i)} />
                </span>
              </div>
            ))}
            {room.foes.map((id, i) => {
              const x = FOE_X[room.foes.length][i];
              const st = foeAnim[i] || idle();
              const gone = !alive[i] && st.anim === 'death';
              return (
                <div key={`${room.id}-${id}-${i}`} className={`actor foe-actor${gone ? ' down' : ''}`} style={{ left: px(x), top: px(FLOOR) }}>
                  <span key={st.tick} className={`pose${st.anim === 'attack' ? ' lunge-l' : ''}`}>
                  <Sprite
                    id={id}
                    scale={s}
                    x={0}
                    y={0}
                    anim={st.anim}
                    tick={st.tick}
                    loop={st.anim === 'idle'}
                    hold={gone && st.done}
                    onEnd={
                      st.anim === 'death'
                        ? () => setFoeAnim((list) => list.map((e, j) => (j === i ? { ...e, done: true } : e)))
                        : backToIdle(setFoeAnim, i)
                    }
                  />
                  </span>
                  {!gone && s >= 2 && <span className="foe-tag" style={{ top: px(-spriteInfo(id).height - 12) }}>{foeNames[id]}</span>}
                </div>
              );
            })}
            {phase === 'cleared' && loot && (
              <img className="loot-pop pixel" src={loot.icon} alt="" style={{ left: px(250), top: px(70), width: px(32), height: px(32) }} />
            )}
          </div>
        </div>

        <div className="fight-panel">
          <div className="roll-row" aria-live="polite">
            <Die value={dice[0]} rolling={phase === 'rolling'} />
            <Die value={dice[1]} rolling={phase === 'rolling'} />
            {last && phase !== 'rolling' ? (
              <p className={`roll-math ${last.won ? 'won' : 'lost'}`}>
                <span className="nums">
                  {dice[0]} + {dice[1]} + {last.mod} = {last.total}
                </span>{' '}
                <span className="vs">
                  {fight.vs} {last.dc}
                </span>{' '}
                <strong>{last.won ? fight.win : fight.lose}</strong>
              </p>
            ) : (
              <p className="roll-math idle">{fight.pick}</p>
            )}
          </div>
          <ol className="story-log">
            {log.map((line, i) => (
              <li key={`${line}-${i}`} className={i === 0 ? 'fresh' : undefined}>
                {line}
              </li>
            ))}
          </ol>
          {phase === 'cleared' ? (
            <div className="cleared">
              <p className="kicker">{fight.cleared}</p>
              <p>{fight.lootTitle}</p>
              <div className="slot-strip">
                {SLOT_ORDER.map((slot) => {
                  const filled = loot && loot.slot === slot;
                  return (
                    <span key={slot} className={`mini-slot${filled ? ' filled' : ''}`} title={slot}>
                      {filled ? <img className="pixel" src={loot.icon} alt={loot.name} width="40" height="40" /> : null}
                      <small>{slot}</small>
                    </span>
                  );
                })}
              </div>
              <button type="button" className="btn glow" onClick={() => enterRoom((roomIx + 1) % rooms.length)}>
                {fight.next}
              </button>
            </div>
          ) : (
            <div className="moves">
              {room.moves.map((move) => (
                <button key={move.label} type="button" className="move" disabled={phase !== 'choose'} onClick={() => choose(move)}>
                  <span>{move.label}</span>
                  <small>
                    {sheet[move.stat]} +{Math.floor(hero[move.stat] / 4)}, {fight.need} {move.dc}
                  </small>
                </button>
              ))}
            </div>
          )}
          <div className="pick-lead">
            <p className="kicker">{fight.party}</p>
            <div className="lead-row">
              {cardList.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`lead-pick${card.id === lead ? ' on' : ''}`}
                  aria-pressed={card.id === lead}
                  aria-label={card.name}
                  onClick={() => phase !== 'rolling' && setLead(card.id)}
                >
                  <img className="pixel" src={pixelPortrait(card.id)} alt="" width="48" height="64" />
                </button>
              ))}
            </div>
            <p className="hint">{fight.scaleNote}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
