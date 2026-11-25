// Page-view counter for the pages that do not load the game's own code: the path, where the visit came from,
// a random per-browser id, and the rough place (country and city) the request arrived from. No IP address.
(function () {
  if (/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
  const URL = 'https://eresamyqxarlrdgudgrw.supabase.co/rest/v1/rpc/os2_track_geo', KEY = 'sb_publishable_VZn5RjVsoRhLhYW87TJY3Q_CrgicMQF';
  let sid; try { sid = localStorage.getItem('os_sid'); if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('os_sid', sid); } } catch (e) { sid = 'none'; }
  let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { } if (ref === location.hostname) ref = '';
  const send = g => fetch(URL, { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json', apikey: KEY, authorization: 'Bearer ' + KEY },
    body: JSON.stringify({ p_path: location.pathname, p_ref: ref, p_sid: sid, p_country: g.country || null, p_region: g.region || null, p_city: g.city || null, p_lat: g.lat, p_lon: g.lon }) }).catch(() => { });
  fetch('/api/geo').then(r => r.json()).then(send, () => send({}));
})();
