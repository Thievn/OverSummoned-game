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

const emblemIcons = ['trench_lantern', 'hi_vis_vest', 'violin_case', 'black_ledger'];
const emblems = emblemIcons.map((id) => (
  <img key={id} className="emblem pixel" src={`/assets/oversummoned/icons/${id}.png`} alt="" width="48" height="48" />
));

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
    <section className="band wrap reveal" id="about">
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
    <div className="wrap bands reveal">
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
