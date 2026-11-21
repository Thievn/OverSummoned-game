import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { itemVoices, sheet } from '../copy.js';

const TipContext = createContext(null);

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse), (max-width: 759px)');
    const apply = () => setCoarse(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);
  return coarse;
}

export function TooltipBody({ item }) {
  const voice = itemVoices[item.id];
  return (
    <div className="tip-body">
      <p className="tip-name">{item.name}</p>
      <p className="tip-meta">
        <span className="tip-rarity">{item.rarity}</span>
        <span className="tip-ilvl nums">
          {sheet.itemLevel} {item.itemLevel}
        </span>
      </p>
      <p className="tip-slot">
        {item.slot} / {item.type}
      </p>
      {item.primary.length > 0 && (
        <ul className="tip-primary">
          {item.primary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {item.secondary.length > 0 && (
        <ul className="tip-secondary">
          {item.secondary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {item.effect && <p className="tip-effect">{item.effect}</p>}
      <p className="tip-flavor">{item.flavor}</p>
      <p className="tip-era">{item.era}</p>
      <p className="tip-trade">{item.trade}</p>
      <p className="tip-dura">{item.durability}</p>
      {voice && <p className="tip-voice">&quot;{voice}&quot;</p>}
    </div>
  );
}

function placeTip(anchor, node) {
  const rect = anchor.getBoundingClientRect();
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  let left = rect.left;
  let top = rect.bottom + 8;
  if (left + width > window.innerWidth - 8) left = window.innerWidth - 8 - width;
  if (left < 8) left = 8;
  if (top + height > window.innerHeight - 8) top = rect.top - height - 8;
  if (top < 8) top = 8;
  return { left, top };
}

export function TipProvider({ children }) {
  const coarse = useCoarsePointer();
  const [tip, setTip] = useState(null);
  const [pos, setPos] = useState(null);
  const timer = useRef(null);
  const tipRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Escape' || !tip) return;
      event.preventDefault();
      event.stopPropagation();
      setTip(null);
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [tip]);

  useLayoutEffect(() => {
    if (!tip || tip.sheet || !tipRef.current || !tip.el) {
      setPos(null);
      return;
    }
    setPos(placeTip(tip.el, tipRef.current));
  }, [tip]);

  useEffect(() => {
    if (!tip || tip.sheet) return undefined;
    function nudge() {
      setTip((current) => (current ? { ...current, tick: (current.tick || 0) + 1 } : current));
    }
    window.addEventListener('scroll', nudge, true);
    window.addEventListener('resize', nudge);
    return () => {
      window.removeEventListener('scroll', nudge, true);
      window.removeEventListener('resize', nudge);
    };
  }, [tip?.item?.id, tip?.sheet, tip?.pinned]);

  useEffect(() => {
    if (tip?.sheet) closeRef.current?.focus();
  }, [tip?.sheet, tip?.item?.id]);

  const api = {
    hover(item, el) {
      if (coarse) return;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        setTip({ item, el, pinned: false, sheet: false });
      }, 150);
    },
    leave() {
      clearTimeout(timer.current);
      setTip((current) => (current?.pinned ? current : null));
    },
    pin(item, el) {
      clearTimeout(timer.current);
      if (coarse) {
        setTip((current) =>
          current?.sheet && current.item.id === item.id
            ? null
            : { item, el, pinned: true, sheet: true },
        );
        return;
      }
      setTip((current) => {
        if (current?.pinned && current.item.id === item.id) return null;
        return { item, el, pinned: true, sheet: false };
      });
    },
    focus(item, el) {
      clearTimeout(timer.current);
      setTip((current) => {
        if (current?.pinned && current.item.id === item.id) return current;
        return { item, el, pinned: false, sheet: coarse };
      });
    },
    blur() {
      setTip((current) => (current?.pinned ? current : null));
    },
    close() {
      clearTimeout(timer.current);
      setTip(null);
    },
  };

  return (
    <TipContext.Provider value={api}>
      {children}
      {tip?.sheet && (
        <div className="tip-layer">
          <button type="button" className="tip-backdrop" aria-label={sheet.closeItem} onClick={api.close} />
          <div
            className={`tip-sheet rarity-${tip.item.rarity.toLowerCase()}`}
            role="dialog"
            aria-modal="true"
            aria-label={tip.item.name}
          >
            <TooltipBody item={tip.item} />
            <button ref={closeRef} type="button" className="text-button" onClick={api.close}>
              {sheet.closeItem}
            </button>
          </div>
        </div>
      )}
      {tip && !tip.sheet && (
        <div
          ref={tipRef}
          className={`tip rarity-${tip.item.rarity.toLowerCase()}`}
          role="tooltip"
          style={pos ? { left: `${pos.left}px`, top: `${pos.top}px` } : { left: '-9999px', top: '0px' }}
        >
          <TooltipBody item={tip.item} />
        </div>
      )}
    </TipContext.Provider>
  );
}

export function ItemButton({ item, className, children, label }) {
  const api = useContext(TipContext);
  const ref = useRef(null);
  const pointing = useRef(false);
  return (
    <button
      ref={ref}
      type="button"
      className={className}
      aria-label={label || item.name}
      onPointerDown={() => {
        pointing.current = true;
      }}
      onPointerUp={() => {
        pointing.current = false;
      }}
      onPointerCancel={() => {
        pointing.current = false;
      }}
      onMouseEnter={() => api.hover(item, ref.current)}
      onMouseLeave={() => api.leave()}
      onFocus={() => {
        if (pointing.current) return;
        api.focus(item, ref.current);
      }}
      onBlur={() => api.blur()}
      onClick={(event) => {
        event.stopPropagation();
        api.pin(item, ref.current);
      }}
    >
      {children}
    </button>
  );
}
