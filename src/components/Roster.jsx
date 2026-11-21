import { useEffect, useRef } from 'react';
import { cardById, cardList, equippedItems, itemList, sheetSlots } from '../catalog.js';
import { combineGear, formatSigned, otherGearLines, overstatRows } from '../gear.js';
import { bios, heroes, knowhow, loot, rarity, rarityTiers, sheet, slots } from '../copy.js';
import { ItemButton } from './Tips.jsx';

const dollOrder = ['head', 'main', 'chest', 'off', 'legs', 'feet'];

function rarityOf(name) {
  return rarityTiers.find((tier) => tier.name === name);
}

export function CardRow({ activeId, onOpen }) {
  return (
    <section className="band wrap" id="origins">
      <h2>{heroes.title}</h2>
      <p className="lead">{heroes.lead}</p>
      <div className="card-row">
        {cardList.map((card) => (
          <button
            key={card.id}
            type="button"
            className="card-hit"
            aria-expanded={activeId === card.id}
            onClick={(event) => onOpen(card.id, event)}
          >
            <picture>
              <source media="(max-width: 759px)" srcSet={card.thumb} type="image/webp" />
              <img
                src={card.card}
                alt={`${card.name}, ${card.title}, ${card.rarity}`}
                width="300"
                height="470"
                loading="lazy"
                decoding="async"
              />
            </picture>
          </button>
        ))}
      </div>
      <p className="hint">{heroes.hint}</p>
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
          <img
            className="sheet-portrait"
            src={card.portrait}
            alt=""
            width="864"
            height="1152"
          />
          <div className="sheet-copy">
            <p className="sheet-rarity" style={{ color: tier.color }}>
              <img
                src={`/assets/oversummoned/frames/gem_${tier.id}.png`}
                alt=""
                width="36"
                height="36"
              />
              <span>{card.rarity}</span>
              <span className="shape">{tier.shape}</span>
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
            <p className="knack-rule">{sheet.knackRule}</p>
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
    <section className="band wrap" id="rarity">
      <h2>{rarity.title}</h2>
      <p className="lead">{rarity.line}</p>
      <div className="rarity-row">
        {rarityTiers.map((tier) => (
          <figure key={tier.id} className={`rarity-card rarity-${tier.id}`}>
            <img
              src={`/assets/oversummoned/rarity-demo/kevin_${tier.id}.webp`}
              alt={`Kevin Latham, ${tier.name}, ${tier.shape}`}
              width="300"
              height="470"
              loading="lazy"
              decoding="async"
            />
            <figcaption style={{ color: tier.color }}>
              <img
                src={`/assets/oversummoned/frames/gem_${tier.id}.png`}
                alt=""
                width="28"
                height="28"
                loading="lazy"
              />
              <span>{tier.name}</span>
              <span className="visually-hidden">{tier.shape}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function LootStrip() {
  return (
    <section className="band wrap" id="loot">
      <h2>{loot.title}</h2>
      <p className="lead">{loot.line}</p>
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
