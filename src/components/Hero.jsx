import { useEffect, useRef } from 'react';
import art from 'virtual:art';
import { ASSET } from '../data.js';
import { Scene, useScene } from './Scene.jsx';
import { Sprite } from './Sprite.jsx';
import { WaitlistForm } from './WaitlistForm.jsx';

const WIDE = [
  ['hunter', '52%', 3],
  ['office_worker', '59%', 4],
  ['paramedic', '66%', 5],
  ['legionary', '73%', 4],
  ['engineer', '80%', 3],
  ['gangster', '87%', 5],
];

const NARROW = [
  ['hunter', '16%', 3],
  ['legionary', '40%', 4],
  ['paramedic', '62%', 5],
  ['gangster', '86%', 4],
];

function SummonCircle() {
  const { metrics, toPoint } = useScene();
  if (!metrics) return null;
  const point = toPoint(816, 454);
  const width = 280 * metrics.scale;
  return (
    <>
      <div
        className="summon-flame fx"
        style={{ left: point.x, top: point.y, height: 220 * metrics.scale }}
        aria-hidden="true"
      />
      <div
        className="summon-circle fx"
        style={{ left: point.x, top: point.y, width, height: width * 0.36 }}
        aria-hidden="true"
      />
    </>
  );
}

function Embers() {
  const canvasRef = useRef(null);
  const { metrics, toPoint } = useScene();

  useEffect(() => {
    if (!metrics) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    let running = true;
    let raf = 0;

    const resize = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();

    const origin = () => toPoint(816, 468);
    const spawn = () => {
      const o = origin();
      return {
        x: o.x + (Math.random() - 0.5) * 70 * metrics.scale,
        y: o.y + (Math.random() - 0.4) * 16 * metrics.scale,
        vy: 0.35 + Math.random() * 0.8,
        drift: Math.random() * Math.PI * 2,
        life: 40 + Math.random() * 50,
        max: 90,
        size: 2 + Math.floor(Math.random() * 2),
        color: Math.random() > 0.7 ? '#f0c36a' : '#e07030',
      };
    };
    const parts = Array.from({ length: 32 }, spawn);

    const frame = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const part of parts) {
        part.y -= part.vy;
        part.drift += 0.04;
        part.x += Math.sin(part.drift) * 0.25;
        part.life -= 1;
        if (part.life <= 0) Object.assign(part, spawn());
        ctx.globalAlpha = Math.max(0, part.life / part.max) * 0.85;
        ctx.fillStyle = part.color;
        ctx.fillRect(
          Math.round(part.x * dpr),
          Math.round(part.y * dpr),
          part.size * dpr,
          part.size * dpr,
        );
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    raf = requestAnimationFrame(frame);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [metrics, toPoint]);

  return <canvas ref={canvasRef} className="embers fx" aria-hidden="true" />;
}

function Crowd() {
  const { metrics } = useScene();
  if (!metrics) return null;
  const narrow = metrics.w < 900;
  const scale = metrics.w < 1200 ? 2 : 3;
  const lineup = narrow ? NARROW : WIDE;
  return lineup.map(([id, feetX, zIndex]) => (
    <Sprite key={id} characterId={id} anim="idle" scale={scale} feetX={feetX} zIndex={zIndex} />
  ));
}

export function Hero() {
  const bg = `${ASSET}${art.backgrounds.bg_summoning_chamber.file}`;
  return (
    <Scene id="top" className="hero-scene" bg={bg} priority label="The summoning chamber">
      <div className="hero-copy">
        <p className="kicker">The Overflow lands every week</p>
        <img
          className="wordmark"
          src={`${ASSET}logo/oversummoned_wordmark_pixel_1x.png`}
          width="284"
          height="34"
          alt="OverSummoned"
        />
        <h1>The kingdom asked for a hero. It got you.</h1>
        <p className="lede">
          A ritual asked for one hero and got every century of Earth instead. The locals call you the Summoned. They are not saying it kindly.
        </p>
        <WaitlistForm idPrefix="hero" />
      </div>
      <SummonCircle />
      <Embers />
      <Crowd />
    </Scene>
  );
}
