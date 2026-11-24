import { useEffect, useMemo, useRef, useState } from 'react';
import {
  HEROES,
  GEAR,
  FEATURED_IDS,
  ERAS,
  RARITY,
  FUSION_ORDER,
  DELVE_FLOORS,
  MARKET_LISTINGS,
  SLOT_ORDER,
  SLOT_LABELS,
  EMPTY_SLOT_COPY,
  NAV,
  formatStat,
  formatMoney,
  computeStats,
  itemById,
  heroById,
} from './data.js';

function Icon({ name }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  switch (name) {
    case 'heroes':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19c1.2-3.2 3.5-5 7-5s5.8 1.8 7 5" />
        </svg>
      );
    case 'gear':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5" />
        </svg>
      );
    case 'idler':
      return (
        <svg {...common}>
          <path d="M5 19V8l7-5 7 5v11" />
          <path d="M9 19v-6h6v6" />
        </svg>
      );
    case 'delve':
      return (
        <svg {...common}>
          <path d="M5 19l5-9 3 5 2-3 4 7H5z" />
          <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'binder':
      return (
        <svg {...common}>
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M8 4v16M11 9h5M11 13h5" />
        </svg>
      );
    case 'market':
      return (
        <svg {...common}>
          <path d="M5 9l1.2-5h11.6L19 9" />
          <path d="M5 9h14v11H5z" />
          <path d="M9 13h6" />
        </svg>
      );
    case 'fire':
      return (
        <svg {...common} width="16" height="16">
          <path d="M12 3s3 4 3 7a5 5 0 1 1-8.5-3.5C8 8 9 5 12 3z" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common} width="16" height="16">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5l3 2" />
        </svg>
      );
    case 'monitor':
      return (
        <svg {...common} width="18" height="18">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      );
    case 'boost':
      return (
        <svg {...common} width="16" height="16">
          <path d="M12 4l6 8h-4v8H10V12H6z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'sword':
      return (
        <svg {...common} width="16" height="16">
          <path d="M14 3l7 7-2 1-2-2-6 6H7v-4l6-6-2-2z" />
        </svg>
      );
    default:
      return null;
  }
}

function SteamMark() {
  return (
    <svg className="steam-badge" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#1b2838" stroke="#8f98a0" strokeWidth="1.2" />
      <circle cx="8.2" cy="15.2" r="3.1" fill="none" stroke="#c7d5e0" strokeWidth="1.6" />
      <circle cx="15.4" cy="8.4" r="3.4" fill="none" stroke="#c7d5e0" strokeWidth="1.6" />
      <path d="M10.4 13.4L14.2 9.8" stroke="#c7d5e0" strokeWidth="1.6" />
    </svg>
  );
}

function formatTime(total) {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

let toastId = 1;

export default function App() {
  const [tab, setTab] = useState('idler');
  const [heroId, setHeroId] = useState('cyber-knight');
  const [eraId, setEraId] = useState('neon-ruins');
  const [eraProgress, setEraProgress] = useState({
    'neon-ruins': { stage: 4, progress: 2845, goal: 5000 },
    'pirate-cove': { stage: 2, progress: 1100, goal: 4000 },
  });
  const [loadout, setLoadout] = useState({
    hat: 'pirate-hat',
    weapon: 'blade',
    cloak: null,
    relic: null,
  });
  const [riftCharge, setRiftCharge] = useState(4820);
  const [essence, setEssence] = useState(28);
  const [dropSeconds, setDropSeconds] = useState(11 * 60 + 42);
  const [boost, setBoost] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [desktopModal, setDesktopModal] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [swapSlot, setSwapSlot] = useState(null);
  const [sparks, setSparks] = useState({
    common: 23,
    uncommon: 6,
    rare: 4,
    epic: 1,
    legendary: 0,
    absurd: 0,
    unhinged: 0,
  });
  const [fuseFrom, setFuseFrom] = useState('common');
  const [gearFilter, setGearFilter] = useState('all');
  const [flipped, setFlipped] = useState({});
  const [delve, setDelve] = useState(null);
  const [floats, setFloats] = useState([]);
  const clickBtnRef = useRef(null);

  const hero = heroById(heroId);
  const era = ERAS.find((e) => e.id === eraId);
  const progress = eraProgress[eraId];
  const stats = useMemo(() => computeStats(hero, loadout, GEAR), [hero, loadout]);

  function toast(message) {
    const id = toastId++;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }

  useEffect(() => {
    const t = setInterval(() => {
      setDropSeconds((s) => {
        if (s <= 1) {
          toast(
            boost
              ? 'A Steam drop just landed, and the rare boost sweetened the pull.'
              : 'A Steam drop just landed in your inventory.',
          );
          setBoost(false);
          return 30 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [boost]);

  useEffect(() => {
    const t = setInterval(() => {
      setEraProgress((prev) => {
        const cur = prev[eraId];
        const step = 8 + Math.floor(stats.spd / 14);
        let { stage, progress, goal } = cur;
        progress += step;
        if (progress >= goal) {
          const award = 15 + stage * 5;
          const nextStage = stage + 1;
          const name = era.name;
          queueMicrotask(() => {
            setEssence((e) => e + award);
            toast(`${name} climbed to Stage ${nextStage}. You gained ${award} Rift Essence.`);
          });
          stage = nextStage;
          progress = 0;
          goal = Math.round(goal * 1.12);
        }
        return { ...prev, [eraId]: { stage, progress, goal } };
      });
    }, 180);
    return () => clearInterval(t);
  }, [eraId, stats.spd, era.name]);

  useEffect(() => {
    if (!delve || !delve.active || delve.ended) return undefined;
    const t = setInterval(() => {
      setDelve((d) => {
        if (!d || !d.active || d.ended) return d;
        if (d.timeLeft <= 1) {
          return { ...d, timeLeft: 0, ended: true, result: d.bag.length ? 'cashed' : 'timeout' };
        }
        return { ...d, timeLeft: d.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [delve?.active, delve?.ended]);

  function addClicks(e) {
    const gained = 8 + Math.floor(Math.random() * 7);
    setRiftCharge((c) => c + gained);
    const rect = (e?.currentTarget || clickBtnRef.current)?.getBoundingClientRect();
    if (rect) {
      const id = toastId++;
      setFloats((f) => [...f, { id, x: rect.left + rect.width / 2, y: rect.top, text: `+${gained}` }]);
      setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 800);
    }
  }

  function equip(itemId) {
    const item = itemById(itemId);
    if (!item) return;
    setLoadout((l) => {
      if (l[item.slot] === itemId) {
        toast(`${item.name} is back in your pack.`);
        return { ...l, [item.slot]: null };
      }
      toast(`${item.name} is on your ${SLOT_LABELS[item.slot].toLowerCase()} slot.`);
      return { ...l, [item.slot]: itemId };
    });
  }

  function startDelve() {
    if (riftCharge < 150) {
      toast('You need 150 Rift Charge to step into a delve.');
      return;
    }
    setRiftCharge((c) => c - 150);
    setDelve({
      active: true,
      ended: false,
      floor: 0,
      timeLeft: 30,
      bag: [],
      essence: 0,
      result: null,
    });
  }

  function revealFloor() {
    setDelve((d) => {
      if (!d || d.ended) return d;
      const next = Math.min(5, d.floor + 1);
      return { ...d, floor: next, revealed: true };
    });
  }

  function bankFloors(floors) {
    const ess = floors.reduce((sum, f) => sum + f.essence, 0);
    if (ess) setEssence((e) => e + ess);
    if (floors.length) {
      setSparks((s) => {
        const n = { ...s };
        floors.forEach((f) => {
          n[f.rarity] = (n[f.rarity] || 0) + f.sparks;
        });
        return n;
      });
    }
    return ess;
  }

  function withCurrentFloor(d) {
    const floor = d.floor ? DELVE_FLOORS[d.floor - 1] : null;
    if (!floor) return { bag: d.bag, essence: d.essence };
    if (d.bag.some((f) => f.floor === floor.floor)) {
      return { bag: d.bag, essence: d.essence };
    }
    return { bag: [...d.bag, floor], essence: d.essence + floor.essence };
  }

  function cashOut() {
    setDelve((d) => {
      if (!d || d.ended) return d;
      const next = withCurrentFloor(d);
      const ess = bankFloors(next.bag);
      toast(
        next.bag.length
          ? `You cashed out with ${next.bag.length} find${next.bag.length === 1 ? '' : 's'} and ${ess} Rift Essence.`
          : 'You stepped back with empty pockets, still in one piece.',
      );
      return { ...d, ...next, ended: true, result: 'cashed' };
    });
  }

  function pushDeeper() {
    setDelve((d) => {
      if (!d || d.ended) return d;
      const next = withCurrentFloor(d);
      if (d.floor >= 5) {
        bankFloors(next.bag);
        toast('You made it to the last floor and walked out with the whole haul.');
        return { ...d, ...next, ended: true, result: 'cleared', revealed: true };
      }
      const floor = DELVE_FLOORS[d.floor - 1];
      const fail = Math.random() < (floor?.fail || 0);
      if (fail) {
        toast('The rift snapped shut. The unbanked loot slipped back into the dark.');
        return { ...d, bag: [], essence: 0, ended: true, result: 'failed', revealed: true };
      }
      const upcoming = d.floor + 1;
      return { ...d, ...next, floor: upcoming, revealed: true };
    });
  }

  function fuse() {
    const idx = FUSION_ORDER.indexOf(fuseFrom);
    const next = FUSION_ORDER[idx + 1];
    if (!next) {
      toast('Unhinged is as wild as it gets. There is nothing left to fuse into.');
      return;
    }
    if ((sparks[fuseFrom] || 0) < 10) {
      toast(`You need 10 ${RARITY[fuseFrom].label} sparks to fuse.`);
      return;
    }
    setSparks((s) => ({
      ...s,
      [fuseFrom]: s[fuseFrom] - 10,
      [next]: (s[next] || 0) + 1,
    }));
    toast(`Ten ${RARITY[fuseFrom].label} sparks became one ${RARITY[next].label} spark.`);
  }

  function showOnDesktop() {
    setSyncOpen(true);
    toast('Your loadout is shining on the desktop circle.');
  }

  function sendBoost() {
    if (boost) {
      toast('A rare drop boost is already warming the next pull.');
      return;
    }
    if (essence < 40) {
      toast('You need 40 Rift Essence for a boost. Let the idler keep working.');
      return;
    }
    setEssence((e) => e - 40);
    setBoost(true);
    toast('Boost sent. Your next desktop drop has a sweeter rare chance.');
  }

  const binderCards = [
    ...HEROES.filter((h) => h.unlocked).map((h) => ({
      key: `hero-${h.id}`,
      kind: 'Hero',
      name: h.name,
      rarity: 'legendary',
      img: h.img,
      lore: h.lore,
      facts: [
        ['Era', h.era],
        ['Role', h.role],
        ['Trait', h.trait],
      ],
    })),
    ...GEAR.map((g) => ({
      key: `gear-${g.id}`,
      kind: 'Gear',
      name: g.name,
      rarity: g.rarity,
      img: g.img,
      lore: g.lore,
      facts: [
        ['Slot', SLOT_LABELS[g.slot]],
        ['Drop rate', g.dropRate],
        ['Steam Market', formatMoney(g.marketValue)],
        [
          'Stats',
          Object.entries(g.stats)
            .map(([k, v]) => `${k.toUpperCase()} ${formatStat(k, v)}`)
            .join(' · '),
        ],
      ],
    })),
  ];

  const featured = FEATURED_IDS.map(itemById);
  const currentFloor = delve && delve.floor ? DELVE_FLOORS[delve.floor - 1] : null;

  return (
    <>
      <header className="landing">
        <div className="landing-bg" aria-hidden="true" />
        <div className="landing-inner">
          <div className="landing-copy">
            <img
              className="landing-logo"
              src="/oversummoned-logo.svg"
              alt="OverSummoned"
              width="2439"
              height="360"
            />
            <p className="tagline">Click on your PC. Summon across time. Play from your phone.</p>
            <div className="landing-actions">
              <a className="btn btn-gold" href="#companion">
                Jump Into Interactive Preview
              </a>
              <button className="btn btn-ghost" type="button" onClick={() => setDesktopModal(true)}>
                Steam Desktop Clicker (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="app-wrap" id="companion">
        <div className="app-shell">
          <div className="topbar">
            <div className="brand">
              <img className="brand-logo" src="/oversummoned-logo.svg" alt="OverSummoned" />
              <span className="steam-pill" title="Signed in with Steam for this preview">
                <span className="dot" />
                Steam Connected
              </span>
            </div>
            <div className="top-stats">
              <span className="stat-chip">
                <Icon name="fire" />
                Rift Charge: <strong>{riftCharge.toLocaleString()}</strong>
              </span>
              <button
                ref={clickBtnRef}
                type="button"
                className="click-btn"
                onClick={addClicks}
                title="Feed a click from your PC"
              >
                + Click
              </button>
              <span className={`stat-chip ${boost ? 'boosted' : ''}`}>
                <Icon name="clock" />
                Next Drop: <strong>{formatTime(dropSeconds)}</strong>
                {boost ? ' · +25%' : ''}
              </span>
            </div>
          </div>

          <div className="shell-body">
            <nav className="sidebar" aria-label="Companion">
              {NAV.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`nav-btn ${tab === n.id ? 'active' : ''}`}
                  onClick={() => setTab(n.id)}
                >
                  <Icon name={n.id} />
                  {n.label}
                </button>
              ))}
            </nav>

            <main className="main-pane">
              {tab === 'idler' && (
                <>
                  <h2 className="section-title">Era Idler</h2>
                  <div className="stage">
                    <img className="stage-bg" src={era.bg} alt="" />
                    <div className="stage-fade" />
                    <div className="era-switch">
                      {ERAS.map((e) => (
                        <button
                          key={e.id}
                          type="button"
                          className={`era-chip ${eraId === e.id ? 'on' : ''}`}
                          onClick={() => setEraId(e.id)}
                        >
                          {e.name}
                        </button>
                      ))}
                    </div>
                    <div className="stage-hero">
                      <img src={hero.img} alt={hero.name} />
                    </div>
                  </div>
                  <div className="progress-block">
                    <div className="progress-meta">
                      <span>
                        {era.name} - Stage {progress.stage}
                      </span>
                      <span>
                        {Math.floor(progress.progress).toLocaleString()} / {progress.goal.toLocaleString()}
                      </span>
                    </div>
                    <div className="bar" aria-hidden="true">
                      <i style={{ width: `${Math.min(100, (progress.progress / progress.goal) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="stat-row">
                    {[
                      ['atk', 'ATK', '⚔️'],
                      ['def', 'DEF', '🛡️'],
                      ['spd', 'SPD', '🪶'],
                      ['crit', 'CRIT', '◎'],
                      ['luck', 'LUCK', '☘'],
                    ].map(([key, label, ico]) => (
                      <div className="stat-box" key={key}>
                        <span className="ico" aria-hidden="true">
                          {ico}
                        </span>
                        <span className="lbl">{label}</span>
                        <span className="val">{formatStat(key, stats[key])}</span>
                      </div>
                    ))}
                  </div>
                  <div className="item-row">
                    {featured.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={`item-card ${item.rarity} ${loadout[item.slot] === item.id ? 'equipped' : ''}`}
                        onClick={() => equip(item.id)}
                      >
                        <span className="rarity-tag">{RARITY[item.rarity].label}</span>
                        <SteamMark />
                        <img src={item.img} alt="" />
                        <div className="name">{item.name}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {tab === 'heroes' && (
                <>
                  <h2 className="section-title">Heroes</h2>
                  <p className="section-kicker">
                    Swap who stands at the circle. Every unlocked hero keeps the gear you snap on.
                  </p>
                  <div className="hero-grid">
                    {HEROES.map((h) => (
                      <button
                        type="button"
                        key={h.id}
                        className={`hero-card ${heroId === h.id ? 'active' : ''} ${h.unlocked ? '' : 'locked'}`}
                        onClick={() => {
                          if (!h.unlocked) {
                            toast(`${h.name} is still waiting in the rift.`);
                            return;
                          }
                          setHeroId(h.id);
                          toast(`${h.name} is ready at the circle.`);
                        }}
                      >
                        <div className="hero-art">
                          {h.img ? <img src={h.img} alt="" /> : <div className="silhouette" />}
                        </div>
                        <h3>{h.name}</h3>
                        <div className="era">{h.era}</div>
                        <p>{h.trait}</p>
                        {heroId === h.id && h.unlocked && <span className="badge-on">On the circle</span>}
                        {!h.unlocked && <span className="badge-on">Waiting in the rift</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {tab === 'gear' && (
                <>
                  <h2 className="section-title">Gear</h2>
                  <p className="section-kicker">
                    Everything here already lives in your Steam inventory. Tap a piece to equip or put it away.
                  </p>
                  <div className="filter-row">
                    {['all', ...SLOT_ORDER, ...Object.keys(RARITY)].map((f) => (
                      <button
                        type="button"
                        key={f}
                        className={`chip ${gearFilter === f ? 'on' : ''}`}
                        onClick={() => setGearFilter(f)}
                      >
                        {SLOT_LABELS[f] || RARITY[f]?.label || 'All'}
                      </button>
                    ))}
                  </div>
                  <div className="gear-grid">
                    {GEAR.filter((g) => {
                      if (gearFilter === 'all') return true;
                      return g.slot === gearFilter || g.rarity === gearFilter;
                    }).map((g) => (
                      <button
                        type="button"
                        key={g.id}
                        className={`gear-tile item-card ${g.rarity} ${loadout[g.slot] === g.id ? 'equipped' : ''}`}
                        onClick={() => equip(g.id)}
                      >
                        <span className="rarity-tag">{RARITY[g.rarity].label}</span>
                        <SteamMark />
                        <img src={g.img} alt="" />
                        <h3>{g.name}</h3>
                        <div className="meta">
                          {SLOT_LABELS[g.slot]} · {loadout[g.slot] === g.id ? 'Equipped' : 'Owned'}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {tab === 'delve' && (
                <>
                  <h2 className="section-title">Rift Delve</h2>
                  <p className="section-kicker">
                    Spend 150 Rift Charge and step into the dark. Cash out when the loot feels right, or push deeper and risk the whole run.
                  </p>
                  {!delve && (
                    <div className={`encounter ${eraId === 'pirate-cove' ? 'cove' : ''}`}>
                      <h3>A 30-second dare</h3>
                      <p>
                        Five floors, one ticking clock. Each floor pays better than the last. If the rift snaps shut, unbanked finds go with it.
                      </p>
                      <button type="button" className="btn btn-gold" onClick={startDelve}>
                        Enter the Rift · 150 Charge
                      </button>
                    </div>
                  )}
                  {delve && (
                    <div className="delve-wrap">
                      <div className="timer-ring">
                        <strong>{delve.ended ? 'Run complete' : `Time left ${formatTime(delve.timeLeft)}`}</strong>
                        <div className="floors" aria-hidden="true">
                          {DELVE_FLOORS.map((f) => (
                            <i
                              key={f.floor}
                              className={
                                f.floor < delve.floor ? 'on' : f.floor === delve.floor ? 'now' : ''
                              }
                            />
                          ))}
                        </div>
                      </div>
                      <div className={`encounter ${eraId === 'pirate-cove' ? 'cove' : ''}`}>
                        {delve.floor === 0 && !delve.ended && (
                          <>
                            <h3>The mouth of the rift</h3>
                            <p>The first floor is quiet. Step through when you are ready.</p>
                            <button type="button" className="btn-cash" onClick={revealFloor}>
                              Open Floor 1
                            </button>
                          </>
                        )}
                        {delve.floor > 0 && !delve.ended && currentFloor && (
                          <>
                            <h3>
                              Floor {currentFloor.floor} · {currentFloor.title}
                            </h3>
                            <p>{currentFloor.text}</p>
                            <span
                              className="loot-pill"
                              style={{ color: RARITY[currentFloor.rarity].color }}
                            >
                              {RARITY[currentFloor.rarity].label} · {currentFloor.loot}
                            </span>
                            <div className="delve-actions" style={{ marginTop: 14 }}>
                              <button type="button" className="btn-cash" onClick={cashOut}>
                                Cash Out
                              </button>
                              <button type="button" className="btn-push" onClick={pushDeeper}>
                                {delve.floor >= 5 ? 'Claim the Haul' : 'Push Deeper'}
                              </button>
                            </div>
                          </>
                        )}
                        {delve.ended && (
                          <>
                            <h3>
                              {delve.result === 'failed'
                                ? 'The rift snapped shut'
                                : delve.result === 'cleared'
                                  ? 'You walked out rich'
                                  : delve.result === 'timeout'
                                    ? 'The clock ran out'
                                    : 'You cashed out'}
                            </h3>
                            <p className={delve.result === 'failed' ? 'fail-banner' : ''}>
                              {delve.result === 'failed'
                                ? 'Nothing from this run made it back with you. The circle will still be here tomorrow.'
                                : delve.bag.length
                                  ? `You banked ${delve.bag.map((f) => f.loot).join(', ')}.`
                                  : 'Time ran out before a find could stick. Shake it off and go again.'}
                            </p>
                            <button
                              type="button"
                              className="btn-cash"
                              onClick={() => setDelve(null)}
                            >
                              Back to the entrance
                            </button>
                          </>
                        )}
                      </div>
                      <p className="bag">
                        In the bag:{' '}
                        {delve.bag.length
                          ? delve.bag.map((f) => f.loot).join(', ')
                          : 'nothing yet'}
                        {delve.essence ? ` · ${delve.essence} Essence on the line` : ''}
                      </p>
                    </div>
                  )}
                </>
              )}

              {tab === 'binder' && (
                <>
                  <h2 className="section-title">Steam Binder</h2>
                  <p className="section-kicker">
                    Every hero and every piece of gear is a collectible card. Click one to flip it and read the fine print.
                  </p>
                  <div className="binder-grid">
                    {binderCards.map((card) => (
                      <button
                        type="button"
                        key={card.key}
                        className={`flip-card ${flipped[card.key] ? 'flipped' : ''}`}
                        onClick={() =>
                          setFlipped((f) => ({ ...f, [card.key]: !f[card.key] }))
                        }
                      >
                        <div className="flip-inner">
                          <div className={`face item-card ${card.rarity}`}>
                            <span className="rarity-tag">{RARITY[card.rarity].label}</span>
                            <SteamMark />
                            <div className="card-art">
                              <img src={card.img} alt="" />
                            </div>
                            <h3>{card.name}</h3>
                            <div className="meta">{card.kind}</div>
                          </div>
                          <div className="face back">
                            <span className="rarity-tag" style={{ color: RARITY[card.rarity].color }}>
                              {RARITY[card.rarity].label}
                            </span>
                            <h3>{card.name}</h3>
                            <p className="lore">{card.lore}</p>
                            <div className="facts">
                              {card.facts.map(([k, v]) => (
                                <div key={k}>
                                  <b>{k}:</b> {v}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {tab === 'market' && (
                <>
                  <h2 className="section-title">Market</h2>
                  <p className="section-kicker">
                    Listings from other summoners, plus a 10-for-1 rarity fusion you can try right now.
                  </p>
                  <div className="market-layout">
                    <div className="panel">
                      <h3 style={{ marginBottom: 8, fontSize: 15 }}>Live-style listings</h3>
                      {MARKET_LISTINGS.map((row) => {
                        const item = itemById(row.itemId);
                        return (
                          <div className="listing" key={`${row.itemId}-${row.seller}`}>
                            <img src={item.img} alt="" />
                            <div>
                              <strong>{item.name}</strong>
                              <div className="who">
                                {row.seller} · {RARITY[item.rarity].label}
                              </div>
                            </div>
                            <div>x{row.qty}</div>
                            <div className="price">{formatMoney(row.price)}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="panel">
                      <h3 style={{ marginBottom: 6, fontSize: 15 }}>10-for-1 Rarity Fusion</h3>
                      <p className="section-kicker">
                        Drop 10 sparks of one rarity into the circle and fuse them into a single spark of the next rarity up.
                      </p>
                      <div className="fuse-row">
                        {FUSION_ORDER.map((r) => (
                          <div className="spark-count" key={r}>
                            <div className="n">{sparks[r] || 0}</div>
                            <div className="l" style={{ color: RARITY[r].color }}>
                              {RARITY[r].label}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="fuse-controls">
                        <select
                          className="sel"
                          value={fuseFrom}
                          onChange={(e) => setFuseFrom(e.target.value)}
                        >
                          {FUSION_ORDER.slice(0, -1).map((r) => (
                            <option key={r} value={r}>
                              Fuse 10 {RARITY[r].label}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="btn btn-gold" onClick={fuse}>
                          Fuse
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </main>

            <aside className="side-pane">
              <h2 className="loadout-title">Loadout and Sync</h2>
              <div className="divider-ornament">
                <span className="diamond" />
              </div>
              <div className="slot-list">
                {SLOT_ORDER.map((slot) => {
                  const equipped = itemById(loadout[slot]);
                  return (
                    <div className="slot-row" key={slot}>
                      <div className="lbl">{SLOT_LABELS[slot]}</div>
                      <button
                        type="button"
                        className={`slot-box ${equipped ? equipped.rarity : 'empty'}`}
                        onClick={() => setSwapSlot(swapSlot === slot ? null : slot)}
                        aria-label={`${SLOT_LABELS[slot]} slot`}
                      >
                        {equipped ? (
                          <img src={equipped.img} alt={equipped.name} />
                        ) : (
                          <>
                            <span className="empty-ico">▭</span>
                            <span className="empty-txt">{EMPTY_SLOT_COPY[slot]}</span>
                            <span className="lock">🔒</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              {swapSlot && (
                <div className="swap-pop" style={{ top: 86 + SLOT_ORDER.indexOf(swapSlot) * 84 }}>
                  <h4>Swap {SLOT_LABELS[swapSlot]}</h4>
                  <button
                    type="button"
                    className={`swap-opt ${!loadout[swapSlot] ? 'on' : ''}`}
                    onClick={() => {
                      setLoadout((l) => ({ ...l, [swapSlot]: null }));
                      setSwapSlot(null);
                    }}
                  >
                    <span>Clear slot</span>
                  </button>
                  {GEAR.filter((g) => g.slot === swapSlot).map((g) => (
                    <button
                      type="button"
                      key={g.id}
                      className={`swap-opt ${loadout[swapSlot] === g.id ? 'on' : ''}`}
                      onClick={() => {
                        setLoadout((l) => ({ ...l, [swapSlot]: g.id }));
                        setSwapSlot(null);
                        toast(`${g.name} is on your ${SLOT_LABELS[swapSlot].toLowerCase()} slot.`);
                      }}
                    >
                      <img src={g.img} alt="" />
                      <span>
                        {g.name}
                        <div className="sub">{RARITY[g.rarity].label}</div>
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="load-actions">
                <button type="button" className="btn-block btn-desktop" onClick={showOnDesktop}>
                  <Icon name="monitor" />
                  Show on Desktop
                </button>
                <button type="button" className="btn-block btn-boost" onClick={sendBoost}>
                  <Icon name="boost" />
                  Send Boost to PC
                </button>
              </div>
              <p className="essence-note">Rift Essence: {essence.toLocaleString()}</p>
            </aside>
          </div>
        </div>
      </div>

      {desktopModal && (
        <div className="modal-back" onClick={() => setDesktopModal(false)} role="presentation">
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="desk-title"
          >
            <button type="button" className="close-x" onClick={() => setDesktopModal(false)} aria-label="Close">
              ×
            </button>
            <h2 id="desk-title">Steam Desktop Clicker</h2>
            <p>
              Your summoner lives on the desktop while you work. Every click and keystroke charges the circle. Every 30 minutes, something steps through.
            </p>
            <img
              className="preview"
              src="/art/desktop-overlay-mockup.png"
              alt="OverSummoned desktop clicker overlay with a spinning summoning circle, a summoner on the pedestal, and a coming drop timer"
            />
            <p>
              Personality chatter, swappable Era heroes, snap-on gear, and Steam drops are all part of the plan. This companion preview is where those drops come to play when you pick up your phone.
            </p>
            <button type="button" className="btn btn-gold" onClick={() => setDesktopModal(false)}>
              Close preview
            </button>
          </div>
        </div>
      )}

      {syncOpen && (
        <div className="modal-back" onClick={() => setSyncOpen(false)} role="presentation">
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="sync-title"
          >
            <button type="button" className="close-x" onClick={() => setSyncOpen(false)} aria-label="Close">
              ×
            </button>
            <h2 id="sync-title">Live on your desktop</h2>
            <p>
              {hero.name} is standing at the circle with your current loadout. The next drop still lands in {formatTime(dropSeconds)}.
            </p>
            <div className="sync-stage">
              <div className="circle" />
              <img src={hero.img} alt={hero.name} />
            </div>
            <button type="button" className="btn btn-gold" onClick={() => setSyncOpen(false)}>
              Looks good
            </button>
          </div>
        </div>
      )}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>
            {t.message}
          </div>
        ))}
      </div>
      {floats.map((f) => (
        <div key={f.id} className="click-float" style={{ left: f.x, top: f.y }}>
          {f.text}
        </div>
      ))}
    </>
  );
}
