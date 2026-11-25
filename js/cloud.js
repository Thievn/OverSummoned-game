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
  // ---- the city: friends, mail, guilds, market, boards per skill. In local testing a small pretend city stands in for the server.
  const fake = { friends: [{ username: 'Pemberton', status: 'ok', mine: true, total_level: 212, heroes: 9 }, { username: 'InkyMavis', status: 'pending', mine: false, total_level: 77, heroes: 4 }],
    mail: [{ id: 1, from: 'Pemberton', kind: 'gift', payload: { item: 'x_shard', qty: 2 } }, { id: 2, from: 'InkyMavis', kind: 'sale', payload: { item: 'd_dock_1', qty: 1, gold: 95 } }], guild: null,
    guilds: [{ name: 'The Damp Hoods', members: 7, hauls: 5120 }, { name: 'Ledger Lads', members: 3, hauls: 880 }], open: [{ id: 11, seller: 'Pemberton', item: 'x_shard', qty: 1, price: 120 }, { id: 12, seller: 'InkyMavis', item: 'x_crate', qty: 1, price: 300 }], mine: [], n: 20 };
  const rpc = async (fn, args, dev) => { if (DEV) return dev ? dev() : null; const { data, error } = await sb.rpc(fn, args || {}); if (error) throw error; return data; };
  C.social = () => rpc('os2_social', null, () => ({ friends: fake.friends, mail: fake.mail, guild: fake.guild, guilds: fake.guilds }));
  C.friendAdd = n => rpc('os2_friend_add', { n }, () => { const f = fake.friends.find(x => x.username === n); if (f) { f.status = 'ok'; return 'Friends now.'; } fake.friends.push({ username: n, status: 'pending', mine: true, total_level: 1, heroes: 1 }); return 'Asked.'; });
  C.friendDrop = n => rpc('os2_friend_drop', { n }, () => { fake.friends = fake.friends.filter(x => x.username !== n); });
  C.peek = n => rpc('os2_peek', { n }, () => ({ username: n, total_level: 212, heroes: 3, summons: 40, roster: { lola: 3, brokk: 1, gaius: 2 }, xp: { Fishing: 90000, Digging: 4000, Lockpicking: 800 }, rebirth: { Fishing: 1 }, crew: ['lola', 'brokk', null], cabinet: 14, guild: 'The Damp Hoods', friend: (fake.friends.find(x => x.username === n) || {}).status || null }));
  C.gift = (n, item, qty) => rpc('os2_gift', { n, p_item: item, p_qty: qty }, () => 'ok');
  C.mailClaim = id => rpc('os2_mail_claim', { p_id: id }, () => { const m = fake.mail.find(x => x.id === id); fake.mail = fake.mail.filter(x => x.id !== id); return m ? { kind: m.kind, from: m.from, payload: m.payload } : null; });
  C.guildCreate = n => rpc('os2_guild_create', { n }, () => { fake.guild = { name: n, owner: 'DevOtter', hauls: 340, members: [{ username: 'DevOtter', total_level: 12, hauls: 340 }], chat: [] }; return 'ok'; });
  C.guildJoin = n => rpc('os2_guild_join', { n }, () => { fake.guild = { name: n, owner: 'Pemberton', hauls: 5120, members: [{ username: 'Pemberton', total_level: 212, hauls: 3100 }, { username: 'InkyMavis', total_level: 77, hauls: 2020 }, { username: 'DevOtter', total_level: 12, hauls: 0 }], chat: [{ id: 1, username: 'Pemberton', body: 'Who took the good bucket.' }, { id: 2, username: 'InkyMavis', body: 'It was like that when I found it.' }] }; return 'ok'; });
  C.guildLeave = () => rpc('os2_guild_leave', null, () => { fake.guild = null; });
  C.guildHaul = n => rpc('os2_guild_haul_add', { p_n: n }, () => { if (fake.guild) fake.guild.hauls += n; });
  C.guildSay = body => rpc('os2_guild_say', { p_body: body }, () => { fake.guild.chat.push({ id: ++fake.n, username: 'DevOtter', body }); return 'ok'; });
  C.market = () => rpc('os2_market', null, () => ({ open: fake.open, mine: fake.mine }));
  C.marketList = (item, qty, price) => rpc('os2_market_list', { p_item: item, p_qty: qty, p_price: price }, () => { fake.mine.push({ id: ++fake.n, item, qty, price }); return 'ok'; });
  C.marketCancel = id => rpc('os2_market_cancel', { p_id: id }, () => { const l = fake.mine.find(x => x.id === id); fake.mine = fake.mine.filter(x => x.id !== id); return l ? { item: l.item, qty: l.qty } : null; });
  C.marketBuy = id => rpc('os2_market_buy', { p_id: id }, () => { const l = fake.open.find(x => x.id === id); fake.open = fake.open.filter(x => x.id !== id); return l ? { item: l.item, qty: l.qty, price: l.price } : null; });
  C.boardSkill = sk => rpc('os2_board_skill', { p_skill: sk }, () => [{ username: 'Pemberton', xp: 1.4e7, rebirth: 1 }, { username: 'DevOtter', xp: 90000, rebirth: 0 }]);
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
