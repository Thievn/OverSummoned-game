// Finishes a Steam sign-in: sends Steam's answer to the steam-auth function,
// then trades the one-time token for a normal session and opens the city.
(function () {
  var SB = 'https://eresamyqxarlrdgudgrw.supabase.co';
  var KEY = 'sb_publishable_VZn5RjVsoRhLhYW87TJY3Q_CrgicMQF';
  var t = document.getElementById('sr-title'), x = document.getElementById('sr-text');
  function stop(title, text) {
    t.textContent = title; x.textContent = text;
    document.getElementById('sr-acts').hidden = false;
    document.getElementById('sr-smudge').classList.remove('spin');
  }
  var params = {};
  new URLSearchParams(location.search).forEach(function (v, k) { if (k.indexOf('openid.') === 0) params[k] = v; });
  if (params['openid.mode'] !== 'id_res') { stop('No sign-in happened', 'Steam was closed before it finished. Try again from the front gate.'); return; }
  fetch(SB + '/functions/v1/steam-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ params: params }) })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.ok && d.token_hash) {
        var c = window.supabase.createClient(SB, KEY, { auth: { persistSession: true } });
        return c.auth.verifyOtp({ token_hash: d.token_hash, type: 'magiclink' }).then(function (res) {
          if (res.error) throw res.error;
          t.textContent = 'Welcome back.'; x.textContent = 'Opening the city…';
          location.replace('/play');
        });
      }
      if (d.why === 'not on the list') {
        stop('Your name isn’t in the ledger yet', 'The city is invite-only while we build. Your Steam ID is ' + d.steamId + '. If you were invited, send that number to the owner.');
      } else {
        stop('That didn’t work', 'Steam could not confirm the sign-in. Try again from the front gate.');
      }
    })
    .catch(function () { stop('That didn’t work', 'The city is busy. Try again in a moment.'); });
})();
