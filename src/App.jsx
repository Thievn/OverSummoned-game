import { useRef, useState } from 'react';
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

  return (
    <TipProvider>
      <div inert={sheetId ? true : undefined}>
        <Header />
        <main>
          <Hero onOpen={openSheet} />
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
