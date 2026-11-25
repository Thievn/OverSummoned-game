// A world map for the owner's office: one glowing dot per place visitors came from, sized by how many,
// and a ping that walks through the most recent visits. Canvas only; the coastline is one small file.
(function () {
  const LAND = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';
  const TOP = 82, BOT = -57;                                  // the latitudes worth showing
  let rings = null, loading = null;
  function decode(t) {
    const [kx, ky] = t.transform.scale, [dx, dy] = t.transform.translate;
    const arcs = t.arcs.map(a => { let x = 0, y = 0; return a.map(p => { x += p[0]; y += p[1]; return [x * kx + dx, y * ky + dy]; }); });
    const ring = ids => { const out = []; ids.forEach(i => { const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i]; a.forEach((p, j) => { if (j || !out.length) out.push(p); }); }); return out; };
    const all = []; t.objects.land.geometries.forEach(g => (g.type === 'Polygon' ? [g.arcs] : g.arcs).forEach(poly => poly.forEach(r => all.push(ring(r))))); return all;
  }
  const land = () => loading || (loading = fetch(LAND).then(r => r.json()).then(t => { rings = decode(t); }).catch(() => { rings = []; }));
  const name = c => { try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(c) || c; } catch (e) { return c; } };
  const flag = () => '';

  function mount(host, data) {
    if (host._geo) host._geo.stop();
    host.innerHTML = '<canvas></canvas><div class="geo-tip"></div><div class="geo-now"></div>';
    const cv = host.firstChild, tip = host.children[1], nowEl = host.children[2], ctx = cv.getContext('2d');
    const places = (data.places || []).filter(p => p.lat != null && p.lon != null), recent = (data.recent || []).filter(p => p.lat != null && p.lon != null);
    const max = Math.max(1, ...places.map(p => p.visitors));
    let W = 0, H = 0, dead = false, raf = 0, t0 = performance.now(), hover = null;
    const X = lon => (lon + 180) / 360 * W, Y = lat => (TOP - lat) / (TOP - BOT) * H;
    const R = p => 3 + 9 * Math.sqrt(p.visitors / max);
    function size() { const w = host.clientWidth, dpr = Math.min(2, devicePixelRatio || 1); W = w; H = Math.round(w * (TOP - BOT) / 360); cv.style.width = w + 'px'; cv.style.height = H + 'px'; cv.width = Math.round(w * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function frame(now) {
      if (dead) return; if (host.clientWidth !== W) size(); const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      // graticule
      ctx.strokeStyle = 'rgba(120,140,200,.10)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let lon = -150; lon <= 150; lon += 30) { ctx.moveTo(X(lon), 0); ctx.lineTo(X(lon), H); }
      for (let lat = -30; lat <= 60; lat += 30) { ctx.moveTo(0, Y(lat)); ctx.lineTo(W, Y(lat)); } ctx.stroke();
      // land
      if (rings && rings.length) { ctx.beginPath(); rings.forEach(r => { let cut = false; r.forEach((p, i) => { if (i && Math.abs(p[0] - r[i - 1][0]) > 180) cut = true; (i && !(Math.abs(p[0] - r[i - 1][0]) > 180)) ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1])); }); if (!cut) ctx.closePath(); });
        ctx.fillStyle = '#1b2850'; ctx.fill('evenodd'); ctx.strokeStyle = 'rgba(96,120,190,.55)'; ctx.lineWidth = .8; ctx.stroke(); }
      // a slow sweep, so the map is never still
      const sx = (t * 0.06 % 1) * W, g = ctx.createLinearGradient(sx - 140, 0, sx, 0); g.addColorStop(0, 'rgba(63,224,197,0)'); g.addColorStop(1, 'rgba(63,224,197,.10)'); ctx.fillStyle = g; ctx.fillRect(sx - 140, 0, 140, H);
      // places
      places.forEach((p, i) => { const x = X(p.lon), y = Y(p.lat), r = R(p), ph = (t * 0.55 + i * 0.37) % 1;
        ctx.beginPath(); ctx.arc(x, y, r + ph * (10 + r * 1.6), 0, 7); ctx.strokeStyle = `rgba(63,224,197,${0.55 * (1 - ph)})`; ctx.lineWidth = 1.5; ctx.stroke();
        const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6); gl.addColorStop(0, 'rgba(63,224,197,.55)'); gl.addColorStop(1, 'rgba(63,224,197,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = p === hover ? '#fff' : '#9ffff0'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#0b1020'; ctx.stroke(); });
      // the latest visits, one at a time
      if (recent.length) { const step = 2.4, k = Math.floor(t / step) % recent.length, v = recent[k], ph = (t % step) / step, x = X(v.lon), y = Y(v.lat);
        ctx.beginPath(); ctx.arc(x, y, 4 + ph * 34, 0, 7); ctx.strokeStyle = `rgba(242,185,53,${1 - ph})`; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fillStyle = '#f2b935'; ctx.fill();
        if (nowEl._k !== k) { nowEl._k = k; nowEl.textContent = `${v.city ? v.city + ', ' : ''}${name(v.country)} · ${v.path} · ${ago(v.at)}`; nowEl.classList.remove('in'); void nowEl.offsetWidth; nowEl.classList.add('in'); } }
      else if (!places.length && !nowEl.textContent) nowEl.textContent = 'No located visits yet. They appear here as people arrive.';
      raf = requestAnimationFrame(frame);
    }
    const ago = at => { const s = Math.max(0, (Date.now() - new Date(at)) / 1000); return s < 90 ? 'just now' : s < 5400 ? Math.round(s / 60) + ' min ago' : s < 129600 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago'; };
    cv.addEventListener('mousemove', e => { const b = cv.getBoundingClientRect(), mx = e.clientX - b.left, my = e.clientY - b.top; let best = null, bd = 18;
      places.forEach(p => { const d = Math.hypot(X(p.lon) - mx, Y(p.lat) - my) - R(p); if (d < bd) { bd = d; best = p; } }); hover = best;
      if (best) { tip.textContent = `${best.city ? best.city + ', ' : ''}${name(best.country)}: ${best.visitors} visitor${best.visitors === 1 ? '' : 's'}, ${best.views} view${best.views === 1 ? '' : 's'}`; tip.style.left = Math.min(W - 230, Math.max(0, mx + 14)) + 'px'; tip.style.top = Math.max(0, my - 34) + 'px'; tip.classList.add('on'); } else tip.classList.remove('on'); });
    cv.addEventListener('mouseleave', () => { hover = null; tip.classList.remove('on'); });
    size(); land(); raf = requestAnimationFrame(frame);
    host._geo = { stop() { dead = true; cancelAnimationFrame(raf); } };
  }
  window.GeoMap = { mount, name, flag, _decode: decode };
})();
