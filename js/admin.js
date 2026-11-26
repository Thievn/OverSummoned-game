// The owner's office. The server refuses every number here to anyone but the owner.
(async function () {
  const me = await Cloud.require(); if (!me.admin) { location.replace('/play'); return; }
  const OS = await window.OS.load(), R = OS.R, $ = id => document.getElementById(id), el = OS.el, num = OS.num;
  const A = '#14a08b', B = '#c2800c';
  function fake() { const days = []; for (let i = 29; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), v = Math.round(20 + Math.random() * 40 + (29 - i) * 2); days.push({ d, visitors: v, views: Math.round(v * (2 + Math.random())), signups: Math.round(Math.random() * 5), summons: Math.round(Math.random() * 30), active: Math.round(v / 4) }); }
    return { totals: { accounts: 41, players: 37, views_today: 212, visitors_today: 88, views_7d: 1310, visitors_7d: 402, active_24h: 19, summons: 512, gold: 88210, ink: 402100 }, days, paths: [{ k: '/', n: 800 }, { k: '/play', n: 380 }, { k: '/login', n: 130 }], refs: [{ k: 'direct', n: 600 }, { k: 'google.com', n: 300 }, { k: 't.co', n: 120 }], events: [{ k: 'summon', n: 140 }, { k: 'raid', n: 60 }, { k: 'crate', n: 44 }], owned: { kevin: 37, lola: 6, raspawtin: 1, astrid: 9 },
      players: [{ username: 'DevOtter', email: 'dev@local', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), total_level: 20, heroes: 4, gold: 1200, ink: 3000, summons: 5, steam: false }] }; }
  let D;
  let G = null;
  async function load() { if (Cloud.dev) { D = fake(); return; } const { data, error } = await Cloud.sb.rpc('os2_admin_stats'); try { const g = await Cloud.sb.rpc('os2_admin_geo', { p_days: 30 }); G = g.error ? null : g.data; } catch (e) { G = null; } if (error) { toast('The office is locked: ' + error.message); D = D || fake(); return; } D = data; }
  function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2600); }
  const tip = $('ctip'), showTip = (html, x, y) => { tip.innerHTML = html; tip.style.display = 'block'; tip.style.width = 'auto'; tip.style.left = Math.min(innerWidth - tip.offsetWidth - 8, x + 14) + 'px'; tip.style.top = Math.max(8, y - tip.offsetHeight - 10) + 'px'; }, hideTip = () => tip.style.display = 'none';
  const short = d => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const nice = m => { if (m <= 5) return 5; const p = Math.pow(10, Math.floor(Math.log10(m))), f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; };

  // ---- charts: one y axis, thin marks, hover everywhere, a table behind every chart
  function chart(host, days, series, kind) {
    const W = 560, H = 220, L = 38, Rr = 12, T = 12, Bm = 26, pw = W - L - Rr, ph = H - T - Bm, max = nice(Math.max(1, ...days.flatMap(d => series.map(s => d[s.key])))), n = days.length;
    const x = i => L + (kind === 'bar' ? (i + .5) * pw / n : i * pw / (n - 1)), y = v => T + ph - v / max * ph;
    let g = ''; for (let k = 0; k <= 4; k++) { const v = max * k / 4; g += `<line x1="${L}" x2="${W - Rr}" y1="${y(v)}" y2="${y(v)}" stroke="#24305a" stroke-width="1"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${num(v)}</text>`; }
    for (let i = 0; i < n; i += 7) g += `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${short(days[i].d)}</text>`;
    let marks = '';
    if (kind === 'bar') { const bw = Math.max(3, pw / n - 3); days.forEach((d, i) => { const v = d[series[0].key], h = v / max * ph; if (v > 0) marks += `<path class="grow" style="animation-delay:${i * 12}ms" d="M${x(i) - bw / 2},${T + ph} v${-Math.max(0, h - 3)} q0,-3 3,-3 h${bw - 6} q3,0 3,3 v${Math.max(0, h - 3)} z" fill="${series[0].color}"/>`; }); }
    else series.forEach((s, si) => { const pts = days.map((d, i) => `${x(i).toFixed(1)},${y(d[s.key]).toFixed(1)}`).join(' '); marks += `<polyline class="draw" points="${pts}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" pathLength="1"/>`; const last = days[n - 1]; marks += `<circle cx="${x(n - 1)}" cy="${y(last[s.key])}" r="4" fill="${s.color}" stroke="#141d3b" stroke-width="2"/>`; });
    host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="cv" role="img" aria-label="${series.map(s => s.name).join(' and ')} per day for the last 30 days">${g}${marks}<line class="cross" y1="${T}" y2="${T + ph}" stroke="#8892b0" stroke-width="1" opacity="0"/><rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent"/></svg>`;
    const svg = host.querySelector('svg'), cross = svg.querySelector('.cross');
    svg.addEventListener('mousemove', e => { const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * W, i = Math.max(0, Math.min(n - 1, kind === 'bar' ? Math.floor((px - L) / pw * n) : Math.round((px - L) / pw * (n - 1)))), d = days[i]; cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('opacity', 1);
      showTip(`<div class="tn" style="font-size:.95rem">${short(d.d)}</div>` + series.map(s => `<div><i class="sw" style="background:${s.color}"></i>${s.name}: <b>${num(d[s.key])}</b></div>`).join(''), e.clientX, e.clientY); });
    svg.addEventListener('mouseleave', () => { cross.setAttribute('opacity', 0); hideTip(); });
    host._table = () => `<table class="atable"><tr><th>Day</th>${series.map(s => `<th>${s.name}</th>`).join('')}</tr>${days.slice().reverse().map(d => `<tr><td>${short(d.d)}</td>${series.map(s => `<td>${num(d[s.key])}</td>`).join('')}</tr>`).join('')}</table>`;
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-table]'); if (!b) return; const host = $(b.dataset.table); if (host.dataset.mode === 't') { host.dataset.mode = ''; b.textContent = 'Table'; renderOverview(); } else { host.dataset.mode = 't'; b.textContent = 'Chart'; host.innerHTML = `<div style="max-height:220px;overflow:auto">${host._table()}</div>`; } });
  const hbars = (host, rows) => { const mx = Math.max(1, ...rows.map(r => r.n)); host.innerHTML = rows.length ? rows.map(r => `<div class="hb"><span>${r.k}</span><i><b style="width:${r.n / mx * 100}%"></b></i><em>${num(r.n)}</em></div>`).join('') : '<p class="mut">Nothing recorded yet.</p>'; };
  const tiles = (host, rows) => host.innerHTML = rows.map(([a, b, c]) => `<div class="stat"><b data-count="${b}">0</b><span>${a}</span>${c ? `<small>${c}</small>` : ''}</div>`).join('');
  function countUp() { document.querySelectorAll('[data-count]').forEach(n => { const to = +n.dataset.count, t0 = performance.now(); const step = t => { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); n.textContent = num(to * e); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }); }

  function renderOverview() { const t = D.totals;
    tiles($('o-tiles'), [['Visitors today', t.visitors_today, num(t.visitors_7d) + ' this week'], ['Page views today', t.views_today, num(t.views_7d) + ' this week'], ['Accounts', t.accounts, num(t.players) + ' with a name'], ['Active in 24h', t.active_24h], ['Summons, all time', t.summons], ['Gold out there', t.gold, num(t.ink) + ' ink']]);
    if ($('c-traffic').dataset.mode !== 't') chart($('c-traffic'), D.days, [{ key: 'visitors', name: 'Visitors', color: A }, { key: 'views', name: 'Page views', color: B }], 'line');
    if ($('c-signups').dataset.mode !== 't') chart($('c-signups'), D.days, [{ key: 'signups', name: 'New accounts', color: A }], 'bar');
    if ($('c-summons').dataset.mode !== 't') chart($('c-summons'), D.days, [{ key: 'summons', name: 'Summons', color: A }], 'bar');
    if ($('c-active').dataset.mode !== 't') chart($('c-active'), D.days, [{ key: 'active', name: 'Active players', color: A }], 'line');
    hbars($('o-paths'), D.paths); hbars($('o-refs'), D.refs); countUp(); renderGeo(); }
  function renderGeo() { const g = G || { places: [], countries: [], recent: [], located: 0, unknown: 0 };
    $('g-sum').textContent = g.located ? `${num(g.located)} visitor${g.located === 1 ? '' : 's'} from ${g.countries.length} countr${g.countries.length === 1 ? 'y' : 'ies'}` : 'Waiting for the first located visit';
    GeoMap.mount($('g-map'), g); hbars($('g-list'), g.countries.slice(0, 8).map(c => ({ k: GeoMap.name(c.country), n: c.visitors }))); }
  function renderPlayers() { const q = $('p-search').value.toLowerCase(), rows = D.players.filter(p => !q || (p.username + ' ' + p.email).toLowerCase().includes(q)), ago = d => { if (!d) return 'never'; const s = (Date.now() - new Date(d)) / 1000; return s < 3600 ? Math.round(s / 60) + 'm ago' : s < 86400 ? Math.round(s / 3600) + 'h ago' : Math.round(s / 86400) + 'd ago'; };
    $('p-table').innerHTML = '<tr><th>Player</th><th>Email</th><th>Joined</th><th>Last seen</th><th>Total level</th><th>Arrivals</th><th>Summons</th><th>Gold</th><th>Ink</th><th>Steam</th></tr>' + rows.map(p => `<tr><td><b>${p.username}</b></td><td>${p.email}</td><td>${new Date(p.created_at).toLocaleDateString()}</td><td>${ago(p.updated_at)}</td><td>${p.total_level || 0}</td><td>${p.heroes || 0}</td><td>${p.summons || 0}</td><td>${num(p.gold || 0)}</td><td>${num(p.ink || 0)}</td><td>${p.steam ? 'Yes' : 'No'}</td></tr>`).join(''); }
  function renderHeroes() { const g = $('a-hgrid'); if (g.children.length) return; $('hc').textContent = `${R.heroes.length} characters`; const players = Math.max(1, D.totals.players);
    R.heroes.slice().sort((a, b) => R.rarities.indexOf(b.rarity) - R.rarities.indexOf(a.rarity)).forEach(h => { const w = el('div', 'acard'); w.appendChild(OS.card(h)); const n = D.owned[h.id] || 0; w.appendChild(el('div', 'mut', `Owned by <b style="color:#fff">${n}</b> of ${players} players (${Math.round(n / players * 100)}%) · gear at ${R.places.find(p => p.id === h.place).name}`)); g.appendChild(w); }); }
  function renderItems() { const kind = $('i-kind').value, place = $('i-place').value, list = Object.values(OS.items).filter(i => (!kind || i.kind === kind) && (!place || i.place === place)).sort((a, b) => R.rarities.indexOf(b.rarity) - R.rarities.indexOf(a.rarity) || a.name.localeCompare(b.name));
    const g = $('a-igrid'); g.innerHTML = ''; list.forEach(i => g.appendChild(OS.slot(i.id)));
    const chance = i => { const p = R.places.find(p => p.id === i.place), row = p && p.loot.find(l => l[0] === i.id); if (!row) return ''; const tot = p.loot.reduce((a, l) => a + l[1], 0), c = row[1] / tot * 100; return (c >= 1 ? c.toFixed(1) : c.toFixed(2)) + '%'; };
    $('i-table').innerHTML = '<tr><th></th><th>Item</th><th>Kind</th><th>Rarity</th><th>Stats</th><th>Found at</th><th>Base drop chance</th><th>Sells for</th></tr>' + list.map(i => `<tr><td><img src="${OS.img('loot', i.icon)}" alt="" style="width:32px;height:32px;object-fit:contain"></td><td><b style="color:${R.rarity_color[i.rarity]}">${i.name}</b><div class="mut" style="font-size:.78rem">${i.flavor}</div></td><td>${i.kind === 'gear' ? i.slot : i.kind}</td><td>${OS.cap(i.rarity)}</td><td>${i.stats ? Object.entries(i.stats).map(([k, v]) => `+${v} ${OS.statWord[k]}`).join(', ') : ''}${i.owner ? '<div class="mut" style="font-size:.78rem">' + OS.heroes[i.owner].name + '</div>' : ''}</td><td>${(R.places.find(p => p.id === i.place) || {}).name || ''}</td><td>${chance(i)}</td><td>${i.sell}</td></tr>`).join(''); }
  function renderEconomy() { const t = D.totals, p = Math.max(1, t.players); tiles($('e-tiles'), [['Gold per player', Math.round(t.gold / p)], ['Ink per player', Math.round(t.ink / p)], ['Summons per player', Math.round(t.summons / p)], ['Next summon costs, new player', R.summon.base_ink + R.summon.per_unique], ['Daily sell cap, new player', R.gold.daily_sell_cap_base + 4 * R.gold.daily_sell_cap_per_level]]);
    const w = R.summon.weights, tot = Object.values(w).reduce((a, b) => a + b, 0), mx = Math.max(...Object.values(w)); $('e-odds').innerHTML = R.rarities.map(r => `<span class="r-${r}" style="color:var(--rc)">${OS.cap(r)} (${R.heroes.filter(h => h.rarity === r).length})</span><i class="r-${r}"><b style="width:${Math.sqrt(w[r] / mx) * 100}%"></b></i><span>${(w[r] / tot * 100).toFixed(w[r] < 1 ? 2 : 1)}% · 1 in ${num(Math.round(tot / w[r]))}</span>`).join('');
    hbars($('e-events'), D.events);
    $('e-pace').innerHTML = '<tr><th>Place tier</th><th>Seconds per haul</th><th>Skill xp per haul (web)</th><th>Ink per haul (web)</th><th>Keys per haul (desktop)</th></tr>' + Object.entries(R.tier).map(([k, v]) => `<tr><td>Tier ${k}</td><td>${v.seconds}</td><td>${Math.round(v.xp * R.web.xp_mult)}</td><td>${Math.round(v.ink * R.web.ink_mult)}</td><td>${v.keys}</td></tr>`).join('') + `<tr><td colspan="5" class="mut">Level 99 needs ${num(R.xp_table[98])} xp. Job slots open at total level ${R.jobs.slots.join(', ')}. Energy refills in ${Math.round(R.energy.max * R.energy.regen_seconds / 3600)} hours. Raid tickets: one every ${R.raids.regen_minutes} minutes.</td></tr>`; countUp(); }
  // ---- marketing studio
  let plat = 'tiktok';
  function renderStudio() { const s = $('m-what'); if (s.options.length) return; s.appendChild(new Option('The game as a whole', 'OverSummoned as a whole: a desktop pet otter who summons strangers from history while you type'));
    const g1 = document.createElement('optgroup'); g1.label = 'A character'; R.heroes.forEach(h => g1.appendChild(new Option(`${h.name} (${h.rarity})`, `The character ${h.name}, a ${h.species} ${h.title} from ${h.era}, rarity ${h.rarity}. Bio: ${h.bio}`))); s.appendChild(g1);
    const g2 = document.createElement('optgroup'); g2.label = 'A place'; R.places.forEach(p => g2.appendChild(new Option(p.name, `The location ${p.name} (${p.era}), where Smudge goes ${p.skill.toLowerCase()}. ${p.blurb}`))); s.appendChild(g2);
    const g3 = document.createElement('optgroup'); g3.label = 'An item'; Object.values(OS.items).filter(i => i.kind === 'gear').forEach(i => g3.appendChild(new Option(i.name, `The item ${i.name}, signature ${i.slot} of ${OS.heroes[i.owner].name}. Flavor text: ${i.flavor}`))); s.appendChild(g3); }
  $('m-plat').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; plat = b.dataset.p;[...$('m-plat').children].forEach(x => x.classList.toggle('on', x === b)); });
  async function ai(mode, button) { $('m-err').textContent = ''; const old = button.textContent; button.disabled = true; button.textContent = mode === 'image' ? 'Painting…' : 'Writing…';
    try { if (Cloud.dev) throw new Error('The studio only works on the real site.'); const { data: { session } } = await Cloud.sb.auth.getSession();
      const r = await fetch('https://eresamyqxarlrdgudgrw.supabase.co/functions/v1/os-admin-ai', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ mode, platform: plat, subject: $('m-what').value, tone: $('m-tone').value, extra: $('m-extra').value }) }), out = await r.json();
      if (!out.ok) throw new Error(out.why || 'Grok did not answer.'); if (mode === 'image') { $('m-pic').innerHTML = `<img src="${out.image}" alt="Generated promo art" style="border-radius:12px;max-height:520px;margin:0 auto" class="popin">`; $('m-dl').href = out.image; $('m-dl').hidden = false; } else $('m-out').textContent = out.text;
    } catch (e) { $('m-err').textContent = e.message; } button.disabled = false; button.textContent = old; }
  $('m-copy').onclick = e => ai('copy', e.target); $('m-img').onclick = e => ai('image', e.target); $('m-clip').onclick = () => navigator.clipboard.writeText($('m-out').textContent).then(() => toast('Copied.'));


  // ---- beta: the wishlist, invites, codes and what testers have sent
  let BD = null, mailChecked = false; const hx = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), day = t => t ? new Date(t).toLocaleDateString() : '';
  async function beta(op, payload) { const { data, error } = await Cloud.sb.rpc('os2_admin_beta', { op, payload: payload || {} }); if (error) { toast('That did not work: ' + error.message); return null; } BD = data; return data; }
  async function betaFn(body) { try { const s = await Cloud.session(); const r = await fetch('https://eresamyqxarlrdgudgrw.supabase.co/functions/v1/beta', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + s.access_token }, body: JSON.stringify(body) }); return await r.json(); } catch (e) { return { ok: false, msg: 'No answer.' }; } }
  async function invite(email, button) { if (button) button.disabled = true; const r = await betaFn({ op: 'invite', email }); if (!r.ok) toast(r.msg || 'That did not work.'); else toast(r.mailed ? 'Invited. The email is on its way.' : 'Let in, but the email did NOT send. Tell them yourself.'); await beta('list'); paintBeta(); }
  function paintBeta() { if (!BD) return; const w = BD.waitlist, inv = BD.invites, fb = BD.feedback;
    tiles($('b-tiles'), [['On the wishlist', w.length], ['Waiting for an invite', w.filter(x => !x.allowed).length], ['Invited', inv.length], ['Joined', inv.filter(x => x.joined).length], ['New feedback', fb.filter(x => x.status === 'new').length]]); countUp();
    $('b-wait').innerHTML = '<tr><th>Email</th><th>Signed up</th><th>Status</th><th></th></tr>' + (w.map(x => `<tr><td>${hx(x.email)}</td><td>${day(x.at)}</td><td>${x.joined ? 'Playing' : x.allowed ? 'Invited ' + day(x.invited_at) : 'Waiting'}</td><td style="white-space:nowrap">${x.allowed ? '' : `<button class="btn small" data-inv="${hx(x.email)}">Invite</button>`} <button class="xbtn" data-del="${hx(x.email)}" data-joined="${x.joined ? 1 : ''}" title="Remove from the wishlist" aria-label="Remove ${hx(x.email)} from the wishlist">&times;</button></td></tr>`).join('') || '<tr><td colspan="4" class="mut">Nobody yet.</td></tr>');
    $('b-codes').innerHTML = '<tr><th>Code</th><th>For</th><th>Used</th><th>Made</th><th></th></tr>' + (BD.codes.map(k => `<tr><td><b>${hx(k.code)}</b></td><td>${hx(k.note)}</td><td>${k.uses} of ${k.max_uses}</td><td>${day(k.created_at)}</td><td>${k.revoked ? 'Switched off' : `<button class="btn small ghost" data-copy="${hx(k.code)}">Copy</button> <button class="btn small ghost" data-rev="${hx(k.code)}">Switch off</button>`}</td></tr>`).join('') || '<tr><td colspan="5" class="mut">No codes yet.</td></tr>');
    $('b-feed').innerHTML = '<tr><th>When</th><th>Who</th><th>Kind</th><th>What they said</th><th></th></tr>' + (fb.map(f => `<tr><td>${day(f.at)}</td><td>${hx(f.username || '')}<br><span class="mut">${hx(f.email || '')}</span></td><td>${hx(f.kind)}</td><td style="white-space:pre-wrap;max-width:34rem">${hx(f.body)}</td><td>${f.status === 'done' ? 'Done' : `<button class="btn small ghost" data-fb="${f.id}" data-st="${f.status === 'new' ? 'seen' : 'done'}">${f.status === 'new' ? 'Mark read' : 'Mark done'}</button>`}</td></tr>`).join('') || '<tr><td colspan="5" class="mut">Nothing yet.</td></tr>'); }
  async function renderBeta() { await beta('list'); paintBeta();
    if (!mailChecked) { mailChecked = true; const c = await betaFn({ op: 'check' }); $('b-mail').textContent = !c.ok ? 'Could not check email.' : c.key ? 'Email is ready. Sending as ' + c.from : 'Email is NOT set up: add RESEND_API_KEY to the Edge Function secrets in Supabase.'; } }
  $('a-beta').addEventListener('click', async e => { const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.inv) return invite(b.dataset.inv, b);
    if (b.dataset.del) { if (confirm(b.dataset.joined ? `Remove ${b.dataset.del} from the wishlist?\n\nThey already have an account, so the account and their place in the game stay.` : `Remove ${b.dataset.del} from the wishlist?\n\nIts invite and its place on the allow list go too, so you can test this address again from the start.`)) { await beta('wait_delete', { email: b.dataset.del }); paintBeta(); toast('Removed.'); } return; }
    if (b.dataset.copy) return navigator.clipboard.writeText(b.dataset.copy).then(() => toast('Copied.'));
    if (b.dataset.rev) { if (confirm('Switch this code off? People who already used it keep their place.')) { await beta('code_revoke', { code: b.dataset.rev }); paintBeta(); } return; }
    if (b.dataset.fb) { await beta('feedback_status', { id: +b.dataset.fb, status: b.dataset.st }); paintBeta(); return; }
    if (b.id === 'b-invite') { const v = $('b-email').value.trim(); if (v) { await invite(v, b); b.disabled = false; $('b-email').value = ''; } return; }
    if (b.id === 'b-code') { const d = await beta('code_new', { note: $('b-note').value, max_uses: +$('b-uses').value || 1 }); if (d && d.made) { toast('Made ' + d.made); $('b-note').value = ''; } paintBeta(); } });

  // ---------------------------------------------------------------- movement review
  // Every arrival standing the way they do in the game, so Dean can watch each one and flag a bad cut.
  // His notes live in os2_rig_note and Claude reads them back.
  let RIGN = {}, GPUPS = [];
  async function rigNotes(op, payload) {
    if (Cloud.dev) { if (op === 'set') RIGN[payload.hero] = payload; if (op === 'clear') delete RIGN[payload.hero]; return true; }
    const { data, error } = await Cloud.sb.rpc('os2_rig_notes', { op: op || 'list', payload: payload || {} });
    if (error || !data || !data.ok) { toast('Could not reach the notes.'); return false; }
    RIGN = {}; (data.notes || []).forEach(n => RIGN[n.hero] = n); return true;
  }
  async function renderRigs() {
    const grid = $('g-grid'); if (!grid._init) { grid._init = true; await rigNotes('list'); }
    GPUPS.forEach(p => p.destroy()); GPUPS = []; grid.innerHTML = '';
    const want = $('g-filter').value;
    R.heroes.forEach(h => {
      const n = RIGN[h.id] || { status: 'open', note: '' };
      if (want && n.status !== want) return;
      const c = document.createElement('div'); c.className = 'rcell s-' + n.status;
      c.innerHTML = `<div class="rstage"></div><div class="rname"><b>${h.name}</b><i>${h.species}</i></div>
        <div class="row rmoves"><button class="btn small ghost" data-m="act">Work</button><button class="btn small ghost" data-m="talk">Talk</button><button class="btn small ghost" data-m="cheer">Cheer</button><button class="btn small ghost" data-m="swing">Swing</button></div>
        <div class="row rmark"><button class="btn small ${n.status === 'ok' ? '' : 'ghost'}" data-s="ok">Looks right</button><button class="btn small ${n.status === 'problem' ? '' : 'ghost'}" data-s="problem">Problem</button></div>
        <textarea class="rnote" rows="2" placeholder="What looks wrong?">${(n.note || '').replace(/</g, '&lt;')}</textarea>
        <div class="rwhen mut">${n.status === 'fixed' ? 'Claude says this is fixed. Have another look.' : n.updated_at ? 'Noted ' + new Date(n.updated_at).toLocaleDateString() : ''}</div>`;
      grid.appendChild(c);
      const host = c.querySelector('.rstage'), e = OS.rig['h_' + h.id];
      if (window.DBCanvas && e) {
        const sc = Math.min(210 / e.size[1], 150 / e.size[0]);
        const p = new DBCanvas.Puppet(host, h.id, sc, { hero: true, px: [75, 214], ver: OS.VER }); GPUPS.push(p); c._p = p;
      }
      c.querySelector('.rmoves').onclick = ev => { const b = ev.target.closest('button'); if (!b || !c._p) return;
        if (b.dataset.m === 'swing') { const a = c._p.an; if (a && a.hasAnimation('act')) { const st = c._p.over('act', 1, 1); if (st) st.timeScale = 0.35; } }
        else if (b.dataset.m === 'talk') c._p.say(3); else if (b.dataset.m === 'cheer') c._p.cheer(3); else c._p.act(); };
      const save = async st => { const note = c.querySelector('.rnote').value.trim();
        if (await rigNotes('set', { hero: h.id, status: st, note })) renderRigs(); };
      c.querySelector('.rmark').onclick = ev => { const b = ev.target.closest('button'); if (b) save(b.dataset.s); };
      c.querySelector('.rnote').onchange = () => save(RIGN[h.id] && RIGN[h.id].status !== 'open' ? RIGN[h.id].status : 'problem');
    });
    if (!grid.children.length) grid.innerHTML = '<p class="mut">Nothing here.</p>';
  }

  const renderers = { rigs: renderRigs, overview: renderOverview, players: renderPlayers, heroes: renderHeroes, items: renderItems, economy: renderEconomy, studio: renderStudio, beta: renderBeta }; let cur = 'overview';
  function show(t) { cur = t; document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'a-' + t)); document.querySelectorAll('#atabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); renderers[t](); }
  $('atabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.t); });
  $('g-filter').onchange = renderRigs;
  $('g-all').onclick = () => { GPUPS.forEach((p, i) => setTimeout(() => { p.act(); setTimeout(() => p.say(2), 700); }, i * 120)); };
  $('p-search').addEventListener('input', renderPlayers); $('i-kind').onchange = renderItems; $('i-place').onchange = renderItems; R.places.forEach(p => $('i-place').appendChild(new Option(p.name, p.id)));
  $('refresh').onclick = async () => { await load(); show(cur); toast('Fresh numbers.'); };
  await load(); $('boot').remove(); show('overview');
})();
