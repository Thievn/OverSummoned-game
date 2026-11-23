// Installable app: registers the service worker, runs the Install button (Android and desktop
// prompt, iOS home screen hint) and tells the update bar when a new version has taken over.
(function () {
  var root = document.documentElement;
  var deferred = null;
  var ua = navigator.userAgent || '';
  var ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function installed() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function track(name) { try { if (window.gtag) gtag('event', name); } catch (e) {} }
  function sync() { root.classList.toggle('can-install', !installed() && (!!deferred || ios)); }
  if (installed()) root.classList.add('is-app');

  addEventListener('beforeinstallprompt', function (ev) { ev.preventDefault(); deferred = ev; sync(); });
  addEventListener('appinstalled', function () { deferred = null; sync(); track('app_installed'); });

  var SHARE = '<svg class="share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Share"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/></svg>';
  function iosHint() {
    var d = document.getElementById('ios-hint');
    if (!d) {
      d = document.createElement('dialog'); d.id = 'ios-hint'; d.className = 'ios-hint'; d.setAttribute('aria-labelledby', 'ios-hint-t');
      d.innerHTML = '<div class="in"><button class="x" type="button" aria-label="Close">\u00d7</button>' +
        '<h2 id="ios-hint-t">Put OverSummoned on your Home Screen</h2>' +
        '<ol><li>Tap the Share button ' + SHARE + ' in your browser bar.</li><li>Scroll down and choose <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. The city opens full screen from your new icon.</li></ol>' +
        '<button class="btn c ok" type="button">Got it</button><span class="arrow" aria-hidden="true">The Share button is usually at the bottom of the screen \u2193</span></div>';
      document.body.appendChild(d);
      var shut = function () { if (d.open) d.close(); };
      d.querySelector('.x').onclick = shut; d.querySelector('.ok').onclick = shut;
      d.addEventListener('click', function (ev) { if (ev.target === d) shut(); });
    }
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
    track('install_hint_ios');
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-install]');
    if (!b) return;
    ev.preventDefault();
    if (deferred) {
      var p = deferred; deferred = null; sync();
      p.prompt();
      p.userChoice.then(function (c) { track(c && c.outcome === 'accepted' ? 'install_accepted' : 'install_dismissed'); }).catch(function () {});
    } else if (ios) iosHint();
  });
  window.osPwa = {hint: iosHint, sync: sync};
  sync();

  if (!('serviceWorker' in navigator) || !(location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
  var hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    // A new version took over while this page was open: let the update bar offer a fresh load.
    if (hadController && window.osUpdates) window.osUpdates.check({reload: true});
    hadController = true;
  });
  addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', {scope: '/'}).then(function (reg) {
      var poke = function () { reg.update().catch(function () {}); if (window.osUpdates) window.osUpdates.check(); };
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') poke(); });
      setInterval(poke, 30 * 60 * 1000);
    }).catch(function () {});
  });
})();
