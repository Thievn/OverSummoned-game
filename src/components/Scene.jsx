import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { coverMetrics } from '../ground.js';

const SceneContext = createContext({
  metrics: null,
  toPoint() {
    return { x: 0, y: 0 };
  },
});

export function useScene() {
  return useContext(SceneContext);
}

export function Scene({ id, bg, className = '', priority = false, label, children }) {
  const ref = useRef(null);
  const [metrics, setMetrics] = useState(null);
  const [near, setNear] = useState(priority);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    if (priority) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: '600px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    if (!near) return undefined;
    let dead = false;
    const image = new Image();
    image.onload = () => {
      if (!dead) setPainted(true);
    };
    image.onerror = () => {
      if (!dead) setPainted(true);
    };
    image.src = bg;
    return () => {
      dead = true;
    };
  }, [near, bg]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const apply = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      const next = coverMetrics(w, h);
      el.style.setProperty('--ground-top', `${next.ground}px`);
      setMetrics({ ...next, w, h });
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const api = useMemo(
    () => ({
      metrics,
      toPoint(imageX, imageY) {
        if (!metrics) return { x: 0, y: 0 };
        return {
          x: metrics.offsetX + imageX * metrics.scale,
          y: metrics.offsetY + imageY * metrics.scale,
        };
      },
    }),
    [metrics],
  );

  return (
    <section
      id={id}
      ref={ref}
      className={`scene ${painted ? 'is-painted' : ''} ${metrics ? 'is-measured' : ''} ${className}`}
      style={painted ? { backgroundImage: `url("${bg}")` } : undefined}
      aria-label={label}
    >
      <div className="scene-vignette" aria-hidden="true" />
      <SceneContext.Provider value={api}>{children}</SceneContext.Provider>
    </section>
  );
}
