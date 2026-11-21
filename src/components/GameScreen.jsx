import { useEffect, useState } from 'react';
import { cardById } from '../catalog.js';
import {
  deskCopy,
  desks,
  headlines,
  sample,
  screen,
  sheet,
} from '../copy.js';

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function useEnergy() {
  const [state, setState] = useState({ energy: 62, left: 8 * 60 + 42 });
  useEffect(() => {
    const id = window.setInterval(() => {
      setState((current) => {
        if (current.left > 1) return { ...current, left: current.left - 1 };
        return { energy: Math.min(100, current.energy + 5), left: 10 * 60 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  const minutes = String(Math.floor(state.left / 60)).padStart(2, '0');
  const seconds = String(state.left % 60).padStart(2, '0');
  return { energy: state.energy, clock: `${minutes}:${seconds}` };
}

function Bar({ label, value, max, note, tone, extra }) {
  return (
    <div className="bar">
      <div className="bar-top">
        <span>{label}</span>
        <span className="nums">
          {value} / {max}
        </span>
      </div>
      <div
        className="bar-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <div className={`bar-fill ${tone}`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <p className="bar-sub nums">
        {note}
        {extra ? ` ${extra}` : ''}
      </p>
    </div>
  );
}

export default function GameScreen({ onOpen }) {
  const clock = useClock();
  const energy = useEnergy();
  const [tab, setTab] = useState('home');
  const [spot, setSpot] = useState(0);
  const card = cardById(sample.cardId);
  const active = desks.find((desk) => desk.id === tab);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSpot((current) => (current + 1) % headlines.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="screen">
      <div className="screen-title">
        <span>{active?.label || screen.status}</span>
        <span className="nums">
          {clock} {screen.utc}
        </span>
      </div>
      <div className="screen-body">
        <div className="screen-main">
          <div className="bars" aria-label={screen.status}>
            <p className="kicker">{screen.status}</p>
            <Bar
              label={screen.energy}
              value={energy.energy}
              max={100}
              note={screen.energyNote}
              extra={energy.clock}
              tone="energy"
            />
            <Bar label={screen.nerve} value={38} max={100} note={screen.nerveNote} tone="nerve" />
            <Bar label={screen.morale} value={71} max={100} note={screen.moraleNote} tone="morale" />
            <Bar label={screen.life} value={87} max={100} note={screen.lifeNote} tone="life" />
          </div>
          {tab === 'home' ? (
            <div className="home-lower">
              <button type="button" className="char-block" onClick={(event) => onOpen(card.id, event)}>
                <span className="kicker">{screen.character}</span>
                <span className="char-name">{card.name}</span>
                <span className="char-title">{card.title}</span>
                <span className="mini-stats">
                  <Stat kind="guard" label={sheet.guard} value={card.guard} />
                  <Stat kind="might" label={sheet.might} value={card.might} />
                  <Stat kind="knack" label={sheet.knack} value={card.knack} />
                </span>
                <dl className="char-facts">
                  <div>
                    <dt>{screen.rank}</dt>
                    <dd>{sample.rank}</dd>
                  </div>
                  <div>
                    <dt>{screen.faction}</dt>
                    <dd>{sample.faction}</dd>
                  </div>
                  <div>
                    <dt>{screen.due}</dt>
                    <dd className="nums">
                      {sample.due} Ø<span className="visually-hidden"> Crowns</span>
                    </dd>
                  </div>
                  <div>
                    <dt>{screen.location}</dt>
                    <dd>{sample.location}</dd>
                  </div>
                </dl>
                <span className="open-hint">{screen.openSheet}</span>
              </button>
              <div className="news">
                <p className="kicker">{screen.news}</p>
                {headlines.map((line, index) => (
                  <article key={line.source} className={index === spot ? 'on' : undefined}>
                    <span className="src">{line.source}</span>
                    <p>{line.text}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="desk">
              <h3>{deskCopy[tab].title}</h3>
              {deskCopy[tab].lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          )}
        </div>
        <nav className="screen-nav" aria-label={screen.places}>
          {desks.map((desk) => (
            <button
              key={desk.id}
              type="button"
              className={desk.id === tab ? 'on' : undefined}
              aria-current={desk.id === tab ? 'page' : undefined}
              onClick={() => setTab(desk.id)}
            >
              {desk.label}
            </button>
          ))}
        </nav>
      </div>
      <p className="ticker" aria-hidden="true">
        <span className="src">{headlines[spot].source}</span> {headlines[spot].text}
      </p>
    </div>
  );
}

function Stat({ kind, label, value }) {
  return (
    <span className="mini-stat">
      <img src={`/assets/oversummoned/frames/icon_${kind}.png`} alt="" width="16" height="16" />
      <span className="visually-hidden">{label} </span>
      <span className="nums">{value}</span>
    </span>
  );
}
