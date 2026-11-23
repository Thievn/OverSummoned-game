// "New update" bar and the short what's-new window. Reads /updates.json and compares the newest
// entry with the last one this device has seen. First visits stay quiet; they just remember.
(function () {
  var KEY = 'os_update_seen';
  var busy = false;
  var reload = false; // a new version took over while the page was open
  function seen() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function markSeen(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function when(d) {
    var t = new Date(d + 'T12:00:00');
    return isNaN(t) ? d : t.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});
  }
  function removeBar() { var b = document.getElementById('upd-bar'); if (b) b.remove(); document.documentElement.classList.remove('has-upd'); }

  function openModal(list, latest) {
    var dlg = document.getElementById('upd-dlg');
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'upd-dlg'; dlg.className = 'upd-dlg'; dlg.setAttribute('aria-labelledby', 'upd-title'); document.body.appendChild(dlg); }
    dlg.innerHTML = '<div class="upd-in"><button class="upd-x" type="button" aria-label="Close">\u00d7</button>' +
      '<div class="upd-eb">Update log</div><h2 id="upd-title">What\u2019s new in OverSummoned</h2>' +
      list.map(function (e) {
        return '<section class="upd-entry"><div class="upd-when">' + esc(when(e.date)) + '</div><h3>' + esc(e.title) + '</h3><ul>' +
          e.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul></section>';
      }).join('') +
      '<div class="upd-acts"><a class="upd-all" href="/updates">See the full update log</a><button class="upd-ok" type="button">' + (reload ? 'Play the new version' : 'Got it') + '</button></div></div>';
    function done() { markSeen(latest); removeBar(); if (dlg.open) dlg.close(); if (reload) location.reload(); }
    dlg.querySelector('.upd-x').onclick = done;
    dlg.querySelector('.upd-ok').onclick = done;
    dlg.querySelector('.upd-all').onclick = function () { markSeen(latest); };
    dlg.addEventListener('cancel', done, {once: true});
    dlg.addEventListener('click', function (ev) { if (ev.target === dlg) done(); });
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  function showBar(list, latest) {
    if (document.getElementById('upd-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'upd-bar'; bar.className = 'upd-bar'; bar.setAttribute('role', 'status');
    bar.innerHTML = '<button class="upd-open" type="button"><span class="upd-dot" aria-hidden="true"></span>New update! Tap to see what\u2019s new</button>' +
      '<button class="upd-close" type="button" aria-label="Dismiss">\u00d7</button>';
    bar.querySelector('.upd-open').onclick = function () { openModal(list, latest); };
    bar.querySelector('.upd-close').onclick = function () { markSeen(latest); removeBar(); };
    document.body.insertBefore(bar, document.body.firstChild);
    document.documentElement.classList.add('has-upd');
  }

  function check(opts) {
    if (opts && opts.reload) reload = true;
    if (busy) return Promise.resolve();
    busy = true;
    return fetch('/updates.json', {cache: 'no-cache'}).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      busy = false;
      if (!d || !d.entries || !d.entries.length) return;
      var latest = d.entries[0].v, last = seen();
      if (location.pathname === '/updates' || location.pathname === '/updates.html') { markSeen(latest); return; }
      if (!last) { markSeen(latest); return; }
      if (last === latest) return;
      var newer = [];
      for (var i = 0; i < d.entries.length && d.entries[i].v !== last && newer.length < 2; i++) newer.push(d.entries[i]);
      showBar(newer.length ? newer : [d.entries[0]], latest);
    }).catch(function () { busy = false; });
  }

  window.osUpdates = {check: check};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check); else check();
})();
