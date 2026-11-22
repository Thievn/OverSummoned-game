import { useEffect, useRef, useState } from 'react';
import Sprite from './Sprite.jsx';
import { pixelPortrait } from '../sprites.js';
import { cardById, cardList, equippedItems, itemList, sheetSlots } from '../catalog.js';
import { combineGear, formatSigned, otherGearLines, overstatRows } from '../gear.js';
import { bios, flip, heroes, knowhow, loot, rarity, rarityTiers, sheet, slots } from '../copy.js';
import { ItemButton } from './Tips.jsx';

const dollOrder = ['head', 'main', 'chest', 'off', 'legs', 'feet'];

function rarityOf(name) {
  return rarityTiers.find((tier) => tier.name === name);
}

function FlipCard({ card, active, onOpen }) {
  const [flipped, setFlipped] = useState(false);
  const tier = rarityOf(card.rarity);
  const gear = equippedItems(card.id).slice(0, 5);
  const [skillName, ...skillRest] = knowhow[card.id].split('. ');
  return (
    <div
      className={`flip-card rarity-${tier.id}${flipped ? ' flipped' : ''}`}
      style={{ '--tier': tier.color }}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setFlipped(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setFlipped(false)}
    >
      <button
        type="button"
        className="flip-hit"
        aria-pressed={flipped}
        aria-label={`${card.name}, ${card.title}, ${card.rarity}`}
        onClick={() => setFlipped((v) => !v)}
      >
        <span className="flip-inner">
          <span className="flip-face flip-front">
            <span className="gem" aria-hidden="true" />
            <img className="pixel portrait" src={pixelPortrait(card.id)} alt="" width="192" height="256" loading="lazy" />
            <span className="card-name">{card.name}</span>
            <span className="card-title">{card.rarity} {card.title}</span>
            <span className="card-stats">
              <span><small>{sheet.guard}</small><b className="nums">{card.guard}</b></span>
              <span><small>{sheet.might}</small><b className="nums">{card.might}</b></span>
              <span><small>{sheet.knack}</small><b className="nums">{card.knack}</b></span>
            </span>
          </span>
          <span className="flip-face flip-back">
            <span className="back-stage">
              {flipped ? <Sprite id={card.id} anim="skill" scale={3} ms={110} x={70} y={154} /> : <Sprite id={card.id} anim="idle" scale={3} x={70} y={154} />}
            </span>
            <span className="skill-name">{skillName}.</span>
            <span className="skill-text">{skillRest.join('. ')}</span>
            <span className="gear-row" aria-hidden="true">
              {gear.map((item) => (
                <img key={item.id} className={`pixel rarity-${rarityOf(item.rarity).id}`} src={item.icon} alt="" width="28" height="28" />
              ))}
            </span>
          </span>
        </span>
      </button>
      <button type="button" className="sheet-link" aria-expanded={active} onClick={(event) => onOpen(card.id, event)}>
        {flip.sheet}
      </button>
    </div>
  );
}

export function CardRow({ activeId, onOpen }) {
  return (
    <section className="band wrap reveal" id="origins">
      <div className="section-head">
        <h2>{heroes.title}</h2>
        <p className="lead">{heroes.lead}</p>
      </div>
      <div className="card-row">
        {cardList.map((card) => (
          <FlipCard key={card.id} card={card} active={activeId === card.id} onOpen={onOpen} />
        ))}
      </div>
      <p className="hint">{flip.hint}</p>
    </section>
  );
}

function Slot({ slotKey, item }) {
  const label = slots[slotKey];
  const tier = item ? rarityOf(item.rarity) : null;
  if (!item) {
    return (
      <div className={`slot-wrap slot-${slotKey}`}>
        <div className="slot empty">
          <span className="slot-label">{label}</span>
          <span className="slot-state">{slotKey === 'anomaly' ? sheet.anomalyLocked : sheet.empty}</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`slot-wrap slot-${slotKey}`}>
      <ItemButton
        item={item}
        className={`slot filled rarity-${tier.id}`}
        label={`${label}: ${item.name}`}
      >
        <img className="pixel" src={item.icon} alt="" width="64" height="64" />
      </ItemButton>
      <span className="slot-label">{label}</span>
    </div>
  );
}

export function CharacterSheet({ cardId, onClose }) {
  const card = cardById(cardId);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const gearSlots = sheetSlots(card.id);
  const gear = combineGear(equippedItems(card.id));
  const rows = overstatRows(card, gear);
  const extras = otherGearLines(gear);
  const tier = rarityOf(card.rarity);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function trapTab(event) {
    if (event.key !== 'Tab') return;
    const root = panelRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll('button, [href], input, select, textarea')].filter(
      (node) => !node.disabled,
    );
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="sheet-back" onMouseDown={onClose}>
      <div
        className="sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-name"
        ref={panelRef}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={trapTab}
      >
        <div className="sheet-head">
          <div>
            <p className="kicker">{card.title}</p>
            <h2 id="sheet-name">{card.name}</h2>
          </div>
          <button ref={closeRef} type="button" className="text-button" onClick={onClose}>
            {sheet.close}
          </button>
        </div>
        <div className="sheet-grid">
          <div className="sheet-portrait">
            <img className="pixel" src={pixelPortrait(card.id)} alt="" width="288" height="384" />
            <span className="sheet-sprite"><Sprite id={card.id} anim="skill" scale={2} x={0} y={0} /></span>
          </div>
          <div className="sheet-copy">
            <p className="sheet-rarity" style={{ color: tier.color }}>
              <img
                src={`/assets/oversummoned/frames/gem_${tier.id}.png`}
                alt=""
                width="36"
                height="36"
              />
              <span>{card.rarity}</span>
            </p>
            <p className="era">{card.era}</p>
            <h3>{sheet.know}</h3>
            <p>{knowhow[card.id]}</p>
            <p className="bio">{bios[card.id]}</p>
          </div>
          <div className="doll">
            <div className="doll-main">
              {dollOrder.map((slotKey) => (
                <Slot key={slotKey} slotKey={slotKey} item={gearSlots[slotKey]} />
              ))}
            </div>
            <div className="doll-row">
              {['ring1', 'ring2', 'trinket1', 'trinket2'].map((slotKey) => (
                <Slot key={slotKey} slotKey={slotKey} item={gearSlots[slotKey]} />
              ))}
            </div>
            <div className="doll-row anomaly-row">
              <Slot slotKey="anomaly" item={gearSlots.anomaly} />
            </div>
            <div className="belt">
              <p className="kicker">{sheet.belt}</p>
              <div className="doll-row">
                {gearSlots.belt.map((item, index) => (
                  <div key={index} className="slot-wrap">
                    <div className="slot empty">
                      <span className="slot-label">{sheet.consumable}</span>
                      <span className="slot-state">{sheet.empty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="stat-table">
            <p className="kicker">{sheet.withGear}</p>
            <table>
              <thead>
                <tr>
                  <th scope="col" />
                  <th scope="col">{sheet.base}</th>
                  <th scope="col">{sheet.gear}</th>
                  <th scope="col">{sheet.total}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <th scope="row">
                      <img
                        src={`/assets/oversummoned/frames/icon_${row.key}.png`}
                        alt=""
                        width="16"
                        height="16"
                      />
                      {row.label}
                    </th>
                    <td className="nums">{row.base}</td>
                    <td className="nums">{formatSigned(row.gear)}</td>
                    <td className="nums total">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {extras.length > 0 && (
              <p className="also">
                <span className="kicker">{sheet.also}</span> {extras.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RarityLadder() {
  return (
    <section className="band wrap reveal" id="rarity">
      <h2>{rarity.title}</h2>
      <p className="lead">{rarity.line}</p>
      <div className="rarity-row">
        {rarityTiers.map((tier) => (
          <figure key={tier.id} className={`rarity-card rarity-${tier.id}`}>
            <span className="rarity-frame" style={{ '--tier': tier.color }}>
              <img className="pixel" src={pixelPortrait('office_worker')} alt={`Kevin Latham, ${tier.name}`} width="144" height="192" loading="lazy" />
            </span>
            <figcaption style={{ color: tier.color }}>
              <img
                src={`/assets/oversummoned/frames/gem_${tier.id}.png`}
                alt=""
                width="28"
                height="28"
                loading="lazy"
              />
              <span>{tier.name}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function LootStrip() {
  return (
    <section className="band wrap reveal" id="loot">
      <h2>{loot.title}</h2>
      <p className="hint">{loot.hint}</p>
      <div className="loot-row">
        {itemList.map((item) => {
          const tier = rarityOf(item.rarity);
          return (
            <ItemButton key={item.id} item={item} className={`loot-btn rarity-${tier.id}`}>
              <img className="pixel" src={item.icon} alt="" width="64" height="64" />
            </ItemButton>
          );
        })}
      </div>
    </section>
  );
}
