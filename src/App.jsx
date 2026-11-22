import { useEffect, useRef, useState } from 'react';
import Encounter from './components/Encounter.jsx';
import { TipProvider } from './components/Tips.jsx';
import { About, BottomBand, Footer, Header, Hero, InfoGrid } from './components/Shell.jsx';
import { CardRow, CharacterSheet, LootStrip, RarityLadder } from './components/Roster.jsx';

export default function App() {
  const [sheetId, setSheetId] = useState(null);
  const opener = useRef(null);

  function openSheet(id, event) {
    opener.current = event?.currentTarget ?? null;
    setSheetId(id);
  }

  function closeSheet() {
    setSheetId(null);
    const node = opener.current;
    opener.current = null;
    window.setTimeout(() => node?.focus?.(), 0);
  }

  useEffect(() => {
    const nodes = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))),
      { threshold: 0.12 },
    );
    nodes.forEach((n) => io.observe(n));
    const onMove = (e) => {
      document.documentElement.style.setProperty('--mx', (e.clientX / window.innerWidth - 0.5).toFixed(3));
      document.documentElement.style.setProperty('--my', (e.clientY / window.innerHeight - 0.5).toFixed(3));
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <TipProvider>
      <div inert={sheetId ? true : undefined}>
        <Header />
        <main>
          <Hero onOpen={openSheet} />
          <Encounter />
          <About />
          <CardRow activeId={sheetId} onOpen={openSheet} />
          <RarityLadder />
          <LootStrip />
          <InfoGrid />
          <BottomBand />
        </main>
        <Footer />
      </div>
      {sheetId ? <CharacterSheet cardId={sheetId} onClose={closeSheet} /> : null}
    </TipProvider>
  );
}
