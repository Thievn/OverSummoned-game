import GameScreen from './GameScreen.jsx';
import WaitlistForm from './WaitlistForm.jsx';
import {
  about,
  featureBlurbs,
  featuresIntro,
  footer,
  joke,
  join,
  legal,
  ledger,
  nav,
  pitch,
  rules,
  sections,
  signupTitle,
  skip,
  tagline,
} from '../copy.js';

function Emblem({ children }) {
  return (
    <svg className="emblem" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="3" y="3" width="58" height="58" rx="3" fill="#2a140f" stroke="#c6a15a" strokeWidth="2" />
      {children}
    </svg>
  );
}

const emblems = [
  <Emblem key="door">
    <path d="M20 50 V28 h24 v22" fill="none" stroke="#e4c27a" strokeWidth="1.6" />
    <path d="M24 50 V24 h16 v26" fill="#6e2a22" stroke="#f0d48a" strokeWidth="1.4" />
    <path d="M27 50 V36 h10 v14" fill="#1a0d0a" />
    <circle cx="35" cy="43" r="1.2" fill="#f0d48a" />
  </Emblem>,
  <Emblem key="gear">
    <path d="M24 18 h16 l2 6 h6 v8 l-6 2 v6 h-8 l-2 6 h-8 l-2 -6 h-8 v-6 l-6 -2 v-8 h6 l2 -6 z" fill="#8a6230" stroke="#f0d48a" strokeWidth="1.3" />
    <circle cx="32" cy="32" r="4" fill="#2a140f" stroke="#f0d48a" />
  </Emblem>,
  <Emblem key="trade">
    <circle cx="24" cy="28" r="9" fill="#8a6230" stroke="#f0d48a" strokeWidth="1.4" />
    <circle cx="40" cy="38" r="9" fill="#6e2a22" stroke="#f0d48a" strokeWidth="1.4" />
    <circle cx="24" cy="28" r="3" fill="none" stroke="#2a140f" strokeWidth="1.4" />
    <circle cx="40" cy="38" r="3" fill="none" stroke="#f0d48a" strokeWidth="1.4" />
  </Emblem>,
  <Emblem key="ledger">
    <path d="M16 16 h14 c6 4 6 28 0 32 H16 z" fill="#3a2414" stroke="#e4c27a" />
    <path d="M48 16 H34 c-6 4 -6 28 0 32 h14 z" fill="#4a301c" stroke="#e4c27a" />
    <path d="M22 26 h8 M22 32 h8 M22 38 h6 M36 26 h8 M36 32 h8 M36 38 h6" stroke="#f0d48a" strokeWidth="1.2" />
  </Emblem>,
];

export function Header() {
  return (
    <header className="site-header">
      <a className="skip" href="#waitlist">
        {skip}
      </a>
      <div className="header-bar wrap">
        <a className="brand" href="#waitlist">
          <img
            src="/assets/oversummoned/logo/oversummoned_logo.svg"
            alt="OverSummoned"
            width="2439"
            height="360"
            fetchPriority="high"
          />
        </a>
        <nav className="site-nav" aria-label="OverSummoned">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="btn header-join" href="#waitlist">
          {join}
        </a>
      </div>
      <p className="tagline">{tagline}</p>
    </header>
  );
}

export function Hero({ onOpen }) {
  return (
    <section className="hero" aria-labelledby="signup-title">
      <div className="hero-grid wrap">
        <section className="panel signup-panel" id="waitlist">
          <h1 id="signup-title">{signupTitle}</h1>
          {pitch.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p className="joke">{joke}</p>
          <WaitlistForm id="email-top" />
        </section>
        <div className="game-panel panel">
          <GameScreen onOpen={onOpen} />
        </div>
        <aside className="panel feature-panel" id="features">
          <h2>{featuresIntro}</h2>
          <ul className="feature-list">
            {featureBlurbs.map((feature, index) => (
              <li key={feature.title}>
                {emblems[index]}
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}

export function About() {
  return (
    <section className="band wrap" id="about">
      <h2>{about.title}</h2>
      <div className="steps">
        {about.steps.map((step, index) => (
          <p key={step} className="step">
            <span className="nums">{index + 1}</span>
            {step}
          </p>
        ))}
      </div>
    </section>
  );
}

export function InfoGrid() {
  return (
    <div className="wrap bands">
      <div className="info-grid">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="panel info-panel">
            <h2>{section.title}</h2>
            {section.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </section>
        ))}
      </div>
      <div className="info-grid rule-grid">
        <section id="rules" className="panel info-panel">
          <h2>{rules.title}</h2>
          {rules.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
        <section id="ledger" className="panel info-panel">
          <h2>{ledger.title}</h2>
          {ledger.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      </div>
    </div>
  );
}

export function BottomBand() {
  return (
    <section className="band wrap bottom-band" id="signup" aria-labelledby="bottom-title">
      <div className="panel signup-panel bottom-panel">
        <h2 id="bottom-title">{signupTitle}</h2>
        <WaitlistForm id="email-bottom" />
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <img
          src="/assets/oversummoned/logo/oversummoned_logo.svg"
          alt="OverSummoned"
          width="2439"
          height="360"
          loading="lazy"
        />
        <p>{footer.adults}</p>
        <p className="footer-links">
          <a href="#privacy">{footer.privacy}</a>
          <a href="#terms">{footer.terms}</a>
        </p>
        <section id="privacy">
          <h2>{legal.privacyTitle}</h2>
          {legal.privacy.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
        <section id="terms">
          <h2>{legal.termsTitle}</h2>
          {legal.terms.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      </div>
    </footer>
  );
}
