// OverSummoned sound: every click, stamp, haul and reveal has a sound, with music under it.
// Settings are per device (localStorage) and are changed from the account screen. Nothing plays until the
// first tap or key press, because browsers do not allow it sooner.
(function () {
  const BASE = '/assets/v2/sfx/', VER = '?v=1127h';
  // name: [volume, pitch wobble (so a sound heard hundreds of times never sounds mechanical), least seconds between plays]
  const SFX = { click: [.5, .05, .04], tab: [.5, .04, .06], back: [.5, .03, .06], confirm: [.6, .02, .08], stamp: [.6, .06, .05],
    haul: [.55, .05, .12], splash: [.5, .06, .15], lock: [.55, .04, .15], dig: [.55, .06, .15], rare: [.7, 0, .3], coin: [.6, .04, .1],
    crate: [.75, 0, .2], summon: [.85, 0, .5], levelup: [.8, 0, .5], flip: [.5, .05, .08], toast: [.3, .03, .25], deny: [.5, 0, .15],
    hit: [.55, .08, .07], win: [.8, 0, .5] };
  // Every tune, and the battle pool the Raids screen picks from. A boss plays its own era's theme once you are inside.
  const MUSIC = { home: 'music_home', raid: 'music_raid', med: 'music_med', sun: 'music_sun', north: 'music_north', jazz: 'music_jazz',
    b_ancient: 'music_b_ancient', b_noir: 'music_b_noir', b_north: 'music_b_north', b_gothic: 'music_b_gothic', b_romp: 'music_b_romp' };
  const BATTLE = ['raid', 'b_ancient', 'b_noir', 'b_north', 'b_gothic', 'b_romp'];
  const KEY = 'os_sound', DEF = { sfx: true, music: true, vol: .8, mvol: .35 };
  let set = Object.assign({}, DEF); try { Object.assign(set, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  let ctx = null, master = null, mgain = null, bufs = {}, last = {}, cur = null, want = null, unlocked = false;

  function boot() {
    if (ctx) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = set.vol; master.connect(ctx.destination);
    mgain = ctx.createGain(); mgain.gain.value = 0; mgain.connect(ctx.destination);
  }
  function load(file) {
    if (!bufs[file]) bufs[file] = fetch(BASE + file + '.mp3' + VER).then(r => r.ok ? r.arrayBuffer() : Promise.reject(0)).then(a => new Promise((ok, bad) => ctx.decodeAudioData(a, ok, bad))).catch(() => null);
    return bufs[file];
  }
  function unlock() {
    if (unlocked) return; boot(); if (!ctx) return; unlocked = true; if (ctx.state === 'suspended') ctx.resume();
    ['click', 'tab', 'back', 'stamp', 'haul', 'toast'].forEach(load); if (want) music(want);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, unlock, { capture: true, passive: true }));

  function play(name, opt) {
    const d = SFX[name]; if (!d || !set.sfx || !unlocked || document.hidden) return;
    const t = ctx.currentTime; if (last[name] && t - last[name] < d[2]) return; last[name] = t;
    load(name).then(buf => { if (!buf) return; const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf;
      s.playbackRate.value = (opt && opt.rate || 1) * (1 + (Math.random() * 2 - 1) * d[1]); g.gain.value = d[0] * (opt && opt.vol != null ? opt.vol : 1);
      s.connect(g); g.connect(master); s.start(); });
  }
  // One loop at a time, faded in and out; asking for the one already playing does nothing.
  // `track` can be an array, or 'battle' for the raid pool: one is picked at random, and a track already playing
  // from that pool is left alone, so walking in and out of a screen does not restart the music every time.
  function music(track) {
    if (track === 'battle') track = BATTLE;
    if (Array.isArray(track)) {
      const have = track.filter(t => MUSIC[t]);
      if (!have.length) { track = null; }
      else if (cur && have.some(t => MUSIC[t] === cur.file)) { want = cur.pool = have; return; }
      else track = have[Math.floor(Math.random() * have.length)];
    }
    want = track; if (!unlocked) return; const file = set.music && track ? MUSIC[track] : null;
    if (cur && cur.file === file) return;
    const t = ctx.currentTime; if (cur) { const old = cur; old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(0, t + 1.2); setTimeout(() => { try { old.s.stop(); } catch (e) { } }, 1400); cur = null; }
    if (!file) return; const mine = cur = { file, g: ctx.createGain(), s: null }; mine.g.gain.value = 0; mine.g.connect(ctx.destination);
    load(file).then(buf => {
      if (cur !== mine) return;
      // a track whose file is not there yet falls back to the old battle theme rather than going silent
      if (!buf) { if (file !== MUSIC.raid && BATTLE.indexOf(track) >= 0) { cur = null; music('raid'); } return; }
      const s = mine.s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.connect(mine.g); s.start();
      const n = ctx.currentTime; mine.g.gain.setValueAtTime(0, n); mine.g.gain.linearRampToValueAtTime(set.mvol, n + 2); });
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(set)); } catch (e) { } }
  function config(patch) {
    if (patch) { Object.assign(set, patch); save(); if (master) master.gain.value = set.vol; if (cur && cur.g) cur.g.gain.value = set.mvol;
      if ('music' in patch || 'mvol' in patch) { const w = want; if (!set.music) { music(null); want = w; } else if (w) { if (cur && cur.file) cur.g.gain.value = set.mvol; else music(w); } } }
    return Object.assign({}, set);
  }
  addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (unlocked) ctx.resume(); });

  // Every button makes a sound without each one having to ask: navigation flicks, closing things tocks, cards flip,
  // everything else clicks. data-snd="name" picks another sound, data-snd="none" stays silent (it plays its own).
  addEventListener('click', e => {
    const n = e.target.closest('[data-snd],button,a.btn,.btn,[data-go],.card,.prow,select,summary,input[type=checkbox],input[type=range],a.kin,a.hcard,nav a');
    if (!n || n.disabled) return; const own = n.closest('[data-snd]'); if (own) { if (own.dataset.snd !== 'none') play(own.dataset.snd); return; }
    if (n.closest('#modal-x,.x,.backbtn,.back') || n.dataset.go === 'home') play('back');
    else if (n.closest('#gnav,.atabs,[data-go]') || n.matches('a.kin,a.hcard,nav a')) play('tab');
    else if (n.classList.contains('card')) play('flip');
    else play('click');
  }, true);

  const Sound = { play, music, config, unlock };
  (typeof OS !== 'undefined' ? OS : (window.OS = window.OS || {})).Sound = Sound; window.OSSound = Sound;
})();
