// The login page: sign in, create an account with a live username check, Google, Steam.
(async function () {
  const $ = id => document.getElementById(id), sb = Cloud.sb, q = new URLSearchParams(location.search);
  const views = ['main', 'name', 'closed', 'mail'], show = v => views.forEach(x => $('v-' + x).hidden = x !== v);
  const NAME = /^[A-Za-z0-9_]{3,16}$/;
  function mark(el, state) { el.className = 'chk ' + (state || ''); }
  // live username check: green tick when free, red cross when taken
  function nameField(input, chk, msg, onState) {
    let t, seq = 0;
    input.addEventListener('input', () => {
      const v = input.value.trim(); clearTimeout(t); onState(false);
      if (!v) { mark(chk, ''); msg.textContent = '3 to 16 letters, numbers or underscores.'; msg.className = ''; return; }
      if (!NAME.test(v)) { mark(chk, 'bad'); msg.textContent = v.length < 3 ? 'Too short.' : 'Letters, numbers and underscores only.'; msg.className = 'bad'; return; }
      mark(chk, 'wait'); msg.textContent = 'Checking…'; msg.className = '';
      const mine = ++seq; t = setTimeout(async () => {
        let free = false; try { free = await Cloud.nameFree(v); } catch (e) { }
        if (mine !== seq) return; mark(chk, free ? 'ok' : 'bad'); msg.textContent = free ? 'Available' : 'Already taken'; msg.className = free ? 'ok' : 'bad'; onState(free);
      }, 350);
    });
  }
  async function route() {
    const s = await Cloud.session(); if (!s) { show('main'); return; }
    Cloud.user = s.user; let me; try { me = await Cloud.whoami(); } catch (e) { show('main'); $('in-err').textContent = 'The city is not answering. Try again in a moment.'; return; }
    if (!me.allowed) { show('closed'); $('closed-email').textContent = 'Signed in as ' + me.email; return; }
    if (!me.profile) {
      const want = (s.user.user_metadata || {}).username;
      if (want && NAME.test(want) && await Cloud.nameFree(want)) { const { error } = await sb.from('os2_profile').insert({ id: s.user.id, username: want }); if (!error) { location.replace('/play'); return; } }
      show('name'); return;
    }
    location.replace('/play');
  }
  // tabs
  document.querySelectorAll('.seg button').forEach(b => b.onclick = () => { document.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b)); $('f-in').hidden = b.dataset.t !== 'in'; $('f-up').hidden = b.dataset.t !== 'up'; });
  // sign in
  $('f-in').onsubmit = async e => { e.preventDefault(); $('in-err').textContent = ''; const { error } = await sb.auth.signInWithPassword({ email: $('in-email').value.trim(), password: $('in-pass').value }); if (error) { $('in-err').textContent = 'That email and password do not match.'; return; } route(); };
  $('forgot').onclick = async () => { const em = $('in-email').value.trim(); if (!em) { $('in-err').textContent = 'Type your email above first.'; return; } await sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + '/login' }); $('in-err').textContent = 'If that email has an account, a reset link is on its way.'; };
  // create account
  let nameOk = false; const upCheck = () => { const p = $('up-pass').value, p2 = $('up-pass2').value; mark($('up-pass-chk'), p ? (p.length >= 8 ? 'ok' : 'bad') : ''); mark($('up-pass2-chk'), p2 ? (p2 === p && p.length >= 8 ? 'ok' : 'bad') : ''); $('up-pass2-msg').textContent = p2 && p2 !== p ? 'The passwords do not match.' : ''; $('up-pass2-msg').className = 'bad'; $('up-go').disabled = !(nameOk && p.length >= 8 && p === p2 && /.+@.+\..+/.test($('up-email').value)); };
  nameField($('up-name'), $('up-name-chk'), $('up-name-msg'), ok => { nameOk = ok; upCheck(); });
  ['up-email', 'up-pass', 'up-pass2'].forEach(i => $(i).addEventListener('input', upCheck));
  $('f-up').onsubmit = async e => {
    e.preventDefault(); $('up-err').textContent = ''; $('up-go').disabled = true;
    const { data, error } = await sb.auth.signUp({ email: $('up-email').value.trim(), password: $('up-pass').value, options: { data: { username: $('up-name').value.trim() }, emailRedirectTo: location.origin + '/login' } });
    if (error) { $('up-err').textContent = /registered/i.test(error.message) ? 'That email already has an account. Sign in instead.' : 'That did not work. ' + error.message; upCheck(); return; }
    if (data.session) route(); else show('mail');
  };
  // pick a name (after Google, or if the first choice was taken meanwhile)
  let nmOk = false; nameField($('nm-name'), $('nm-name-chk'), $('nm-name-msg'), ok => { nmOk = ok; $('nm-go').disabled = !ok; });
  $('f-name').onsubmit = async e => { e.preventDefault(); const { error } = await sb.from('os2_profile').insert({ id: Cloud.user.id, username: $('nm-name').value.trim() }); if (error) { $('nm-err').textContent = /duplicate|unique/i.test(error.message) ? 'Somebody took that a second ago. Try another.' : 'That did not work. Try again.'; return; } location.replace('/play'); };
  $('go-google').onclick = () => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/login' } });
  $('closed-out').onclick = () => Cloud.signOut();
  sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_IN') route(); });
  Cloud.track(); route();
})();
