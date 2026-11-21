import { City } from './components/City.jsx';
import { Close } from './components/Close.jsx';
import { Descent } from './components/Descent.jsx';
import { Hero } from './components/Hero.jsx';
import { Origins } from './components/Origins.jsx';
import { Scars } from './components/Scars.jsx';

export default function App() {
  return (
    <>
      <a className="skip" href="#content">Skip to the mess</a>
      <header className="nav">
        <a className="brand" href="#top">OverSummoned</a>
        <nav className="nav-links" aria-label="Page">
          <a href="#origins">Origins</a>
          <a href="#descent">Descent</a>
          <a href="#city">City</a>
          <a href="#scars">Scars</a>
        </nav>
        <a className="btn btn-gold btn-small" href="#waitlist">Get in line</a>
      </header>
      <main id="content">
        <Hero />
        <Origins />
        <Descent />
        <City />
        <Scars />
        <Close />
      </main>
    </>
  );
}
