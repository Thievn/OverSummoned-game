// Accounts and cloud saves (Supabase). The game never loads without an account.
window.Cloud = (function () {
  const URL = 'https://eresamyqxarlrdgudgrw.supabase.co', KEY = 'sb_publishable_VZn5RjVsoRhLhYW87TJY3Q_CrgicMQF';
  const DEV = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) && /[?&]dev=1/.test(location.search);   // local testing only
  const C = { dev: DEV, me: null, user: null };
  const sb = window.supabase ? window.supabase.createClient(URL, KEY, { auth: { persistSession: true, detectSessionInUrl: true } }) : null;
  C.sb = sb;
  C.session = async () => DEV ? { user: { id: 'dev', email: 'dev@local' } } : (await sb.auth.getSession()).data.session;
  C.whoami = async function () {
    if (DEV) return C.me = { allowed: true, admin: true, email: 'dev@local', profile: { username: 'DevOtter', voice: 'salty' }, providers: ['email'] };
    const { data, error } = await sb.rpc('os2_me'); if (error) throw error; return C.me = data;
  };
  // Sends anyone without a usable account to the login page. Resolves with the account otherwise.
  C.require = async function () {
    const s = await C.session(); if (!s) { location.replace('/login'); return new Promise(() => { }); }
    C.user = s.user; let me;
    try { me = await C.whoami(); } catch (e) { location.replace('/login?err=1'); return new Promise(() => { }); }
    if (!me.allowed) { location.replace('/login?closed=1'); return new Promise(() => { }); }
    if (!me.profile) { location.replace('/login?name=1'); return new Promise(() => { }); }
    return me;
  };
  C.nameFree = async name => DEV ? name.toLowerCase() !== 'taken' : (await sb.rpc('os2_username_free', { name })).data === true;
  C.load = async function () {
    if (DEV) { try { return JSON.parse(localStorage.getItem('os2_dev') || 'null'); } catch (e) { return null; } }
    const { data } = await sb.from('os2_save').select('data').eq('user_id', C.user.id).maybeSingle(); return data ? data.data : null;
  };
  C.save = async function (S, sum) {
    if (DEV) { localStorage.setItem('os2_dev', JSON.stringify(S)); return true; }
    const { error } = await sb.from('os2_save').upsert(Object.assign({ user_id: C.user.id, data: S, updated_at: new Date().toISOString() }, sum)); return !error;
  };
  C.log = (kind, ref, qty) => { if (!DEV && C.user) sb.from('os2_event').insert({ uid: C.user.id, kind, ref: ref || null, qty: qty || 1 }).then(() => { }); };
  C.board = async () => DEV ? [{ username: 'DevOtter', total_level: 12, heroes: 3, summons: 4 }] : ((await sb.rpc('os2_board')).data || []);
  C.setProfile = async patch => DEV ? true : !(await sb.from('os2_profile').update(patch).eq('id', C.user.id)).error;
  C.signOut = async () => { if (!DEV) await sb.auth.signOut(); location.href = '/'; };
  // our own page-view counter: path, where they came from, and a random per-browser id. Nothing else.
  C.track = function () {
    if (DEV || !sb) return; let sid; try { sid = localStorage.getItem('os_sid'); if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('os_sid', sid); } } catch (e) { sid = 'none'; }
    let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { } if (ref === location.hostname) ref = '';
    sb.rpc('os2_track', { p_path: location.pathname, p_ref: ref, p_sid: sid }).then(() => { }, () => { });
  };
  return C;
})();
