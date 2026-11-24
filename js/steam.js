// Steam sign-in on the public pages. The old email and Google sign-in stays
// behind ?owner=1 as the owner's spare key while Steam is new.
(function () {
  var STEAM = 'https://steamcommunity.com/openid/login';
  function go() {
    var origin = location.origin;
    var q = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': origin + '/steam',
      'openid.realm': origin,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    });
    location.href = STEAM + '?' + q.toString();
  }
  document.querySelectorAll('[data-steam-login]').forEach(function (b) { b.addEventListener('click', go); });
  if (/[?&]owner=1/.test(location.search)) {
    var o = document.getElementById('owner-login');
    if (o) o.hidden = false;
  }
})();
